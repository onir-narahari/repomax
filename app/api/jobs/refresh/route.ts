import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  fetchCuratedJobPostings,
  embedJobPostings,
  postingKey,
  postingContentChanged,
  type EmbeddedPostingSnapshot,
} from '@/lib/job-postings'
import type { JobPosting } from '@/types'

export const maxDuration = 60

interface IngestResult {
  ingested: number
  embedded: number
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

  let postings: JobPosting[]
  try {
    postings = await fetchCuratedJobPostings()
  } catch (err) {
    console.error('[RepoMax] job ingestion fetch failed:', err)
    return { ok: false, error: 'INGEST_FAILED', status: 502 }
  }

  const admin = createAdminClient()

  // Feed unreachable or empty (fetchCuratedJobPostings already returns [] for
  // both) — keep the last-known job_postings untouched rather than running
  // the deactivate-stale-rows step below, which would otherwise mark every
  // active posting stale.
  if (postings.length === 0) {
    return { ok: true, result: { ingested: 0, embedded: 0, deactivated: 0 } }
  }

  // Only embed postings that are new, or already embedded but stale — skip
  // re-embedding only when a posting is BOTH already embedded AND its
  // embedding-relevant fields (title/company/location/techTags) are
  // unchanged since that embedding was computed. This also catches postings
  // edited upstream at the source (same source+external_id, different
  // title/category) whose row gets refreshed by the `withoutEmbedding`
  // upsert below but would otherwise keep a stale embedding forever.
  const sources = Array.from(new Set(postings.map((p) => p.source)))
  const { data: alreadyEmbeddedRows, error: embeddedLookupError } = await admin
    .from('job_postings')
    .select('source, external_id, title, company, location, tech_tags')
    .in('source', sources)
    .not('embedding', 'is', null)

  if (embeddedLookupError) {
    // Fail open, not silently: if we can't tell what's already embedded and
    // unchanged, every posting below falls into needsEmbedding and gets
    // re-sent to OpenAI this run. That's a real cost/latency hit, not a
    // silent no-op, so it's worth calling out explicitly here.
    console.error(
      '[RepoMax] job_postings embedded-lookup failed — falling back to re-embedding all postings this run:',
      embeddedLookupError
    )
  }

  const alreadyEmbedded = new Map<string, EmbeddedPostingSnapshot>(
    (
      (alreadyEmbeddedRows as Array<{
        source: string
        external_id: string
        title: string
        company: string
        location: string | null
        tech_tags: string[]
      }> | null) ?? []
    ).map((r) => [
      postingKey({ source: r.source, externalId: r.external_id }),
      { title: r.title, company: r.company, location: r.location, techTags: r.tech_tags },
    ])
  )

  const needsEmbedding = postings.filter((p) => {
    const stored = alreadyEmbedded.get(postingKey(p))
    return !stored || postingContentChanged(p, stored)
  })
  const embeddings = needsEmbedding.length > 0 ? await embedJobPostings(needsEmbedding) : new Map<string, number[]>()

  const withEmbedding = postings.filter((p) => embeddings.has(postingKey(p)))
  const withoutEmbedding = postings.filter((p) => !embeddings.has(postingKey(p)))

  // Split into two upsert calls because PostgREST requires every row in one
  // bulk upsert to share the same columns — a row without an `embedding` key
  // must go in a call that omits the column entirely, so its existing DB
  // value (already embedded, or still null pending a retry) is left alone
  // instead of being overwritten with null.
  const baseRow = (p: JobPosting) => ({
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
  })

  if (withEmbedding.length > 0) {
    const { error } = await admin.from('job_postings').upsert(
      withEmbedding.map((p) => ({ ...baseRow(p), embedding: embeddings.get(postingKey(p)) })),
      { onConflict: 'source,external_id' }
    )
    if (error) {
      console.error('[RepoMax] job_postings upsert (with embedding) failed:', error)
      return { ok: false, error: 'DB_ERROR', status: 500 }
    }
  }

  if (withoutEmbedding.length > 0) {
    const { error } = await admin
      .from('job_postings')
      .upsert(withoutEmbedding.map(baseRow), { onConflict: 'source,external_id' })
    if (error) {
      console.error('[RepoMax] job_postings upsert (without embedding) failed:', error)
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
      embedded: withEmbedding.length,
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
