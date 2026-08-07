import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { computeMatchesForUser } from '@/lib/matching-engine'
import { buildSubject, renderDigestHtml, renderDigestText, type DigestJob } from '@/lib/job-digest-email'
import { sendEmail } from '@/lib/send-email'

// One user's entire morning: compute their matches, then email them.
//
// This exists as its own route rather than as a loop body inside the cron
// because the Hobby plan caps a function at 60s, and 55 users' worth of
// GPT-4o rerank calls does not fit in one invocation — the cron was already
// at risk of being killed partway through, leaving late users with no
// matches at all. Fanning out gives every user their own fresh 60s budget,
// and keeps that true as the user count grows. The cron
// (app/api/jobs/cron/match) is now just the dispatcher that calls this.
export const maxDuration = 60

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tryrepomax.com'

interface JobPostingRow {
  title: string
  company: string
  location: string | null
  absolute_url: string
}

interface MatchRow {
  id: string
  matched_repo_name: string
  match_reason: string
  confidence: number | null
  job_postings: JobPostingRow | JobPostingRow[] | null
}

interface EmailPrefsRow {
  daily_jobs_email: boolean
  unsubscribe_token: string
}

// Creates the prefs row on first contact so every user we email has an
// unsubscribe token, and returns the current state. `ignoreDuplicates` means
// a user who already unsubscribed keeps that decision — this must never
// silently re-subscribe anyone.
async function ensureEmailPrefs(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<EmailPrefsRow | null> {
  const { error: upsertErr } = await admin
    .from('user_email_prefs')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })

  if (upsertErr) {
    console.error(`[RepoMax] user_email_prefs upsert failed for ${userId}:`, upsertErr)
    return null
  }

  const { data, error } = await admin
    .from('user_email_prefs')
    .select('daily_jobs_email, unsubscribe_token')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error(`[RepoMax] user_email_prefs read failed for ${userId}:`, error)
    return null
  }

  return data as EmailPrefsRow
}

function rowToDigestJob(row: MatchRow): DigestJob | null {
  const jp = Array.isArray(row.job_postings) ? row.job_postings[0] : row.job_postings
  if (!jp) return null
  return {
    title: jp.title,
    company: jp.company,
    location: jp.location,
    url: jp.absolute_url,
    reason: row.match_reason,
    repoName: row.matched_repo_name,
    confidence: row.confidence,
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  let userId: string
  try {
    const body = (await req.json()) as { userId?: string }
    if (!body.userId) return NextResponse.json({ error: 'MISSING_USER_ID' }, { status: 400 })
    userId = body.userId
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { matchesWritten } = await computeMatchesForUser(userId)

  // Only unemailed rows: `emailed_at` is what makes this whole route safe to
  // re-run. A retried dispatch, or a user who was already emailed this
  // morning, reads zero rows here and sends nothing.
  const { data: matchRows, error: matchErr } = await admin
    .from('user_job_matches')
    .select('id, matched_repo_name, match_reason, confidence, job_postings(title, company, location, absolute_url)')
    .eq('user_id', userId)
    .eq('match_date', today)
    .is('emailed_at', null)
    .order('match_rank', { ascending: true })

  if (matchErr) {
    console.error(`[RepoMax] digest match read failed for ${userId}:`, matchErr)
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  }

  const jobs = ((matchRows as unknown as MatchRow[] | null) ?? [])
    .map(rowToDigestJob)
    .filter((j): j is DigestJob => j !== null)

  // Zero-match mornings send nothing at all. An empty daily email trains
  // people to ignore the sender and costs deliverability for no upside —
  // the user still sees the state in the app.
  if (jobs.length === 0) {
    return NextResponse.json({ userId, matchesWritten, emailed: false, reason: 'NO_MATCHES' })
  }

  const prefs = await ensureEmailPrefs(admin, userId)
  if (!prefs) return NextResponse.json({ error: 'PREFS_ERROR' }, { status: 500 })
  if (!prefs.daily_jobs_email) {
    return NextResponse.json({ userId, matchesWritten, emailed: false, reason: 'UNSUBSCRIBED' })
  }

  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(userId)
  const email = userData?.user?.email
  if (userErr || !email) {
    console.error(`[RepoMax] no email on record for ${userId}:`, userErr)
    return NextResponse.json({ userId, matchesWritten, emailed: false, reason: 'NO_EMAIL' })
  }

  const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?token=${prefs.unsubscribe_token}`

  try {
    await sendEmail({
      to: email,
      subject: buildSubject(jobs),
      html: renderDigestHtml({ jobs, unsubscribeUrl, appUrl: APP_URL }),
      text: renderDigestText({ jobs, unsubscribeUrl, appUrl: APP_URL }),
      unsubscribeUrl,
    })
  } catch (err) {
    // A bad address or a transient SMTP error is one user's problem, not a
    // crash. Reported as a normal result so the dispatcher's summary stays
    // truthful and the logs name the user who was missed. Rows stay
    // unstamped, so the next run retries them.
    console.error(`[RepoMax] digest send failed for ${userId}:`, err)
    return NextResponse.json({ userId, matchesWritten, emailed: false, reason: 'SEND_FAILED' })
  }

  // Stamped only after Resend accepts the send. If the send throws, the rows
  // stay unstamped and a re-dispatch retries them — the failure mode is a
  // duplicate email at worst, never a silently skipped user.
  const { error: stampErr } = await admin
    .from('user_job_matches')
    .update({ emailed_at: new Date().toISOString() })
    .in(
      'id',
      ((matchRows as unknown as MatchRow[] | null) ?? []).map((r) => r.id)
    )

  if (stampErr) console.error(`[RepoMax] emailed_at stamp failed for ${userId}:`, stampErr)

  return NextResponse.json({ userId, matchesWritten, emailed: true, jobCount: jobs.length })
}
