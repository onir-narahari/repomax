import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { fetchUserRepos } from '@/lib/github'
import { resolveCandidateRepoNames } from '@/lib/job-matching'

// GET /api/jobs/candidate-repos — the auto-picked default selection for the
// onboarding confirm screen's first-time state (issue #15,
// docs/prd-job-matching.md §7, §14). Cheap: one GitHub REST call + one
// GraphQL call for pins, no LLM, no embedding. Auth pattern copied from
// GET /api/jobs/matches.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const username = user?.app_metadata?.provider === 'github' ? (user.user_metadata?.user_name as string | undefined) : undefined
  if (!user || !username) {
    return NextResponse.json({ error: 'NOT_GITHUB_CONNECTED' }, { status: 401 })
  }

  try {
    const repos = await fetchUserRepos(username)
    const repoNames = await resolveCandidateRepoNames(repos, username)
    return NextResponse.json({ repoNames })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN'
    const status = msg === 'NOT_FOUND' ? 404 : msg === 'GITHUB_RATE_LIMITED' ? 429 : 502
    return NextResponse.json({ error: 'GITHUB_ERROR' }, { status })
  }
}
