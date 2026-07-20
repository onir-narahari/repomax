import OpenAI, { APIConnectionTimeoutError } from 'openai'
import { z } from 'zod'
import { deriveTechTags } from './job-postings'
import { fetchRepoContext, fetchPinnedRepoNames, parseRepoUrl } from './github'
import type { GitHubUserRepo, JobPosting, JobMatch, RepoContext } from '@/types'

let _client: OpenAI | null = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

const SHORTLIST_PER_REPO = 8
// Target committed set size (docs/prd-job-matching.md §7) — repo selection
// only engages scoring/pinning above this; at or below it, every usable repo
// is used with no ranking.
export const MAX_CANDIDATE_REPOS = 5
// Tune these against real match output — see docs/prd-job-matching-revamp.md.
const MIN_MATCH_CONFIDENCE = 60
const MAX_MATCHES_PER_REPO = 2
const MAX_TOTAL_MATCHES = 5

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
        confidence: z.number().min(0).max(100),
      })
    )
    .min(0)
    .max(5),
})

const SELECT_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'select_job_matches',
    description:
      'Pick up to 5 of the best-fit job postings for this candidate and explain why each one fits. Spread picks across the candidate\'s repos rather than grounding them all in a single repo, unless only one repo was provided.',
    parameters: {
      type: 'object',
      required: ['matches'],
      properties: {
        matches: {
          type: 'array',
          minItems: 0,
          maxItems: 5,
          items: {
            type: 'object',
            required: ['jobIndex', 'matchedRepoName', 'matchReason', 'confidence'],
            properties: {
              jobIndex: { type: 'integer', description: 'Index into the provided job list (0-based).' },
              matchedRepoName: { type: 'string', description: 'Which of the candidate\'s repos this match is grounded in.' },
              matchReason: {
                type: 'string',
                description:
                  'One sentence, grounded only in overlapping stack/project type between the repo and the posting. Never invent fit — no "great culture fit" or unsupported claims.',
              },
              confidence: {
                type: 'number',
                description:
                  '0-100: how genuinely strong the overlap is between this repo and this posting (shared language/framework/project domain). Score honestly — do not default to a high number. A tenuous or generic overlap should score low (well under 50), not be omitted-but-included-anyway at a high score.',
              },
            },
          },
        },
      },
    },
  },
}

const RERANK_SYSTEM_PROMPT = `You are matching a CS student's GitHub projects to open internship software engineering roles.

Pick up to 5 postings from the provided list that best match the candidate's repos, ranked best first. Only pick a posting if there's real overlap — shared language, framework, or project domain (e.g. a repo using React/Node matches a full-stack posting; an ML repo matches an ML engineering posting).

Spread matches across the candidate's repos — do not ground them all in the same repo just because it has the strongest tags. Prefer at most 2 matches from any single repo, and prefer covering more repos over piling multiple matches onto one, unless other repos genuinely have no reasonable match in the list. Never force a weak match just to hit an even split or fill a quota — it is correct and expected to return fewer than 5, including zero, when overlap is weak.

For each match, write one concise, specific sentence naming which repo it's grounded in and what actually overlaps. Never claim culture fit, career growth, or anything not backed by the repo's actual stack. Score \`confidence\` honestly (0-100) — this is used downstream to filter out weak matches, so an inflated score defeats the purpose.`

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
      confidence: m.confidence,
    })
  })
  return matches
}

// Name heuristics for coursework/tutorial repos (docs/prd-job-matching.md
// §7.2) — these look like real projects by size/stars but don't represent a
// student's own work.
const PENALIZED_NAME_PATTERNS: RegExp[] = [
  /tutorial/i,
  /(^|[-_])hw\d*($|[-_])/i,
  /assignment/i,
  /cs\d{2,4}/i,
  /clone/i,
  /^learn-/i,
  /dotfiles/i,
]

function hasPenalizedName(name: string): boolean {
  return name.startsWith('.') || PENALIZED_NAME_PATTERNS.some((p) => p.test(name))
}

