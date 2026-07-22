// Profile build (issue #14 / docs/prd-job-matching.md §8.1, §14).
//
// Owns the confirm-step pipeline: persist the user's confirmed repo set,
// build a per-repo skill profile + embedding once per repo, and trigger the
// first/updated match. This is the ONLY place that writes
// `user_job_profile` / `user_job_profile_repos` — the daily 8am cron and the
// live `GET /api/jobs/matches` read path never touch GitHub or an LLM again
// once a repo's row exists here.
//
// Kept separate from lib/job-matching.ts (the OLD live-compute path, still
// serving `GET /api/jobs/matches` until issue #17 swaps it to a DB read) and
// lib/matching-engine.ts (issue #16's retrieve/rank/rerank funnel, which
// this file calls into via computeMatchesForUser but never modifies) — same
// three-file split those two issues established.
//
// Design note: the diffing decision (which committed repos need a fresh
// LLM+embedding build vs. deletion vs. leaving untouched) is a pure,
// exported, unit-tested function with no I/O — see diffProfileRepos below
// and lib/__tests__/profile-build.test.ts. Everything else here (GitHub
// fetch, LLM skill extraction, embedding, Supabase reads/writes) is I/O and
// not unit tested (no mocking infra exists in this repo for
// GitHub/OpenAI/Supabase, same caveat as lib/matching-engine.ts) — read it
// directly to verify correctness.

import OpenAI, { APIConnectionTimeoutError } from 'openai'
import { z } from 'zod'
import { fetchRepoContext, fetchPinnedRepoNames, fetchUserRepos, parseRepoUrl } from './github'
import { createAdminClient } from './supabase-admin'
import { computeMatchesForUser, type ComputeMatchesResult } from './matching-engine'
import type { GitHubUserRepo, RepoContext } from '@/types'

let _client: OpenAI | null = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

const EMBEDDING_MODEL = 'text-embedding-3-small'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Stored verbatim in user_job_profile_repos.skills (jsonb). Key names are
// internal — nothing outside this file/route depends on the exact shape.
export interface RepoSkills {
  languages: string[]
  frameworks: string[]
  infra: string[]
  domain: string
  whatWasBuilt: string
}

export interface RepoProfileBuild {
  skills: RepoSkills
  profileText: string
}

export interface ProfileDiff {
  toBuild: string[]
  toDelete: string[]
  toKeep: string[]
}

export interface ProfileBuildResult {
  built: string[]
  kept: string[]
  deleted: string[]
  skipped: string[]
  onboardedAt: string
  status: 'active' | 'needs_reonboarding'
  match: ComputeMatchesResult
}

// ---------------------------------------------------------------------------
// Pure functions — no I/O, unit tested.
// ---------------------------------------------------------------------------

// The diffing rule (see file header + design decisions in issue #14):
// - confirmed but no existing row  -> build fresh (LLM + embed)
// - existing row but not confirmed -> delete
// - in both                        -> keep untouched, no recompute
//
// Operates on whatever identifier the caller passes (here, repo_full_name —
// the unique key on user_job_profile_repos) so it's agnostic to how that
// identifier is derived.
export function diffProfileRepos(
  confirmedFullNames: readonly string[],
  existingFullNames: readonly string[]
): ProfileDiff {
  const confirmedSet = new Set(confirmedFullNames)
  const existingSet = new Set(existingFullNames)

  return {
    toBuild: confirmedFullNames.filter((f) => !existingSet.has(f)),
    toDelete: existingFullNames.filter((f) => !confirmedSet.has(f)),
    toKeep: confirmedFullNames.filter((f) => existingSet.has(f)),
  }
}

