// The precomputed matching engine (issue #16 / docs/prd-job-matching.md §8).
//
// This is the retrieve → rank → rerank funnel that `computeMatchesForUser`
// runs once per user, writing today's `user_job_matches` + `user_job_seen`
// rows. It is intentionally separate from lib/job-matching.ts, which still
// owns the LIVE compute path behind `GET /api/jobs/matches` (kept working
// until issue #17 swaps the read path over to just SELECTing the rows this
// file writes). The two files intentionally share a couple of constants
// (see MAX_TOTAL_MATCHES / TARGET_MATCHES below) so the two engines agree on
// "how many matches" even while both exist.
//
// Design note: the retrieve/rank/dedup/cap math below is written as pure,
// exported, unit-tested functions with no I/O (same pattern as
// lib/job-matching.ts's selectCandidateRepos) — see
// lib/__tests__/matching-engine.test.ts. Only `rerankTopCandidates` (the
// GPT-4o call) and `computeMatchesForUser` (the DB orchestration) touch the
// network/DB, and are not unit tested (no mocking infra exists in this repo
// for OpenAI/Supabase yet) — read them directly to verify correctness.

import OpenAI, { APIConnectionTimeoutError } from 'openai'
import { z } from 'zod'
import { createAdminClient } from './supabase-admin'
import { MAX_TOTAL_MATCHES } from './job-matching'

let _client: OpenAI | null = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepoEmbeddingInput {
  repoName: string
  embedding: number[]
}

export interface JobEmbeddingInput {
  jobPostingId: string
  embedding: number[]
  postedAt: string | null
}

export interface RetrievalCandidate {
  jobPostingId: string
  matchedRepoName: string
  semanticSimilarity: number
}

export interface RankedCandidate extends RetrievalCandidate {
  recencyBoost: number
  score: number
}

export interface RerankedMatch {
  jobPostingId: string
  matchedRepoName: string
  matchReason: string
  confidence: number
}

export interface ComputeMatchesResult {
  userId: string
  repoCount: number
  candidatesRetrieved: number
  matchesWritten: number
}

// ---------------------------------------------------------------------------
// Tunable constants
// ---------------------------------------------------------------------------

// Step 1 (§8.3): how many (repo, job) pairs survive the initial cosine
// retrieval, before drop-seen/dedupe/rank.
export const RETRIEVE_TOP_N = 30

// Step 5 (§8.3): how many ranked candidates get sent to the GPT-4o rerank.
export const RERANK_TOP_N = 10

// Same target as lib/job-matching.ts's live-compute path — see the comment
// on MAX_TOTAL_MATCHES there for why this is 5, not the PRD's illustrative 3.
export const TARGET_MATCHES = MAX_TOTAL_MATCHES

// Matches lib/job-matching.ts's finalizeMatches bar — keep the live and
// precomputed engines' notion of "good enough to show" aligned. This is also
// what "no inflated match %" cashes out to (§8.4): the only score that ever
// gets written or surfaced is this GPT-4o calibrated confidence, never raw
// cosine similarity (which clusters ~85-95% for any plausible pair and would
// look inflated if shown directly).
const MIN_MATCH_CONFIDENCE = 60

// Recency nudges/tie-breaks (§8.3 step 4, §11); it must never swing the
// ranking on its own. Cosine similarity for a real match typically clusters
// ~0.80-0.95, so a max recency boost of 0.05 is small relative to a single
// meaningful similarity gap between two candidates — recency can only flip
// an otherwise-near-tie, not override relevance.
export const RECENCY_BOOST_UNDER_48H = 0.05
export const RECENCY_BOOST_UNDER_7D = 0.03
export const RECENCY_BOOST_UNDER_14D = 0.01
export const RECENCY_BOOST_STALE = 0

const HOURS_48 = 48
const HOURS_7D = 24 * 7
const HOURS_14D = 24 * 14

// Bounds the active job pool pulled per run. Brute-force cosine over this
// many vectors in app code is still microseconds-to-low-milliseconds (PRD
// §8) — this just caps query/payload size as the pool grows past ~1000.
const JOB_POOL_LIMIT = 2000

