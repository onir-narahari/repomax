import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// The 8am CT daily run (docs/prd-job-matching.md §14, §16).
//
// This used to do the matching itself, looping computeMatchesForUser over
// every user in batches inside this one invocation. That does not fit: the
// Hobby plan hard-caps a function at 60s, and each user costs a GPT-4o
// rerank round-trip, so past ~30 users the invocation was being killed
// partway through and everyone after the cutoff silently got no matches.
// (The `maxDuration = 300` this file used to declare is a Pro-only value and
// was never actually in effect.)
//
// So this is now purely a dispatcher: read the user list, fan out one
// request per user to /api/jobs/cron/match-user, which computes that user's
// matches and emails them. Every user gets their own fresh 60s budget, and
// because the fan-out is concurrent this route's own wall time is roughly
// one worker's, not the sum of all of them.
export const maxDuration = 60

// Each worker is given nearly the whole budget before we give up on it — a
// slow worker should still be allowed to finish and email its user. The
// margin below 60s just guarantees this route returns a summary instead of
// being killed mid-flight, so a stalled user is visible in the logs.
const WORKER_TIMEOUT_MS = 50_000

interface UserOutcome {
  userId: string
  ok: boolean
  emailed: boolean
}

async function dispatchUser(baseUrl: string, secret: string, userId: string): Promise<UserOutcome> {
  try {
    const res = await fetch(`${baseUrl}/api/jobs/cron/match-user`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
      signal: AbortSignal.timeout(WORKER_TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(`[RepoMax] match-user worker failed for ${userId}: HTTP ${res.status}`)
      return { userId, ok: false, emailed: false }
    }

    const body = (await res.json()) as { emailed?: boolean }
    return { userId, ok: true, emailed: body.emailed === true }
  } catch (err) {
    // Per-user failure isolation (§16): one user's worker erroring, timing
    // out, or being unreachable must never affect anyone else's run.
    console.error(`[RepoMax] match-user dispatch failed for ${userId}:`, err)
    return { userId, ok: false, emailed: false }
  }
}

// Vercel Cron Jobs only ever send a plain GET request — there is no way to
// configure a custom header on a Vercel-triggered invocation (vercel.json's
// `crons` entries only support `path` and `schedule`). Vercel's own
// mechanism for authenticating these: when a `CRON_SECRET` env var is set on
// the project, Vercel automatically attaches `Authorization: Bearer
// <CRON_SECRET>` to the request it fires for a scheduled cron — no code
// needs to construct that header, Vercel does it. So this route checks that
// header rather than a custom one like JOB_REFRESH_SECRET's x-refresh-secret
// (app/api/jobs/refresh/route.ts) — a deliberate platform accommodation,
// not an inconsistency. The same secret is then forwarded to each worker.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const admin = createAdminClient()

  // "Onboarded users" = rows with onboarded_at set (issue #14's profile
  // build on first confirm). Only status = 'active' — a
  // 'needs_reonboarding' user's committed profile is presumed stale/invalid,
  // so skip them rather than error on them.
  const { data: profileRows, error: profileErr } = await admin
    .from('user_job_profile')
    .select('user_id')
    .eq('status', 'active')
    .not('onboarded_at', 'is', null)

  if (profileErr) {
    console.error('[RepoMax] cron match: user_job_profile fetch failed:', profileErr)
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  }

  const userIds = (profileRows ?? []).map((r) => r.user_id as string)

  // Workers are invoked over HTTP against whatever host is serving this
  // request, so preview deployments dispatch to their own workers rather
  // than reaching into production.
  const baseUrl = new URL(req.url).origin

  // Deliberately unbatched: workers are separate invocations, so firing all
  // of them at once keeps this route's wall time at ~one worker instead of
  // (batches x worker time), which is what has to stay under 60s. The cost
  // is a concurrency spike on OpenAI at dispatch. That is fine in the tens
  // of users; when it starts hitting rate limits (order of several hundred
  // users), move the fan-out to a queue with throttled delivery — Upstash
  // QStash, since Upstash is already a dependency for rate limiting — and
  // leave the worker route untouched.
  const outcomes = await Promise.all(userIds.map((userId) => dispatchUser(baseUrl, secret, userId)))

  const succeeded = outcomes.filter((o) => o.ok).length
  const emailsSent = outcomes.filter((o) => o.emailed).length

  return NextResponse.json({
    usersProcessed: outcomes.length,
    succeeded,
    failed: outcomes.length - succeeded,
    emailsSent,
  })
}