// Resolves the request body's confirmed repo names (bare `name`, per the
// POST /api/jobs/profile contract — see the route file) against a freshly
// fetched repo list. A confirmed name that isn't in the fresh fetch is
// dropped into `skipped` rather than erroring — this is what makes "a
// missing/renamed repo is skipped gracefully" trivial: the frontend's
// confirmed set can lag reality (repo renamed/deleted/made private/forked
// since the user last saw the confirm screen) and the route just treats it
// as not-currently-confirmed.
export function resolveConfirmedRepos(
  requestedRepoNames: readonly string[],
  freshRepos: readonly GitHubUserRepo[]
): { confirmed: GitHubUserRepo[]; skipped: string[] } {
  const byName = new Map(freshRepos.map((r) => [r.name, r] as const))
  const requestedSet = new Set(requestedRepoNames)

  const confirmed: GitHubUserRepo[] = []
  const seen = new Set<string>()
  for (const name of requestedSet) {
    const repo = byName.get(name)
    if (repo) {
      confirmed.push(repo)
      seen.add(name)
    }
  }

  const skipped = [...requestedSet].filter((name) => !seen.has(name))
  return { confirmed, skipped }
}

// `user_job_profile_repos.repo_full_name` = "owner/repo". A user's own repos
// (fetchUserRepos) are always owned by them, but we derive this from the
// repo's htmlUrl (like lib/job-matching.ts's repoFullName helper) rather
// than assuming `${username}/${name}` — same source of truth GitHub gives
// us, no duplicated assumption.
export function repoFullName(repo: GitHubUserRepo): string | null {
  try {
    const { owner, repo: name } = parseRepoUrl(repo.htmlUrl)
    return `${owner}/${name}`
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Skill extraction (I/O — calls OpenAI). One call per repo, grounded only in
// already-fetched RepoContext fields — never re-fetches anything.
// ---------------------------------------------------------------------------

const SkillExtractionSchema = z.object({
  languages: z.array(z.string().min(1)).max(10),
  frameworks: z.array(z.string().min(1)).max(10),
  infra: z.array(z.string().min(1)).max(10),
  domain: z.string().min(1).max(200),
  whatWasBuilt: z.string().min(1).max(500),
  profileText: z.string().min(1).max(400),
})

const SKILL_EXTRACT_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'extract_repo_skill_profile',
    description:
      'Extract a structured skill profile from a single GitHub repo, grounded only in the provided evidence. Never invent languages, frameworks, users, scale, or metrics not backed by the evidence.',
    parameters: {
      type: 'object',
      required: ['languages', 'frameworks', 'infra', 'domain', 'whatWasBuilt', 'profileText'],
      properties: {
        languages: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 10,
          description: 'Programming languages actually used (from primary language + languages breakdown).',
        },
        frameworks: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 10,
          description: 'Frameworks/libraries actually used, from dependencies and tech stack evidence.',
        },
        infra: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 10,
          description: 'Infra/tooling actually used (databases, deployment, CI, testing) from the evidence.',
        },
        domain: {
          type: 'string',
          description: 'One short phrase for the project domain/category (e.g. "real-time chat", "ML data pipeline", "CLI dev tool").',
        },
        whatWasBuilt: {
          type: 'string',
          description: 'One or two sentences on what was actually built, grounded in description/README/structure. No invented users, scale, or metrics.',
        },
        profileText: {
          type: 'string',
          description:
            'A single distilled natural-language paragraph (1-2 sentences) summarizing the repo for semantic matching against job postings, e.g. "Real-time chat app with Next.js, WebSockets, Postgres." Specific, not generic. No fabricated numbers.',
        },
      },
    },
  },
}

const SKILL_EXTRACT_SYSTEM_PROMPT = `You extract a structured skill profile from a single GitHub repo for a CS student's job-matching profile.

Ground everything in the evidence given — description, primary language, topics, a README excerpt, dependencies, and an already-computed categorized tech stack. Never invent languages, frameworks, users, revenue, scale, latency, accuracy, or percentages that aren't backed by the evidence. If the evidence is thin, keep fields short and honest rather than padding them.

Also produce a short distilled natural-language paragraph (profileText) describing the project for semantic matching against job postings — specific and technical, not generic marketing language.`

