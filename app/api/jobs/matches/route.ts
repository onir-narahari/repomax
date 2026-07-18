import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { fetchUserRepos } from '@/lib/github'
import { matchJobsForRepos } from '@/lib/job-matching'
import type { JobMatch, JobPosting } from '@/types'

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

  const { data: existing } = await admin
    .from('user_job_matches')
    .select('matched_repo_name, match_reason, match_rank, job_postings(*)')
    .eq('user_id', user.id)
    .eq('match_date', today)
    .order('match_rank', { ascending: true })

  if (existing && existing.length > 0) {
    const matches = (existing as unknown as MatchRow[]).map(rowToMatch).filter((m): m is JobMatch => m !== null)
    return NextResponse.json({ matches })
  }

  let repos
  try {
    repos = await fetchUserRepos(username)
  } catch {
    return NextResponse.json({ error: 'GITHUB_ERROR' }, { status: 502 })
  }

  const { data: activePostingsRaw } = await admin.from('job_postings').select('*').eq('is_active', true).limit(500)

  const activePostings = ((activePostingsRaw as JobPostingRow[] | null) ?? []).map(rowToJobPosting)

  if (activePostings.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  let matches: JobMatch[]
  try {
    matches = await matchJobsForRepos(repos, activePostings)
  } catch (err) {
    console.error('[RepoMax] job matching failed:', err)
    return NextResponse.json({ error: 'MATCH_ERROR' }, { status: 502 })
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

  return NextResponse.json({ matches })
}