// ---------------------------------------------------------------------------
// Pure functions — retrieve / rank / dedupe / cap. No I/O; unit tested.
// ---------------------------------------------------------------------------

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Step 1 (§8.3): cosine every (repo, job) pair and keep the top N overall —
// not per-repo. A user's strongest repo can legitimately claim more of this
// initial pool; per-repo balance is enforced later by applyPerRepoCap, not
// here.
export function retrieveTopCandidates(
  repos: RepoEmbeddingInput[],
  jobs: JobEmbeddingInput[],
  topN: number = RETRIEVE_TOP_N
): RetrievalCandidate[] {
  const pairs: RetrievalCandidate[] = []
  for (const repo of repos) {
    for (const job of jobs) {
      pairs.push({
        jobPostingId: job.jobPostingId,
        matchedRepoName: repo.repoName,
        semanticSimilarity: cosineSimilarity(repo.embedding, job.embedding),
      })
    }
  }
  return pairs.sort((a, b) => b.semanticSimilarity - a.semanticSimilarity).slice(0, topN)
}

// Step 2 (§8.3): drop postings already shown to this user.
export function dropSeen(
  candidates: RetrievalCandidate[],
  seenJobPostingIds: ReadonlySet<string>
): RetrievalCandidate[] {
  return candidates.filter((c) => !seenJobPostingIds.has(c.jobPostingId))
}

// Step 3 (§8.3): the same posting can appear once per repo it was paired
// with during retrieval — collapse to a single entry, keeping whichever repo
// scored it highest.
export function dedupeByHighestScoringRepo(candidates: RetrievalCandidate[]): RetrievalCandidate[] {
  const bestByJob = new Map<string, RetrievalCandidate>()
  for (const c of candidates) {
    const existing = bestByJob.get(c.jobPostingId)
    if (!existing || c.semanticSimilarity > existing.semanticSimilarity) {
      bestByJob.set(c.jobPostingId, c)
    }
  }
  return Array.from(bestByJob.values())
}

// Step 4 (§8.3, §11): posted <48h → strong boost, <7d → medium, <14d →
// small, older → none.
export function recencyBoost(postedAt: string | null, now: Date): number {
  if (!postedAt) return RECENCY_BOOST_STALE
  const posted = new Date(postedAt)
  if (Number.isNaN(posted.getTime())) return RECENCY_BOOST_STALE
  const ageHours = (now.getTime() - posted.getTime()) / (1000 * 60 * 60)
  if (ageHours < HOURS_48) return RECENCY_BOOST_UNDER_48H
  if (ageHours < HOURS_7D) return RECENCY_BOOST_UNDER_7D
  if (ageHours < HOURS_14D) return RECENCY_BOOST_UNDER_14D
  return RECENCY_BOOST_STALE
}

// Step 4 (§8.3): score = semantic_similarity + recency_boost − penalties.
// There's no separate penalty term (a seen posting is already dropped by
// dropSeen upstream; a weak match is filtered by the confidence gate after
// rerank, downstream) — this is where a future penalty signal would plug in.
export function rankCandidates(
  candidates: RetrievalCandidate[],
  postedAtByJobId: ReadonlyMap<string, string | null>,
  now: Date
): RankedCandidate[] {
  return candidates
    .map((c) => {
      const boost = recencyBoost(postedAtByJobId.get(c.jobPostingId) ?? null, now)
      return { ...c, recencyBoost: boost, score: c.semanticSimilarity + boost }
    })
    .sort((a, b) => b.score - a.score)
}

// §8.5: the adaptive per-repo cap. repoCount is the user's TOTAL committed
// repo count (not just repos that happen to have a surviving candidate) so a
// 1- or 2-repo user still gets the full cap even when only one of their
// repos has anything worth showing — the cap must never prevent filling the
// set when there are few repos.
export function computeRepoCap(targetMatches: number, repoCount: number): number {
  if (repoCount <= 0) return targetMatches
  return Math.max(2, Math.ceil(targetMatches / repoCount))
}

// Steps 6+7 (§8.3): assumes `matches` is already confidence-gated and
// sorted best-first. Enforces the adaptive per-repo cap and the overall
// target, keeping the highest-confidence matches when trimming. No
// fallback/flex — a user whose gated matches don't fill the target
// legitimately ends up with fewer, including zero ("send fewer, not
// weaker" — §8.3 step 6, §11).
export function applyPerRepoCap(
  matches: RerankedMatch[],
  repoCount: number,
  targetMatches: number = TARGET_MATCHES
): RerankedMatch[] {
  const cap = computeRepoCap(targetMatches, repoCount)
  const perRepoCount = new Map<string, number>()
  const capped: RerankedMatch[] = []
  for (const m of matches) {
    if (capped.length >= targetMatches) break
    const count = perRepoCount.get(m.matchedRepoName) ?? 0
    if (count >= cap) continue
    perRepoCount.set(m.matchedRepoName, count + 1)
    capped.push(m)
  }
  return capped
}

