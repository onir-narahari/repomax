import OpenAI, { APIConnectionTimeoutError } from 'openai'
import { z } from 'zod'
import { deriveTechTags } from './job-postings'
import { fetchRepoContext, parseRepoUrl } from './github'
import { createAdminClient } from './supabase-admin'
import type { GitHubUserRepo, JobPosting, JobMatch, RepoContext } from '@/types'

let _client: OpenAI | null = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

const SHORTLIST_PER_REPO = 8
export const MAX_CANDIDATE_REPOS = 4
// Tune these against real match output — see docs/prd-job-matching-revamp.md.
const MIN_MATCH_CONFIDENCE = 60
const MAX_MATCHES_PER_REPO = 2
// Exported: shared with lib/matching-engine.ts as its TARGET_MATCHES. The PRD's
// funnel diagram (docs/prd-job-matching.md §8) and §8.5's worked examples
// illustrate "3", but migration 0002 already raised user_job_matches.match_rank's
// cap to 1-5 and this live-compute path already targets 5 — the PRD's "3"
// predates that cap raise. Keep this at 5, don't "fix" it back down to 3.
export const MAX_TOTAL_MATCHES = 5

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

function repoFullName(r: GitHubUserRepo): string | null {
  try {
    const { owner, repo } = parseRepoUrl(r.htmlUrl)
    return `${owner}/${repo}`
  } catch {
    return null
  }
}

interface RepoOverride {
  position: number
  repoFullName: string
}

// Returns saved repo overrides for a user (position + repo_full_name),
// ordered by position, or null if the user has none set (or the lookup
// fails) — callers should treat null the same as "no override, use
// auto-selection."
async function fetchRepoOverrides(userId: string): Promise<RepoOverride[] | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('user_job_repo_overrides')
      .select('position, repo_full_name')
      .eq('user_id', userId)
      .order('position', { ascending: true })
    if (error || !data || data.length === 0) return null
    return (data as Array<{ position: number; repo_full_name: string }>).map((r) => ({
      position: r.position,
      repoFullName: r.repo_full_name,
    }))
  } catch {
    return null
  }
}

// Picks the candidate repo set: starts from the auto-selected repos (N most
// recently updated — repos is already sorted by updatedAt, filtered to
// non-fork/non-empty, see fetchUserRepos) and merges saved overrides into
// their specific slots on top, rather than replacing the whole list. Each
// override is matched against the user's real current repos — a
// stale/deleted repo name is ignored, not blindly trusted. If an override's
// repo would duplicate another slot, the duplicate is dropped and backfilled
// from the next best auto-pick not already used, so the result stays at up
// to MAX_CANDIDATE_REPOS distinct repos.
function selectCandidateRepos(repos: GitHubUserRepo[], overrides: RepoOverride[] | null): GitHubUserRepo[] {
  const auto = repos.slice(0, MAX_CANDIDATE_REPOS)
  if (!overrides || overrides.length === 0) return auto

  const byFullName = new Map(repos.map((r) => [repoFullName(r), r] as const))
  const resolved = overrides
    .filter((o) => o.position >= 0 && o.position < MAX_CANDIDATE_REPOS)
    .map((o) => ({ position: o.position, repo: byFullName.get(o.repoFullName) ?? null }))
    .filter((o): o is { position: number; repo: GitHubUserRepo } => o.repo !== null)

  // None of the overrides resolved to a real current repo — fall through to
  // auto-selection rather than silently matching against nothing.
  if (resolved.length === 0) return auto

  // One slot per position, defaulting to the auto-pick that would otherwise
  // land there, then drop each resolved override into its specific slot.
  const slots: Array<GitHubUserRepo | null> = Array.from({ length: MAX_CANDIDATE_REPOS }, (_, i) => auto[i] ?? null)
  for (const { position, repo } of resolved) {
    slots[position] = repo
  }

  // Dedupe: keep the first occurrence of a given repo (lower position wins)
  // and clear any later slot that duplicates it, so it can be backfilled.
  const kept = new Set<string>()
  for (let i = 0; i < slots.length; i++) {
    const name = slots[i] ? repoFullName(slots[i] as GitHubUserRepo) : null
    if (!name) continue
    if (kept.has(name)) {
      slots[i] = null
    } else {
      kept.add(name)
    }
  }

  // Backfill empty slots (from dedup, or a position beyond what
  // auto-selection alone would have filled) with the next best auto-pick not
  // already used elsewhere.
  const backfillPool = repos.filter((r) => {
    const name = repoFullName(r)
    return name !== null && !kept.has(name)
  })
  let poolIdx = 0
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] !== null) continue
    while (poolIdx < backfillPool.length) {
      const candidate = backfillPool[poolIdx++]
      const name = repoFullName(candidate)
      if (name && !kept.has(name)) {
        slots[i] = candidate
        kept.add(name)
        break
      }
    }
  }

  return slots.filter((r): r is GitHubUserRepo => r !== null)
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

// Resolves the candidate repo set (honoring saved overrides when `userId` is
// given) and fetches each candidate's GitHub context exactly once. This is
// the ONLY place fetchRepoContext is called for job matching — callers that
// need per-repo fetch status (e.g. the API route, for JM-8) AND the actual
// matching pipeline (matchJobsForRepos) should both consume this function's
// output rather than re-deriving candidates or re-fetching.
export async function fetchCandidateRepoContexts(
  repos: GitHubUserRepo[],
  userId?: string
): Promise<CandidateRepoContext[]> {
  const overrides = userId ? await fetchRepoOverrides(userId) : null
  const candidates = selectCandidateRepos(repos, overrides)

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
// fetchCandidateRepoContexts, honoring overrides) without fetching any
// GitHub context. For callers that need to know which repos are candidates
// — e.g. to shape a cache-hit response — without paying for a fetch pass.
export async function resolveCandidateRepoNames(repos: GitHubUserRepo[], userId?: string): Promise<string[]> {
  const overrides = userId ? await fetchRepoOverrides(userId) : null
  return selectCandidateRepos(repos, overrides).map((r) => r.name)
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
