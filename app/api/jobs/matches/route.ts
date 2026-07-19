import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { fetchUserRepos, fetchRepoContext, parseRepoUrl } from '@/lib/github'
import { matchJobsForRepos } from '@/lib/job-matching'
import type { JobMatch, JobPosting, GitHubUserRepo } from '@/types'

export const maxDuration = 60

// Mirrors MAX_CANDIDATE_REPOS in lib/job-matching.ts. Duplicated here (not
// exported from there) because this route needs its own view of "which repos
// are candidates" to report per-repo fetch status (JM-8) and to shape the
// grouped-by-repo response (JM-9) even on a cache hit, without reaching into
// lib/job-matching.ts's internals. Keep in sync if that constant changes.
const MAX_CANDIDATE_REPOS = 4

interface JobPostingRow {
  id: string
  source: string
  external_id: string
  title: string
  company: string
  location: string | null
  absolute_url: string
  tech_tags: string[] | null
  posted_at: string | null
  is_active: boolean
}

interface MatchRow {
  matched_repo_name: string
  match_reason: string
  match_rank: number
  job_postings: JobPostingRow | JobPostingRow[] | null
}

type FetchStatus = 'ok' | 'failed'

interface RepoMatchGroup {
  repoName: string
  fetchStatus: FetchStatus
  matches: Array<{
    title: string
    company: string
    location: string | null
    techTags: string[]
    reason: string
    url: string
    matchRank: number
  }>
}

function rowToJobPosting(row: JobPostingRow): JobPosting {
  return {
    id: row.id,
    source: row.source,
    externalId: row.external_id,
    title: row.title,
    company: row.company,
    location: row.location,
    absoluteUrl: row.absolute_url,
    techTags: row.tech_tags ?? [],
    postedAt: row.posted_at,
    isActive: row.is_active,
  }
}

function rowToMatch(row: MatchRow): JobMatch | null {
  const jp = Array.isArray(row.job_postings) ? row.job_postings[0] : row.job_postings
  if (!jp) return null
  return {
    jobPosting: rowToJobPosting(jp),
    matchedRepoName: row.matched_repo_name,
    matchReason: row.match_reason,
    matchRank: row.match_rank,
  }
}

// Groups a flat match list (from the LLM pipeline or from the DB cache) into
// one section per candidate repo, in candidate order, so every candidate
// repo appears even with zero matches (JM-9) — the UI can render a "no
// strong match yet" or retry state per section in a later wave.
function buildGroupedResponse(
  candidateNames: string[],
  matches: JobMatch[],
  statusByRepoName: Map<string, FetchStatus>
): RepoMatchGroup[] {
  const matchesByRepo = new Map<string, JobMatch[]>()
  for (const m of matches) {
    const arr = matchesByRepo.get(m.matchedRepoName) ?? []
    arr.push(m)
    matchesByRepo.set(m.matchedRepoName, arr)
  }

  return candidateNames.map((repoName) => ({
    repoName,
    fetchStatus: statusByRepoName.get(repoName) ?? 'ok',
    matches: (matchesByRepo.get(repoName) ?? [])
      .slice()
      .sort((a, b) => a.matchRank - b.matchRank)
      .map((m) => ({
        title: m.jobPosting.title,
        company: m.jobPosting.company,
        location: m.jobPosting.location,
        techTags: m.jobPosting.techTags,
        reason: m.matchReason,
        url: m.jobPosting.absoluteUrl,
        matchRank: m.matchRank,
      })),
  }))
}

function repoFullName(r: GitHubUserRepo): string | null {
  try {
    const { owner, repo } = parseRepoUrl(r.htmlUrl)
    return `${owner}/${repo}`
  } catch {
    return null
  }
}