const NAME_PENALTY = 40
const DESCRIPTION_BONUS = 15
const TOPICS_BONUS_PER_TOPIC = 3
const TOPICS_BONUS_CAP = 12
const SIZE_BONUS_CAP = 12
const RECENCY_BONUS_CAP = 8
const RECENCY_DECAY_DAYS = 30 // ~1 point lost per month since last update
const STAR_BONUS_CAP = 5
// Candidates within this many points of each other are treated as a close
// score (docs/prd-job-matching.md §7.2: "break toward tech/domain diversity
// on close scores" rather than piling onto the single top-scoring stack).
const CLOSE_SCORE_MARGIN = 8

function scoreRepo(repo: GitHubUserRepo, now: number): number {
  let score = 0

  if (repo.description && repo.description.trim().length > 0) score += DESCRIPTION_BONUS
  if (repo.topics.length > 0) score += Math.min(repo.topics.length * TOPICS_BONUS_PER_TOPIC, TOPICS_BONUS_CAP)

  score += Math.min(Math.log10(repo.size + 1) * 4, SIZE_BONUS_CAP)
  score += Math.min(Math.log10(repo.stars + 1) * 2, STAR_BONUS_CAP)

  const ageDays = (now - new Date(repo.updatedAt).getTime()) / 86_400_000
  score += Math.max(0, RECENCY_BONUS_CAP - ageDays / RECENCY_DECAY_DAYS)

  if (hasPenalizedName(repo.name)) score -= NAME_PENALTY

  return score
}

// Fills `count` slots from `candidates` by composite score, breaking close
// scores toward language diversity instead of always taking the next-highest
// score — a student's second-best web app shouldn't crowd out their one ML
// repo just because it scores a couple points higher. Never filters anyone
// out for a low/negative score: if every candidate is penalized, the top
// `count` (by score) are still returned.
function selectByCompositeScore(candidates: GitHubUserRepo[], count: number, now: number): GitHubUserRepo[] {
  const remaining = candidates
    .map((repo) => ({ repo, score: scoreRepo(repo, now) }))
    .sort((a, b) => b.score - a.score)

  const selected: GitHubUserRepo[] = []
  const usedLanguages = new Set<string>()

  while (selected.length < count && remaining.length > 0) {
    const topScore = remaining[0].score
    const closeCount = remaining.findIndex((c) => c.score < topScore - CLOSE_SCORE_MARGIN)
    const closeCandidates = remaining.slice(0, closeCount === -1 ? remaining.length : closeCount)

    let pickIdx = closeCandidates.findIndex((c) => !c.repo.language || !usedLanguages.has(c.repo.language))
    if (pickIdx === -1) pickIdx = 0

    const [pick] = remaining.splice(pickIdx, 1)
    selected.push(pick.repo)
    if (pick.repo.language) usedLanguages.add(pick.repo.language)
  }

  return selected
}

// Picks the candidate repo set (docs/prd-job-matching.md §7). Pure function
// of the repo list + pinned repo names so it's directly unit-testable
// without hitting GitHub. `now` defaults to the real clock but can be pinned
// in tests since recency is one of the scoring signals.
export function selectCandidateRepos(
  repos: GitHubUserRepo[],
  pinnedNames: string[] = [],
  now: number = Date.now()
): GitHubUserRepo[] {
  if (repos.length <= MAX_CANDIDATE_REPOS) return repos

  const pinnedSet = new Set(pinnedNames)
  const pinned = pinnedNames
    .map((name) => repos.find((r) => r.name === name))
    .filter((r): r is GitHubUserRepo => r !== undefined)
    .slice(0, MAX_CANDIDATE_REPOS)

  if (pinned.length >= MAX_CANDIDATE_REPOS) return pinned

  const unpinned = repos.filter((r) => !pinnedSet.has(r.name))
  const filled = selectByCompositeScore(unpinned, MAX_CANDIDATE_REPOS - pinned.length, now)

  return [...pinned, ...filled]
}

