import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { fetchCuratedJobPostings } from '@/lib/job-postings'

export const maxDuration = 60

interface IngestResult {
  ingested: number
  deactivated: number
}

// Shared ingest body — fetch postings, upsert, deactivate anything stale.
// Called by both entry points below (POST for manual/curl-triggered runs,
// GET for the Vercel Cron-triggered frequent refresh) so the two never
// drift. Returns either the summary or an error shape identical to what
// each handler used to build inline.
async function runIngest(): Promise<
  { ok: true; result: IngestResult } | { ok: false; error: string; status: number }
> {
  const startedAt = new Date()

  let postings
  try {
    postings = await fetchCuratedJobPostings()
  } catch (err) {
    console.error('[RepoMax] job ingestion fetch failed:', err)
    return { ok: false, error: 'INGEST_FAILED', status: 502 }
  }

  const admin = createAdminClient()

  if (postings.length > 0) {
    const { error } = await admin.from('job_postings').upsert(
      postings.map((p) => ({
        source: p.source,
        external_id: p.externalId,
        title: p.title,
        company: p.company,
        location: p.location,
        absolute_url: p.absoluteUrl,
        tech_tags: p.techTags,
        posted_at: p.postedAt,
        is_active: true,
        last_seen_at: startedAt.toISOString(),
      })),
      { onConflict: 'source,external_id' }
    )
    if (error) {
      console.error('[RepoMax] job_postings upsert failed:', error)
      return { ok: false, error: 'DB_ERROR', status: 500 }
    }
  }

  // Anything not touched by this refresh is no longer live — deactivate it.
  const { data: deactivated, error: deactivateError } = await admin
    .from('job_postings')
    .update({ is_active: false })
    .lt('last_seen_at', startedAt.toISOString())
    .eq('is_active', true)
    .select('id')

  if (deactivateError) {
    console.error('[RepoMax] job_postings deactivate failed:', deactivateError)
  }

  return {
    ok: true,
    result: {
      ingested: postings.length,
      deactivated: deactivated?.length ?? 0,
    },
  }
}

// Manually-triggered ingestion (curl this with the secret header). Unchanged
// from before — auth and behavior are exactly as they were.
export async function POST(req: NextRequest) {
  const secret = process.env.JOB_REFRESH_SECRET
  if (!secret || req.headers.get('x-refresh-secret') !== secret) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const outcome = await runIngest()
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status })
  }
  return NextResponse.json(outcome.result)
}

// Cron-triggered ingestion (see vercel.json's frequent `crons` entry for this
// path). Vercel Cron Jobs only ever send a plain GET request — there is no
// way to configure a custom header (like x-refresh-secret above) on a
// Vercel-triggered invocation. Vercel's own mechanism instead: when a
// `CRON_SECRET` env var is set on the project, Vercel automatically attaches
// `Authorization: Bearer <CRON_SECRET>` to the request it fires for a
// scheduled cron. So this GET handler checks that header instead of
// x-refresh-secret — same shared-secret idea, different header because of
// this platform constraint, not a missed instruction. Note that a
// sub-daily schedule for this route requires a Vercel Pro plan or above —
// on Hobby, Vercel caps Cron Jobs to once per day regardless of the
// schedule configured in vercel.json.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const outcome = await runIngest()
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status })
  }
  return NextResponse.json(outcome.result)
}
