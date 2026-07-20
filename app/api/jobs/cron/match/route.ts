import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { computeMatchesForUser } from '@/lib/matching-engine'
import { chunk } from '@/lib/batch'

// The 8am daily precompute (docs/prd-job-matching.md §14, §16). Loops
// computeMatchesForUser (issue #16, lib/matching-engine.ts — not modified
// here) over every onboarded user, in bounded-concurrency batches so this
// stays within the serverless function time budget as the user base grows
// (§16: "looping all users in one serverless invocation will blow the
// function timeout ... process users in batches with bounded concurrency").
//
// 300s is the longest duration Vercel Cron-triggered functions can run on a
// Pro plan (Hobby caps at 60s); bounded-concurrency batching is what keeps
// this route inside that budget rather than relying on the ceiling alone —
// see BATCH_SIZE below. Lower this back to 60 if the deploy target is Hobby.
export const maxDuration = 300

// How many users' computeMatchesForUser calls run concurrently per batch.
// Each call makes a GPT-4o rerank request, so this is deliberately bounded
// (not Promise.all over every user at once, which would spike concurrent
// OpenAI/DB load) and not fully sequential (which would be needlessly slow
// and risk the time budget on a large user base). 8 is a reasonable middle
// ground; tune based on observed run time / OpenAI rate limits.
const BATCH_SIZE = 8

interface UserOutcome {
  userId: string
  ok: boolean
  matchesWritten: number
}

async function runMatchBatch(userIds: string[]): Promise<UserOutcome[]> {
  const batches = chunk(userIds, BATCH_SIZE)
  const outcomes: UserOutcome[] = []

  for (const batch of batches) {
    const settled = await Promise.allSettled(
      batch.map((userId) => computeMatchesForUser(userId))
    )

    settled.forEach((result, i) => {
      const userId = batch[i]
      if (result.status === 'fulfilled') {
        outcomes.push({ userId, ok: true, matchesWritten: result.value.matchesWritten })
      } else {
        // Per-user failure isolation (§16): log and continue — one user's
        // failure must never abort the batch or affect other users.
        console.error(`[RepoMax] computeMatchesForUser failed for user ${userId}:`, result.reason)
        outcomes.push({ userId, ok: false, matchesWritten: 0 })
      }
    })
  }

  return outcomes
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
// not an inconsistency.
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
  const outcomes = await runMatchBatch(userIds)

  const succeeded = outcomes.filter((o) => o.ok).length
  const failed = outcomes.length - succeeded
  const totalMatchesWritten = outcomes.reduce((sum, o) => sum + o.matchesWritten, 0)

  return NextResponse.json({
    usersProcessed: outcomes.length,
    succeeded,
    failed,
    totalMatchesWritten,
  })
}
