import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { buildUserJobProfile } from '@/lib/profile-build'

// POST /api/jobs/profile — persists the authenticated user's confirmed repo
// set, builds a per-repo skill profile + embedding once per NEW/changed
// repo, and runs the first/updated match (docs/prd-job-matching.md §8.1,
// §14). Replaces the old repo-overrides endpoint (§13 "Retired").
//
// Request body contract (issue #15's onboarding UI must match this exactly):
//   { "repoNames": string[] }
// `repoNames` is an array of bare GitHub repo names — the `name` field of
// GitHubUserRepo, e.g. "my-project", NOT "owner/my-project". The route
// re-fetches the user's current repos from GitHub and matches confirmed
// names against that fresh list; a name that no longer resolves (deleted,
// renamed, made private, or never existed) is silently dropped rather than
// erroring — see `skipped` in the response.
//
// `repoNames: []` is valid and means "commit zero repos" — this deletes any
// existing committed repos, and computeMatchesForUser naturally produces the
// empty match state.
//
// Response shape:
//   {
//     "profile": { "onboardedAt": string, "status": "active" },
//     "repos": {
//       "built": string[],   // repo names newly fetched+LLM-extracted+embedded this call
//       "kept": string[],    // repo names already committed, left untouched (no LLM/embed call)
//       "deleted": string[], // repo full names ("owner/repo") removed from the committed set
//       "skipped": string[]  // confirmed repo names dropped (missing/renamed/private, or a
//                             // per-repo fetch/LLM/embedding failure) — never causes a 4xx/5xx
//     },
//     "match": { "matchesWritten": number, "candidatesRetrieved": number, "repoCount": number }
//   }
//
// This is a genuinely slow endpoint (per-repo LLM extraction, an embedding
// call per new repo, then computeMatchesForUser's own GPT-4o rerank) — that
// matches the PRD's one-time "Analyzing your projects…" wait at onboarding
// (§9), not a regression.
export const maxDuration = 60

interface ProfileRequestBody {
  repoNames: string[]
}

function parseRequestBody(body: unknown): ProfileRequestBody | null {
  if (typeof body !== 'object' || body === null) return null
  const repoNames = (body as Record<string, unknown>).repoNames
  if (!Array.isArray(repoNames)) return null
  if (!repoNames.every((n) => typeof n === 'string')) return null
  return { repoNames }
}

// GET /api/jobs/profile — companion read to the POST below. Tells the
// onboarding confirm screen (issue #15) whether the user has already
// onboarded and what they're currently committed to, so a returning user's
// "Edit my projects" affordance can pre-populate from their real committed
// set instead of the auto-picked default. Reads `user_job_profile` +
// `user_job_profile_repos` via the admin client, same convention as the
// other job routes (both tables are RLS read-only for the owning user, but
// this route follows the existing codebase pattern of using the admin
// client for consistency).
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

  const { data: profileRow, error: profileError } = await admin
    .from('user_job_profile')
    .select('onboarded_at, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[RepoMax] user_job_profile read failed:', profileError)
    return NextResponse.json({ error: 'PROFILE_READ_ERROR' }, { status: 502 })
  }

  if (!profileRow) {
    return NextResponse.json({ onboarded: false, status: 'active', repoNames: [] })
  }

  const { data: repoRows, error: reposError } = await admin
    .from('user_job_profile_repos')
    .select('repo_name')
    .eq('user_id', user.id)

  if (reposError) {
    console.error('[RepoMax] user_job_profile_repos read failed:', reposError)
    return NextResponse.json({ error: 'PROFILE_READ_ERROR' }, { status: 502 })
  }

  return NextResponse.json({
    onboarded: profileRow.onboarded_at !== null,
    status: (profileRow.status as 'active' | 'needs_reonboarding') ?? 'active',
    repoNames: ((repoRows as Array<{ repo_name: string }> | null) ?? []).map((r) => r.repo_name),
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Own-user only: userId and the GitHub username used to re-fetch repos
  // both come from the session, never from the request body — same auth
  // pattern as GET /api/jobs/matches.
  const username = user?.app_metadata?.provider === 'github' ? (user.user_metadata?.user_name as string | undefined) : undefined
  if (!user || !username) {
    return NextResponse.json({ error: 'NOT_GITHUB_CONNECTED' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const body = parseRequestBody(rawBody)
  if (!body) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  try {
    const result = await buildUserJobProfile(user.id, username, body.repoNames)
    return NextResponse.json({
      profile: { onboardedAt: result.onboardedAt, status: result.status },
      repos: {
        built: result.built,
        kept: result.kept,
        deleted: result.deleted,
        skipped: result.skipped,
      },
      match: {
        matchesWritten: result.match.matchesWritten,
        candidatesRetrieved: result.match.candidatesRetrieved,
        repoCount: result.match.repoCount,
      },
    })
  } catch (err) {
    console.error('[RepoMax] profile build failed:', err)
    const message = err instanceof Error ? err.message : 'UNKNOWN'
    if (message === 'NOT_FOUND' || message === 'GITHUB_RATE_LIMITED' || message === 'GITHUB_ERROR') {
      return NextResponse.json({ error: 'GITHUB_ERROR' }, { status: 502 })
    }
    return NextResponse.json({ error: 'PROFILE_BUILD_ERROR' }, { status: 502 })
  }
}