function repoContextToEvidence(ctx: RepoContext): string {
  const stack = ctx.structuredFacts.categorizedTechStack
  const stackLines = (Object.entries(stack) as Array<[string, string[]]>)
    .filter(([, deps]) => deps.length > 0)
    .map(([category, deps]) => `${category}: ${deps.join(', ')}`)

  const readmeExcerpt = ctx.readme ? ctx.readme.slice(0, 2000) : null

  return [
    `Repo name: ${ctx.name}`,
    ctx.description ? `Description: ${ctx.description}` : null,
    `Primary language: ${ctx.primaryLanguage ?? 'unknown'}`,
    ctx.topics.length ? `Topics: ${ctx.topics.join(', ')}` : null,
    `Project type (heuristically derived): ${ctx.structuredFacts.projectType}`,
    ctx.dependencies.length ? `Dependencies: ${ctx.dependencies.slice(0, 30).join(', ')}` : null,
    stackLines.length ? `Categorized tech stack:\n${stackLines.join('\n')}` : null,
    readmeExcerpt ? `README excerpt:\n${readmeExcerpt}` : 'No README found.',
  ]
    .filter(Boolean)
    .join('\n')
}

// Extracts the structured skill profile + distilled profile_text for one
// repo. Throws (LLM_ERROR / LLM_TIMEOUT / LLM_PARSE_ERROR) on failure — the
// caller decides whether that repo gets skipped.
export async function extractRepoSkillProfile(ctx: RepoContext): Promise<RepoProfileBuild> {
  const evidence = repoContextToEvidence(ctx)

  let response: OpenAI.Chat.ChatCompletion
  try {
    response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: 'system', content: SKILL_EXTRACT_SYSTEM_PROMPT },
        { role: 'user', content: evidence },
      ],
      tools: [SKILL_EXTRACT_TOOL],
      tool_choice: { type: 'function', function: { name: 'extract_repo_skill_profile' } },
    })
  } catch (err) {
    if (err instanceof APIConnectionTimeoutError) throw new Error('LLM_TIMEOUT')
    throw new Error('LLM_ERROR')
  }

  const toolCall = response.choices[0]?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.type !== 'function') throw new Error('LLM_PARSE_ERROR')

  let parsed: z.infer<typeof SkillExtractionSchema>
  try {
    parsed = SkillExtractionSchema.parse(JSON.parse(toolCall.function.arguments))
  } catch {
    throw new Error('LLM_PARSE_ERROR')
  }

  return {
    skills: {
      languages: parsed.languages,
      frameworks: parsed.frameworks,
      infra: parsed.infra,
      domain: parsed.domain,
      whatWasBuilt: parsed.whatWasBuilt,
    },
    profileText: parsed.profileText,
  }
}

// Embeds many repos' profile_text in as few OpenAI calls as possible — one
// call per EMBEDDING_BATCH_SIZE texts, not one call per repo (same batching
// shape as lib/job-postings.ts's embedJobPostings). Still one vector per
// repo (§8.1: per-repo, not blended, so matches attribute cleanly and
// diversity is natural); matches lib/matching-engine.ts's expectations:
// 1536-dim, text-embedding-3-small. Keyed by fullName so callers can merge
// embeddings back onto the row they belong to. If a batch call fails, every
// repo in that batch is simply missing from the returned map rather than
// throwing — the caller treats a missing embedding as a build failure for
// just those repos.
const EMBEDDING_BATCH_SIZE = 100

async function embedProfileTexts(
  entries: { fullName: string; profileText: string }[]
): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>()

  for (let i = 0; i < entries.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = entries.slice(i, i + EMBEDDING_BATCH_SIZE)
    try {
      const response = await getClient().embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch.map((e) => e.profileText),
      })
      for (const e of response.data) {
        if (e.embedding) embeddings.set(batch[e.index].fullName, e.embedding)
      }
    } catch (err) {
      console.error('[RepoMax] profile embedding batch failed:', err)
    }
  }

  return embeddings
}