// Duplicated from lib/job-matching.ts's fetchRepoOverrides/selectCandidateRepos
// (not exported there) so this route can independently determine the
// candidate repo set for response shaping — see MAX_CANDIDATE_REPOS comment
// above for why.
async function fetchOverrideFullNames(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string[] | null> {
  try {
    const { data, error } = await admin
      .from('user_job_repo_overrides')
      .select('repo_full_name')
      .eq('user_id', userId)
      .order('position', { ascending: true })
    if (error || !data || data.length === 0) return null
    return (data as Array<{ repo_full_name: string }>).map((r) => r.repo_full_name)
  } catch {
    return null
  }
}

function selectCandidateRepos(repos: GitHubUserRepo[], overrideFullNames: string[] | null): GitHubUserRepo[] {
  if (overrideFullNames && overrideFullNames.length > 0) {
    const byFullName = new Map(repos.map((r) => [repoFullName(r), r] as const))
    const selected: GitHubUserRepo[] = []
    for (const fullName of overrideFullNames) {
      const match = byFullName.get(fullName)
      if (match) selected.push(match)
      if (selected.length >= MAX_CANDIDATE_REPOS) break
    }
    if (selected.length > 0) return selected
  }
  return repos.slice(0, MAX_CANDIDATE_REPOS)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceRefresh = searchParams.get('refresh') === '1'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const username = user?.app_metadata?.provider === 'github' ? (user.user_metadata?.user_name as string | undefined) : undefined
  if (!user || !username) {
    return NextResponse.json({ error: 'NOT_GITHUB_CONNECTED' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  let repos: GitHubUserRepo[]
  try {
    repos = await fetchUserRepos(username)
  } catch {
    return NextResponse.json({ error: 'GITHUB_ERROR' }, { status: 502 })
  }

  const overrideFullNames = await fetchOverrideFullNames(admin, user.id)
  const candidates = selectCandidateRepos(repos, overrideFullNames)
  const candidateNames = candidates.map((r) => r.name)

  // Default (no ?refresh=1): serve today's cache if present, unchanged from
  // prior behavior. We didn't re-check fetch status for a cache hit (the
  // pipeline already ran to completion when it was written), so every
  // candidate reports 'ok' here — a repo that fails to fetch shows as "no
  // strong match yet" rather than a distinct failed state until the cache
  // is refreshed.
  if (!forceRefresh) {
    const { data: existing } = await admin
      .from('user_job_matches')
      .select('matched_repo_name, match_reason, match_rank, job_postings(*)')
      .eq('user_id', user.id)
      .eq('match_date', today)
      .order('match_rank', { ascending: true })

    if (existing && existing.length > 0) {
      const matches = (existing as unknown as MatchRow[]).map(rowToMatch).filter((m): m is JobMatch => m !== null)
      const okStatuses = new Map(candidateNames.map((name) => [name, 'ok' as const]))
      return NextResponse.json({ repos: buildGroupedResponse(candidateNames, matches, okStatuses) })
    }
  }

  const { data: activePostingsRaw } = await admin.from('job_postings').select('*').eq('is_active', true).limit(500)
  const activePostings = ((activePostingsRaw as JobPostingRow[] | null) ?? []).map(rowToJobPosting)

  // Fetch per-repo GitHub context ourselves (in addition to what
  // matchJobsForRepos does internally) purely to observe and report
  // per-repo success/failure (JM-8) — the actual matching pipeline still
  // runs on whatever repos succeed, inside matchJobsForRepos.
  const contextResults = await Promise.allSettled(
    candidates.map((r) => {
      const { owner, repo } = parseRepoUrl(r.htmlUrl)
      return fetchRepoContext(owner, repo)
    })
  )
  const statusByRepoName = new Map<string, FetchStatus>(
    candidates.map((r, i) => [r.name, contextResults[i].status === 'fulfilled' ? 'ok' : 'failed'])
  )

  if (activePostings.length === 0) {
    return NextResponse.json({ repos: buildGroupedResponse(candidateNames, [], statusByRepoName) })
  }

  let matches: JobMatch[]
  try {
    matches = await matchJobsForRepos(repos, activePostings, user.id)
  } catch (err) {
    console.error('[RepoMax] job matching failed:', err)
    return NextResponse.json({ error: 'MATCH_ERROR' }, { status: 502 })
  }

  // On a forced refresh, clear out today's previously cached rows first —
  // otherwise a recompute that yields fewer matches than before would leave
  // stale higher-ranked rows behind (upsert only overwrites conflicting
  // ranks, it doesn't delete extras).
  if (forceRefresh) {
    const { error: deleteError } = await admin
      .from('user_job_matches')
      .delete()
      .eq('user_id', user.id)
      .eq('match_date', today)
    if (deleteError) console.error('[RepoMax] user_job_matches delete (refresh) failed:', deleteError)
  }

  if (matches.length > 0) {
    const { error } = await admin.from('user_job_matches').upsert(
      matches.map((m) => ({
        user_id: user.id,
        job_posting_id: m.jobPosting.id,
        matched_repo_name: m.matchedRepoName,
        match_reason: m.matchReason,
        match_rank: m.matchRank,
        match_date: today,
      })),
      { onConflict: 'user_id,match_date,match_rank' }
    )
    if (error) console.error('[RepoMax] user_job_matches upsert failed:', error)
  }

  return NextResponse.json({ repos: buildGroupedResponse(candidateNames, matches, statusByRepoName) })
}