// Drops matches whose matchedRepoName isn't one of the actual candidate
// repos (never trust the LLM's attribution blindly), drops anything below
// the confidence bar, then enforces the per-repo and total caps — keeping
// the highest-confidence matches when trimming. No fallback/flex: a repo or
// user with nothing that clears the bar correctly ends up with fewer
// matches, including zero.
function finalizeMatches(matches: JobMatch[], profiles: RepoProfile[]): JobMatch[] {
  const validRepoNames = new Set(profiles.map((p) => p.repoName))
  const validated = matches.filter((m) => validRepoNames.has(m.matchedRepoName))
  const aboveThreshold = validated.filter((m) => (m.confidence ?? 0) >= MIN_MATCH_CONFIDENCE)
  const sorted = [...aboveThreshold].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))

  const perRepoCount = new Map<string, number>()
  const capped: JobMatch[] = []
  for (const m of sorted) {
    if (capped.length >= MAX_TOTAL_MATCHES) break
    const count = perRepoCount.get(m.matchedRepoName) ?? 0
    if (count >= MAX_MATCHES_PER_REPO) continue
    perRepoCount.set(m.matchedRepoName, count + 1)
    capped.push(m)
  }

  return capped.map((m, i) => ({ ...m, matchRank: i + 1 }))
}

// Per-repo result of fetchCandidateRepoContexts: 'ok' repos carry their
// fetched RepoContext, 'failed' ones don't (fetch threw/rejected).
export interface CandidateRepoContext {
  repoName: string
  status: 'ok' | 'failed'
  context?: RepoContext
}

// Resolves the candidate repo set (fetching the user's pinned repos via
// GitHub GraphQL when `username` is given, see selectCandidateRepos) and
// fetches each candidate's GitHub context exactly once. This is the ONLY
// place fetchRepoContext is called for job matching — callers that need
// per-repo fetch status (e.g. the API route, for JM-8) AND the actual
// matching pipeline (matchJobsForRepos) should both consume this function's
// output rather than re-deriving candidates or re-fetching.
export async function fetchCandidateRepoContexts(
  repos: GitHubUserRepo[],
  username?: string
): Promise<CandidateRepoContext[]> {
  const pinnedNames = username ? await fetchPinnedRepoNames(username) : []
  const candidates = selectCandidateRepos(repos, pinnedNames)

  const results = await Promise.allSettled(
    candidates.map((r) => {
      const { owner, repo } = parseRepoUrl(r.htmlUrl)
      return fetchRepoContext(owner, repo)
    })
  )

  return candidates.map((r, i) => {
    const result = results[i]
    return result.status === 'fulfilled'
      ? { repoName: r.name, status: 'ok' as const, context: result.value }
      : { repoName: r.name, status: 'failed' as const }
  })
}

// Resolves just the candidate repo names (same selection logic as
// fetchCandidateRepoContexts, including pinned repos) without fetching any
// GitHub context. For callers that need to know which repos are candidates
// — e.g. to shape a cache-hit response — without paying for a fetch pass.
export async function resolveCandidateRepoNames(repos: GitHubUserRepo[], username?: string): Promise<string[]> {
  const pinnedNames = username ? await fetchPinnedRepoNames(username) : []
  return selectCandidateRepos(repos, pinnedNames).map((r) => r.name)
}

// Matches a set of already-fetched candidate repo contexts (see
// fetchCandidateRepoContexts) against the active job posting pool. Repos
// with status 'failed' are skipped, same as a dropped Promise.allSettled
// rejection was before. Callers are responsible for resolving candidates and
// fetching contexts up front (via fetchCandidateRepoContexts) — this
// function does no selection or fetching of its own.
export async function matchJobsForRepos(
  candidateContexts: CandidateRepoContext[],
  activeJobPostings: JobPosting[]
): Promise<JobMatch[]> {
  if (activeJobPostings.length === 0) return []

  const profiles = candidateContexts
    .filter((c): c is CandidateRepoContext & { context: RepoContext } => c.status === 'ok' && !!c.context)
    .map((c) => buildRepoProfile(c.context))

  if (profiles.length === 0) return []

  const shortlist = shortlistJobs(profiles, activeJobPostings)
  const rawMatches = await rerankAndExplain(profiles, shortlist)
  return finalizeMatches(rawMatches, profiles)
}