// pgvector columns can come back from supabase-js either already parsed as a
// JS array, or as a Postgres array-literal string like "[0.01,-0.02,...]"
// depending on the query/client path. Normalize both defensively; treat
// anything else (null, malformed, wrong shape) as "not embedded yet" rather
// than throwing — a repo/posting without an embedding is an expected state
// (profile-build or ingest embedding hasn't run/finished for it yet), not a
// bug this function should crash on.
export function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw)) {
    return raw.every((v) => typeof v === 'number' && Number.isFinite(v)) ? (raw as number[]) : null
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null
    const inner = trimmed.slice(1, -1)
    if (inner.length === 0) return null
    const parts = inner.split(',').map((p) => Number(p.trim()))
    return parts.every((n) => Number.isFinite(n)) ? parts : null
  }
  return null
}

// ---------------------------------------------------------------------------
// Rerank (I/O — calls OpenAI). Mirrors the tool-call + zod-validation pattern
// from lib/job-matching.ts's rerankAndExplain, adapted so the repo
// attribution (already fixed by retrieval/dedupe) is judged and explained,
// not reassigned.
// ---------------------------------------------------------------------------

interface RerankCandidateInput {
  jobPostingId: string
  matchedRepoName: string
  title: string
  company: string
  location: string | null
  techTags: string[]
}

interface RepoSummaryInput {
  repoName: string
  summaryText: string
}

const RerankSelectionSchema = z.object({
  matches: z
    .array(
      z.object({
        candidateIndex: z.number().int().min(0),
        matchReason: z.string().min(15).max(200),
        confidence: z.number().min(0).max(100),
      })
    )
    .min(0)
    .max(RERANK_TOP_N),
})

const RERANK_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'rerank_job_matches',
    description:
      'Given a pre-shortlisted set of (repo, posting) candidate pairs, order the genuinely strong ones best-first and explain each. The repo attribution is already fixed by upstream retrieval — judge whether the pairing is actually strong, do not reassign a candidate to a different repo.',
    parameters: {
      type: 'object',
      required: ['matches'],
      properties: {
        matches: {
          type: 'array',
          minItems: 0,
          maxItems: RERANK_TOP_N,
          items: {
            type: 'object',
            required: ['candidateIndex', 'matchReason', 'confidence'],
            properties: {
              candidateIndex: {
                type: 'integer',
                description: 'Index into the provided candidate list (0-based).',
              },
              matchReason: {
                type: 'string',
                description:
                  'One sentence, grounded only in overlapping stack/project type between the named repo and the posting. Never invent fit — no "great culture fit" or unsupported claims.',
              },
              confidence: {
                type: 'number',
                description:
                  '0-100: how genuinely strong the overlap is (shared language/framework/project domain). Score honestly — do not default to a high number. A tenuous or generic overlap should score low (well under 50), not be included anyway at a high score.',
              },
            },
          },
        },
      },
    },
  },
}

// Adapted from lib/job-matching.ts's RERANK_SYSTEM_PROMPT — same honesty
// rules, but here retrieval has already fixed each candidate's repo
// attribution (highest-cosine match), so the model's job is to judge, order,
// and explain the given pairs, not pick fresh ones.
const RERANK_SYSTEM_PROMPT = `You are matching a CS student's GitHub projects to open internship software engineering roles.

You'll be given a pre-shortlisted list of candidate (repo, posting) pairs, already narrowed down by semantic similarity. For each pair, decide if there's real overlap — shared language, framework, or project domain (e.g. a repo using React/Node matches a full-stack posting; an ML repo matches an ML engineering posting).

Order the genuinely strong pairs best-first. Drop pairs with only a tenuous or generic overlap rather than including them anyway — it is correct and expected to return fewer than the full list, including zero, when overlap is weak.

For each pair you keep, write one concise, specific sentence naming the repo it's grounded in and what actually overlaps with the posting. Never claim culture fit, career growth, or anything not backed by the repo's actual stack. Score confidence honestly (0-100) — this is used downstream to filter out weak matches, so an inflated score defeats the purpose.`