// ---------------------------------------------------------------------------
// Orchestration (I/O — GitHub, OpenAI, Supabase). Single entry point for
// POST /api/jobs/profile.
// ---------------------------------------------------------------------------

interface ExistingProfileRepoRow {
  repo_full_name: string
}

interface BuiltRow {
  user_id: string
  repo_full_name: string
  repo_name: string
  pinned: boolean
  skills: RepoSkills
  profile_text: string
  embedding: number[]
  updated_at: string
}

// Same as BuiltRow but before the (now-batched) embedding step has run.
type BuiltRowSkills = Omit<BuiltRow, 'embedding'>

// Builds one committed repo's row up through skill extraction: fetch
// context once, LLM-extract skills + profile_text. Embedding happens
// separately, batched across all repos in the caller (see
// embedProfileTexts) rather than per-repo here. Never throws — a
// fetch/LLM failure for this one repo is caught and reported via the
// returned discriminant so a missing/renamed repo (or a transient LLM
// hiccup) is skipped gracefully without failing the whole profile build.
async function buildOneRepoSkills(
  userId: string,
  fullName: string,
  repo: GitHubUserRepo,
  pinnedNames: ReadonlySet<string>
): Promise<{ status: 'built'; row: BuiltRowSkills } | { status: 'skipped'; repoName: string }> {
  try {
    const { owner, repo: repoPath } = parseRepoUrl(repo.htmlUrl)
    const ctx = await fetchRepoContext(owner, repoPath)
    const { skills, profileText } = await extractRepoSkillProfile(ctx)

    return {
      status: 'built',
      row: {
        user_id: userId,
        repo_full_name: fullName,
        repo_name: repo.name,
        pinned: pinnedNames.has(repo.name),
        skills,
        profile_text: profileText,
        updated_at: new Date().toISOString(),
      },
    }
  } catch (err) {
    console.error(`[RepoMax] profile build skipped repo "${repo.name}":`, err)
    return { status: 'skipped', repoName: repo.name }
  }
}

