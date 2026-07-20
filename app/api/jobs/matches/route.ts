import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import type { JobMatch, JobPosting } from '@/types'

// Single fast DB read now (issue #17) — no GitHub fetch, no LLM call — so the
// old 60s budget for the live-compute path is way more than this needs.
export const maxDuration = 15

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

interface RepoMatchGroup {
  repoName: string
  // No more per-repo live GitHub fetch that can fail — matches are read
  // straight from precomputed rows. Kept in the shape (always 'ok') so the
  // existing frontend types/rendering don't need a breaking change.
  fetchStatus: 'ok'
  matches: Array<{
    title: string
    company: string
    location: string | null
    techTags: string[]
    reason: string
    url: string
    matchRank: number
    postedAt: string | null
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

// Groups today's flat match list into one section per committed repo, in
// committed-repo order, so every repo appears even with zero matches today
// (docs/prd-job-matching.md §14) — the UI renders a "no strong match yet"
// state per section. Sorted by matchRank ascending within a repo, which is
// already relevance-leads/recency-nudges order from the matching engine
// (§8.3 step 4) — no separate re-sort needed for "newest-relevant first".
function buildGroupedResponse(candidateNames: string[], matches: JobMatch[]): RepoMatchGroup[] {
  const matchesByRepo = new Map<string, JobMatch[]>()
  for (const m of matches) {
    const arr = matchesByRepo.get(m.matchedRepoName) ?? []
    arr.push(m)
    matchesByRepo.set(m.matchedRepoName, arr)
  }

  return candidateNames.map((repoName) => ({
    repoName,
    fetchStatus: 'ok' as const,
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
        postedAt: m.jobPosting.postedAt,
      })),
  }))
}

// DB-only read path (issue #17, docs/prd-job-matching.md §9 & §14): all the
// expensive work (GitHub fetches, embeddings, LLM rerank) already happened
// at onboarding / the 8am cron (lib/matching-engine.ts's
// computeMatchesForUser), which wrote today's rows. This route only ever
// reads them — a single DB query, so the page loads instantly. `?refresh=1`
// (still sent by the frontend's "Refresh matches" button) is a harmless
// no-op: there's no live recompute to trigger anymore, so it just re-runs
// this same cheap read.
export async function GET() {
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

  // Candidate repos are the user's committed set from onboarding (issue
  // #14's profile build), not a live GitHub fetch + selection pass.
  const { data: profileRepos, error: profileReposError } = await admin
    .from('user_job_profile_repos')
    .select('repo_name')
    .eq('user_id', user.id)

  if (profileReposError) {
    console.error('[RepoMax] user_job_profile_repos read failed:', profileReposError)
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 502 })
  }

  const candidateNames = ((profileRepos as Array<{ repo_name: string }> | null) ?? []).map((r) => r.repo_name)
  if (candidateNames.length === 0) {
    return NextResponse.json({ repos: [] })
  }

  const { data: existing, error: matchesError } = await admin
    .from('user_job_matches')
    .select('matched_repo_name, match_reason, match_rank, job_postings(*)')
    .eq('user_id', user.id)
    .eq('match_date', today)
    .order('match_rank', { ascending: true })

  if (matchesError) {
    console.error('[RepoMax] user_job_matches read failed:', matchesError)
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 502 })
  }

  const matches = ((existing as unknown as MatchRow[] | null) ?? [])
    .map(rowToMatch)
    .filter((m): m is JobMatch => m !== null)

  return NextResponse.json({ repos: buildGroupedResponse(candidateNames, matches) })
}