async function rerankTopCandidates(
  candidates: RerankCandidateInput[],
  repoSummaries: RepoSummaryInput[]
): Promise<RerankedMatch[]> {
  if (candidates.length === 0) return []

  const repoSummaryByName = new Map(repoSummaries.map((r) => [r.repoName, r.summaryText]))
  const candidateList = candidates
    .map((c, i) => {
      const summary = repoSummaryByName.get(c.matchedRepoName) ?? c.matchedRepoName
      return `[${i}] Repo "${c.matchedRepoName}" (${summary}) <-> ${c.title} @ ${c.company}${c.location ? ` (${c.location})` : ''} — tags: ${c.techTags.join(', ') || 'none'}`
    })
    .join('\n')

  let response: OpenAI.Chat.ChatCompletion
  try {
    response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 900,
      messages: [
        { role: 'system', content: RERANK_SYSTEM_PROMPT },
        { role: 'user', content: `Candidate pairs:\n${candidateList}` },
      ],
      tools: [RERANK_TOOL],
      tool_choice: { type: 'function', function: { name: 'rerank_job_matches' } },
    })
  } catch (err) {
    if (err instanceof APIConnectionTimeoutError) throw new Error('LLM_TIMEOUT')
    throw new Error('LLM_ERROR')
  }

  const toolCall = response.choices[0]?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.type !== 'function') throw new Error('LLM_PARSE_ERROR')

  let parsed: z.infer<typeof RerankSelectionSchema>
  try {
    parsed = RerankSelectionSchema.parse(JSON.parse(toolCall.function.arguments))
  } catch {
    throw new Error('LLM_PARSE_ERROR')
  }

  const matches: RerankedMatch[] = []
  for (const m of parsed.matches) {
    const candidate = candidates[m.candidateIndex]
    if (!candidate) continue
    matches.push({
      jobPostingId: candidate.jobPostingId,
      matchedRepoName: candidate.matchedRepoName,
      matchReason: m.matchReason,
      confidence: m.confidence,
    })
  }
  return matches
}

// ---------------------------------------------------------------------------
// Orchestration (I/O — Supabase reads/writes + the rerank call above). This
// is the single entry point both the 8am cron (future issue) and the
// onboarding confirm step (future issue) will call directly.
// ---------------------------------------------------------------------------

interface ProfileRepoRow {
  repo_name: string
  profile_text: string | null
  embedding: unknown
}

interface JobPostingRow {
  id: string
  title: string
  company: string
  location: string | null
  tech_tags: string[] | null
  posted_at: string | null
  embedding: unknown
}

