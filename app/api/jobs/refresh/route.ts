import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { fetchCuratedJobPostings } from '@/lib/job-postings'

export const maxDuration = 60

// Manually-triggered ingestion for now (curl this with the secret header).
// Will be wired to a Vercel Cron job once the email-sending phase ships.
export async function POST(req: NextRequest) {
  const secret = process.env.JOB_REFRESH_SECRET
  if (!secret || req.headers.get('x-refresh-secret') !== secret) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const startedAt = new Date()

  let postings
  try {
    postings = await fetchCuratedJobPostings()
  } catch (err) {
    console.error('[RepoMax] job ingestion fetch failed:', err)
    return NextResponse.json({ error: 'INGEST_FAILED' }, { status: 502 })
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
      return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
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

  return NextResponse.json({
    ingested: postings.length,
    deactivated: deactivated?.length ?? 0,
  })
}