// Persists the user's confirmed repo set, (re)builds per-repo skill
// profiles + embeddings only for what changed, upserts user_job_profile,
// and runs the first/updated match. See the route file for the exact
// request/response contract this backs.
export async function buildUserJobProfile(
  userId: string,
  username: string,
  requestedRepoNames: readonly string[]
): Promise<ProfileBuildResult> {
  const admin = createAdminClient()

  // fetchUserRepos throwing (rate limit, GitHub outage, bad username) is
  // fatal to this request — without a fresh repo list we can't safely
  // resolve which confirmed names still exist. Let it propagate; the route
  // maps it to a 502.
  const freshRepos = await fetchUserRepos(username)
  const { confirmed, skipped: skippedNotFound } = resolveConfirmedRepos(requestedRepoNames, freshRepos)

  const confirmedByFullName = new Map<string, GitHubUserRepo>()
  for (const repo of confirmed) {
    const fullName = repoFullName(repo)
    if (fullName) confirmedByFullName.set(fullName, repo)
  }
  const confirmedFullNames = [...confirmedByFullName.keys()]

  const { data: existingRows, error: existingErr } = await admin
    .from('user_job_profile_repos')
    .select('repo_full_name')
    .eq('user_id', userId)

  if (existingErr) throw new Error(`PROFILE_REPOS_FETCH_FAILED: ${existingErr.message}`)

  const existingFullNames = ((existingRows ?? []) as ExistingProfileRepoRow[]).map((r) => r.repo_full_name)
  const diff = diffProfileRepos(confirmedFullNames, existingFullNames)

  // Best-effort — fetchPinnedRepoNames already swallows its own errors and
  // returns [] rather than throwing, per lib/github.ts.
  const pinnedNames = new Set(await fetchPinnedRepoNames(username))

  // Delete repos the user un-confirmed (removed from the committed set,
  // including the "renamed on GitHub so it silently dropped out of the
  // confirmed set" case — §12).
  if (diff.toDelete.length > 0) {
    const { error: deleteErr } = await admin
      .from('user_job_profile_repos')
      .delete()
      .eq('user_id', userId)
      .in('repo_full_name', diff.toDelete)
    if (deleteErr) throw new Error(`PROFILE_REPOS_DELETE_FAILED: ${deleteErr.message}`)
  }

  // Build only the newly-confirmed repos — a repo already in toKeep is left
  // completely untouched, no LLM/embedding call.
  const buildTargets = diff.toBuild
    .map((fullName) => ({ fullName, repo: confirmedByFullName.get(fullName) }))
    .filter((t): t is { fullName: string; repo: GitHubUserRepo } => !!t.repo)

  const skillResults = await Promise.all(
    buildTargets.map((t) => buildOneRepoSkills(userId, t.fullName, t.repo, pinnedNames))
  )

  const builtSkillRows = skillResults
    .filter((r): r is { status: 'built'; row: BuiltRowSkills } => r.status === 'built')
    .map((r) => r.row)
  const skippedBuildFailures = skillResults
    .filter((r): r is { status: 'skipped'; repoName: string } => r.status === 'skipped')
    .map((r) => r.repoName)

  // One batched embeddings call for every repo that made it through skill
  // extraction, instead of one OpenAI call per repo.
  const embeddingsByFullName = await embedProfileTexts(
    builtSkillRows.map((row) => ({ fullName: row.repo_full_name, profileText: row.profile_text }))
  )

  const builtRows: BuiltRow[] = []
  for (const row of builtSkillRows) {
    const embedding = embeddingsByFullName.get(row.repo_full_name)
    if (!embedding) {
      console.error(`[RepoMax] profile build skipped repo "${row.repo_name}": embedding missing after batch`)
      skippedBuildFailures.push(row.repo_name)
      continue
    }
    builtRows.push({ ...row, embedding })
  }

  if (builtRows.length > 0) {
    const { error: insertErr } = await admin
      .from('user_job_profile_repos')
      .upsert(builtRows, { onConflict: 'user_id,repo_full_name' })
    if (insertErr) throw new Error(`PROFILE_REPOS_INSERT_FAILED: ${insertErr.message}`)
  }

  const builtNames = builtRows.map((r) => r.repo_name)
  const keptNames = diff.toKeep.map((fullName) => confirmedByFullName.get(fullName)?.name ?? fullName)
  const deletedNames = diff.toDelete

  // user_job_profile upsert: onboarded_at is set once and preserved on every
  // later edit; updated_at always advances; status stays 'active' (dropping
  // to 0 repos is still a valid "active, empty" profile state per §12 — the
  // empty-state UI is a later concern, not a new status value).
  const { data: existingProfile, error: profileReadErr } = await admin
    .from('user_job_profile')
    .select('onboarded_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileReadErr) throw new Error(`PROFILE_READ_FAILED: ${profileReadErr.message}`)

  const nowIso = new Date().toISOString()
  const onboardedAt = existingProfile?.onboarded_at ?? nowIso

  const { error: profileUpsertErr } = await admin.from('user_job_profile').upsert(
    {
      user_id: userId,
      onboarded_at: onboardedAt,
      updated_at: nowIso,
      status: 'active' as const,
    },
    { onConflict: 'user_id' }
  )

  if (profileUpsertErr) throw new Error(`PROFILE_UPSERT_FAILED: ${profileUpsertErr.message}`)

  // Always run last: produces the first/updated match set. Handles 0
  // committed repos gracefully (matchesWritten: 0, see lib/matching-engine.ts).
  const match = await computeMatchesForUser(userId)

  return {
    built: builtNames,
    kept: keptNames,
    deleted: deletedNames,
    skipped: [...skippedNotFound, ...skippedBuildFailures],
    onboardedAt,
    status: 'active',
    match,
  }
}
