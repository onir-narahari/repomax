import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { fetchUserRepos } from '@/lib/github'
import { matchJobsForRepos, fetchCandidateRepoContexts, resolveCandidateRepoNames } from '@/lib/job-matching'
import type { JobMatch, JobPosting, GitHubUserRepo } from '@/types'

export const maxDuration = 60

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

  const candidateNames = await resolveCandidateRepoNames(repos, user.id)

  // Default (no ?refresh=1): serve today's cache if present, unchanged from
  // prior behavior. Fetch status for a cache hit is read back from
  // user_job_repo_status (persisted the last time this was freshly computed
  // today) so a repo whose GitHub fetch actually failed still reports
  // 'failed' on reload instead of always showing 'ok'. If that table has no
  // row for a repo (e.g. computed before this table existed) — or the table
  // doesn't exist at all because migration 0003 hasn't been applied yet —
  // fall back to 'ok', same as prior behavior.
  if (!forceRefresh) {
    const { data: existing } = await admin
      .from('user_job_matches')
      .select('matched_repo_name, match_reason, match_rank, job_postings(*)')
      .eq('user_id', user.id)
      .eq('match_date', today)
      .order('match_rank', { ascending: true })

    if (existing && existing.length > 0) {
      const matches = (existing as unknown as MatchRow[]).map(rowToMatch).filter((m): m is JobMatch => m !== null)
      const statuses = new Map<string, FetchStatus>(candidateNames.map((name) => [name, 'ok']))
      try {
        const { data: statusRows, error: statusError } = await admin
          .from('user_job_repo_status')
          .select('repo_name, fetch_status')
          .eq('user_id', user.id)
          .eq('match_date', today)
        if (statusError) {
          console.error('[RepoMax] user_job_repo_status read failed:', statusError)
        } else {
          for (const row of (statusRows as Array<{ repo_name: string; fetch_status: FetchStatus }> | null) ?? []) {
            if (statuses.has(row.repo_name)) statuses.set(row.repo_name, row.fetch_status)
          }
        }
      } catch (err) {
        console.error('[RepoMax] user_job_repo_status read threw:', err)
      }
      return NextResponse.json({ repos: buildGroupedResponse(candidateNames, matches, statuses) })
    }
  }

  const { data: activePostingsRaw } = await admin.from('job_postings').select('*').eq('is_active', true).limit(500)
  const activePostings = ((activePostingsRaw as JobPostingRow[] | null) ?? []).map(rowToJobPosting)

  // Fetch each candidate repo's GitHub context exactly once, shared between
  // the fetchStatus reported below (JM-8) and the matching pipeline itself —
  // matchJobsForRepos consumes these same resolved contexts rather than
  // re-fetching.
  const candidateContexts = await fetchCandidateRepoContexts(repos, user.id)
  const statusByRepoName = new Map<string, FetchStatus>(candidateContexts.map((c) => [c.repoName, c.status]))

  // Best-effort persistence of today's per-repo fetch status so a later
  // same-day cache-hit reload can report real 'failed' states instead of
  // hardcoding 'ok'. This must never block returning match data — if the
  // table doesn't exist yet (migration 0003 not applied), just log and
  // move on.
  if (candidateContexts.length > 0) {
    try {
      const { error: statusUpsertError } = await admin.from('user_job_repo_status').upsert(
        candidateContexts.map((c) => ({
          user_id: user.id,
          match_date: today,
          repo_name: c.repoName,
          fetch_status: c.status,
        })),
        { onConflict: 'user_id,match_date,repo_name' }
      )
      if (statusUpsertError) console.error('[RepoMax] user_job_repo_status upsert failed:', statusUpsertError)
    } catch (err) {
      console.error('[RepoMax] user_job_repo_status upsert threw:', err)
    }
  }

  if (activePostings.length === 0) {
    return NextResponse.json({ repos: buildGroupedResponse(candidateNames, [], statusByRepoName) })
  }

  let matches: JobMatch[]
  try {
    matches = await matchJobsForRepos(candidateContexts, activePostings)
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