export async function computeMatchesForUser(userId: string): Promise<ComputeMatchesResult> {
  const admin = createAdminClient()

  // --- Load the user's committed repo profile + embeddings ---
  const { data: repoRows, error: repoErr } = await admin
    .from('user_job_profile_repos')
    .select('repo_name, profile_text, embedding')
    .eq('user_id', userId)

  if (repoErr) throw new Error(`PROFILE_REPOS_FETCH_FAILED: ${repoErr.message}`)

  const profileRepos = (repoRows ?? []) as ProfileRepoRow[]
  const repoEmbeddings: RepoEmbeddingInput[] = []
  const repoSummaries: RepoSummaryInput[] = []
  for (const r of profileRepos) {
    const embedding = parseEmbedding(r.embedding)
    if (!embedding) continue // not embedded yet — skip it, don't fail the whole run
    repoEmbeddings.push({ repoName: r.repo_name, embedding })
    repoSummaries.push({ repoName: r.repo_name, summaryText: r.profile_text ?? r.repo_name })
  }

  // No embedded committed repos → nothing to match against (e.g. the user
  // hasn't onboarded, or profile-build hasn't finished for them yet). This
  // is the expected "0 usable repos" state, not an error.
  if (repoEmbeddings.length === 0) {
    return { userId, repoCount: 0, candidatesRetrieved: 0, matchesWritten: 0 }
  }

  // --- Load all active job embeddings (shared across every user) ---
  const { data: jobRows, error: jobErr } = await admin
    .from('job_postings')
    .select('id, title, company, location, tech_tags, posted_at, embedding')
    .eq('is_active', true)
    .not('embedding', 'is', null)
    .limit(JOB_POOL_LIMIT)

  if (jobErr) throw new Error(`JOB_POSTINGS_FETCH_FAILED: ${jobErr.message}`)

  const jobPostings = (jobRows ?? []) as JobPostingRow[]
  const jobById = new Map<string, JobPostingRow>()
  const jobEmbeddings: JobEmbeddingInput[] = []
  for (const j of jobPostings) {
    const embedding = parseEmbedding(j.embedding)
    if (!embedding) continue
    jobById.set(j.id, j)
    jobEmbeddings.push({ jobPostingId: j.id, embedding, postedAt: j.posted_at })
  }

  if (jobEmbeddings.length === 0) {
    return { userId, repoCount: repoEmbeddings.length, candidatesRetrieved: 0, matchesWritten: 0 }
  }

  // --- Load this user's seen-ledger (freshness memory) ---
  const { data: seenRows, error: seenErr } = await admin
    .from('user_job_seen')
    .select('job_posting_id')
    .eq('user_id', userId)

  if (seenErr) throw new Error(`SEEN_FETCH_FAILED: ${seenErr.message}`)
  const seenIds = new Set((seenRows ?? []).map((r) => r.job_posting_id as string))

  // --- Retrieve → drop seen → dedupe → rank (pure funnel, see above) ---
  const retrieved = retrieveTopCandidates(repoEmbeddings, jobEmbeddings)
  const unseen = dropSeen(retrieved, seenIds)
  const deduped = dedupeByHighestScoringRepo(unseen)
  const postedAtByJobId = new Map(jobPostings.map((j) => [j.id, j.posted_at]))
  const ranked = rankCandidates(deduped, postedAtByJobId, new Date())
  const topForRerank = ranked.slice(0, RERANK_TOP_N)

  if (topForRerank.length === 0) {
    return {
      userId,
      repoCount: repoEmbeddings.length,
      candidatesRetrieved: retrieved.length,
      matchesWritten: 0,
    }
  }

  // --- Rerank the top ~10 with GPT-4o ---
  const rerankInputs: RerankCandidateInput[] = topForRerank.map((c) => {
    const job = jobById.get(c.jobPostingId)
    // jobById is built from the same jobPostings this candidate's id came
    // from, so this can't miss — narrow defensively rather than `!`.
    return {
      jobPostingId: c.jobPostingId,
      matchedRepoName: c.matchedRepoName,
      title: job?.title ?? '',
      company: job?.company ?? '',
      location: job?.location ?? null,
      techTags: job?.tech_tags ?? [],
    }
  })

  const reranked = await rerankTopCandidates(rerankInputs, repoSummaries)

  // --- Gate: send fewer, not weaker ---
  const gated = reranked
    .filter((m) => m.confidence >= MIN_MATCH_CONFIDENCE)
    .sort((a, b) => b.confidence - a.confidence)

  // --- Adaptive per-repo cap ---
  const finalMatches = applyPerRepoCap(gated, repoEmbeddings.length, TARGET_MATCHES)

  if (finalMatches.length === 0) {
    return {
      userId,
      repoCount: repoEmbeddings.length,
      candidatesRetrieved: retrieved.length,
      matchesWritten: 0,
    }
  }

  // --- Write today's matches + extend the seen-ledger ---
  const today = new Date().toISOString().slice(0, 10)
  const matchRows = finalMatches.map((m, i) => ({
    user_id: userId,
    job_posting_id: m.jobPostingId,
    matched_repo_name: m.matchedRepoName,
    match_reason: m.matchReason,
    match_rank: i + 1,
    match_date: today,
    confidence: m.confidence,
  }))

  const { error: writeErr } = await admin
    .from('user_job_matches')
    .upsert(matchRows, { onConflict: 'user_id,match_date,match_rank' })

  if (writeErr) throw new Error(`MATCHES_WRITE_FAILED: ${writeErr.message}`)

  const seenRowsToInsert = finalMatches.map((m) => ({
    user_id: userId,
    job_posting_id: m.jobPostingId,
  }))

  const { error: seenWriteErr } = await admin
    .from('user_job_seen')
    .upsert(seenRowsToInsert, { onConflict: 'user_id,job_posting_id', ignoreDuplicates: true })

  if (seenWriteErr) throw new Error(`SEEN_WRITE_FAILED: ${seenWriteErr.message}`)

  return {
    userId,
    repoCount: repoEmbeddings.length,
    candidatesRetrieved: retrieved.length,
    matchesWritten: finalMatches.length,
  }
}
