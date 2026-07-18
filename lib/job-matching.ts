import OpenAI, { APIConnectionTimeoutError } from 'openai'
import { z } from 'zod'
import { deriveTechTags } from './job-postings'
import { fetchRepoContext, parseRepoUrl } from './github'
import type { GitHubUserRepo, JobPosting, JobMatch, RepoContext } from '@/types'

let _client: OpenAI | null = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

const SHORTLIST_PER_REPO = 8
const MAX_CANDIDATE_REPOS = 3

interface RepoProfile {
  repoName: string
  tags: string[]
  summaryText: string
}

function buildRepoProfile(ctx: RepoContext): RepoProfile {
  const text = [
    ctx.name,
    ctx.description ?? '',
    ctx.primaryLanguage ?? '',
    ctx.topics.join(' '),
    ctx.dependencies.join(' '),
  ].join(' ')

  return {
    repoName: ctx.name,
    tags: deriveTechTags(text),
    summaryText: [
      `Repo: ${ctx.name}`,
      ctx.description ? `Description: ${ctx.description}` : null,
      `Primary language: ${ctx.primaryLanguage ?? 'unknown'}`,
      `Project type: ${ctx.structuredFacts.projectType}`,
      ctx.dependencies.length ? `Key dependencies: ${ctx.dependencies.slice(0, 15).join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

// Shortlists per repo (not globally) so a repo with fewer/weaker tags still
// gets real candidates in front of the LLM, instead of the single
// strongest-tagged repo dominating the whole pool and the rerank step
// converging on it for all 3 picks.
function shortlistJobs(profiles: RepoProfile[], jobs: JobPosting[]): JobPosting[] {
  const activeJobs = jobs.filter((j) => j.isActive)
  const seen = new Set<string>()
  const shortlist: JobPosting[] = []

  for (const profile of profiles) {
    const repoTagSet = new Set(profile.tags)
    const scored = activeJobs
      .map((job) => ({ job, overlap: job.techTags.filter((t) => repoTagSet.has(t)).length }))
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, SHORTLIST_PER_REPO)

    for (const { job } of scored) {
      if (seen.has(job.id)) continue
      seen.add(job.id)
      shortlist.push(job)
    }
  }

  return shortlist
}

const MatchSelectionSchema = z.object({
  matches: z
    .array(
      z.object({
        jobIndex: z.number().int().min(0),
        matchedRepoName: z.string().min(1),
        matchReason: z.string().min(15).max(200),
      })
    )
    .min(1)
    .max(3),
})

const SELECT_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'select_job_matches',
    description:
      'Pick up to 3 of the best-fit job postings for this candidate and explain why each one fits. Spread picks across the candidate\'s repos rather than grounding all 3 in a single repo, unless only one repo was provided.',
    parameters: {
      type: 'object',
      required: ['matches'],
      properties: {
        matches: {
          type: 'array',
          minItems: 1,
          maxItems: 3,
          items: {
            type: 'object',
            required: ['jobIndex', 'matchedRepoName', 'matchReason'],
            properties: {
              jobIndex: { type: 'integer', description: 'Index into the provided job list (0-based).' },
              matchedRepoName: { type: 'string', description: 'Which of the candidate\'s repos this match is grounded in.' },
              matchReason: {
                type: 'string',
                description:
                  'One sentence, grounded only in overlapping stack/project type between the repo and the posting. Never invent fit — no "great culture fit" or unsupported claims.',
              },
            },
          },
        },
      },
    },
  },
}

const RERANK_SYSTEM_PROMPT = `You are matching a CS student's GitHub projects to open internship software engineering roles.

Pick up to 3 postings from the provided list that best match the candidate's repos, ranked best first. Only pick a posting if there's real overlap — shared language, framework, or project domain (e.g. a repo using React/Node matches a full-stack posting; an ML repo matches an ML engineering posting).

Spread the 3 matches across the candidate's repos — do not ground all 3 in the same repo just because it has the strongest tags. Given N candidate repos:
- 3 repos provided: prefer one match per repo (one each).
- 2 repos provided: prefer a 2-1 split across them, not 3-0.
- 1 repo provided: all 3 matches may come from it — there's nothing else to draw from.
Only deviate from this (e.g. 2 matches from one repo when 2+ repos are available) when a repo genuinely has no reasonable match in the list — never force a weak match just to hit an even split.

For each match, write one concise, specific sentence naming which repo it's grounded in and what actually overlaps. Never claim culture fit, career growth, or anything not backed by the repo's actual stack. If fewer than 3 postings genuinely overlap, return fewer than 3 — do not force a weak match.`

async function rerankAndExplain(profiles: RepoProfile[], shortlist: JobPosting[]): Promise<JobMatch[]> {
  if (shortlist.length === 0) return []

  const jobList = shortlist
    .map((j, i) => `[${i}] ${j.title} @ ${j.company}${j.location ? ` (${j.location})` : ''} — tags: ${j.techTags.join(', ') || 'none'}`)
    .join('\n')

  const repoList = profiles.map((p) => p.summaryText).join('\n\n')

  const userMsg = `Candidate's repos:\n\n${repoList}\n\nOpen postings:\n${jobList}`

  let response: OpenAI.Chat.ChatCompletion
  try {
    response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 700,
      messages: [
        { role: 'system', content: RERANK_SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
      tools: [SELECT_TOOL],
      tool_choice: { type: 'function', function: { name: 'select_job_matches' } },
    })
  } catch (err) {
    if (err instanceof APIConnectionTimeoutError) throw new Error('LLM_TIMEOUT')
    throw new Error('LLM_ERROR')
  }

  const toolCall = response.choices[0]?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.type !== 'function') throw new Error('LLM_PARSE_ERROR')

  let parsed: z.infer<typeof MatchSelectionSchema>
  try {
    parsed = MatchSelectionSchema.parse(JSON.parse(toolCall.function.arguments))
  } catch {
    throw new Error('LLM_PARSE_ERROR')
  }

  const matches: JobMatch[] = []
  parsed.matches.forEach((m, i) => {
    const job = shortlist[m.jobIndex]
    if (!job) return
    matches.push({
      jobPosting: job,
      matchedRepoName: m.matchedRepoName,
      matchReason: m.matchReason,
      matchRank: i + 1,
    })
  })
  return matches.slice(0, 3)
}

// Matches a user's 3 most recently updated repos against the active job
// posting pool. Repos are already sorted by updatedAt (see fetchUserRepos).
export async function matchJobsForRepos(repos: GitHubUserRepo[], activeJobPostings: JobPosting[]): Promise<JobMatch[]> {
  const candidates = repos.slice(0, MAX_CANDIDATE_REPOS)
  if (candidates.length === 0 || activeJobPostings.length === 0) return []

  const contexts = await Promise.allSettled(
    candidates.map((r) => {
      const { owner, repo } = parseRepoUrl(r.htmlUrl)
      return fetchRepoContext(owner, repo)
    })
  )

  const profiles = contexts
    .filter((r): r is PromiseFulfilledResult<RepoContext> => r.status === 'fulfilled')
    .map((r) => buildRepoProfile(r.value))

  if (profiles.length === 0) return []

  const shortlist = shortlistJobs(profiles, activeJobPostings)
  return rerankAndExplain(profiles, shortlist)
}
