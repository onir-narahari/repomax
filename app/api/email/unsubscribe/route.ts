import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// One-click unsubscribe for the daily job digest.
//
// Token-based rather than session-based on purpose: email clients follow
// this link with no cookies, and a recipient who wants out should never be
// made to log in first. The token only ever turns the digest off, so it
// carries no useful authority if it leaks.

function page(title: string, body: string, status: number) {
  return new NextResponse(
    `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} · RepoMax</title>
</head>
<body style="margin:0;background:#F4F5F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:440px;margin:15vh auto;padding:32px;background:#FFF;border-radius:14px;text-align:center;">
    <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5B6478;">RepoMax</div>
    <h1 style="font-size:20px;color:#0B0B0F;margin:12px 0 8px;">${title}</h1>
    <p style="font-size:14px;color:#5B6478;line-height:1.6;margin:0;">${body}</p>
  </div>
</body>
</html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

async function unsubscribe(token: string | null) {
  if (!token) return page('Link incomplete', 'This unsubscribe link is missing its token.', 400)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_email_prefs')
    .update({ daily_jobs_email: false, unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('user_id')

  if (error) {
    console.error('[RepoMax] unsubscribe update failed:', error)
    return page('Something went wrong', 'We could not process that just now. Please try again in a minute.', 500)
  }

  // Already-unsubscribed tokens still match and update, so an empty result
  // means the token itself is unknown — not that the user was missed.
  if (!data || data.length === 0) {
    return page('Link not recognized', 'This unsubscribe link is no longer valid.', 404)
  }

  return page('You are unsubscribed', 'No more daily job emails. Your matches are still waiting in the app whenever you want them.', 200)
}

export async function GET(req: NextRequest) {
  return unsubscribe(req.nextUrl.searchParams.get('token'))
}

// Gmail and Apple Mail POST to the List-Unsubscribe URL when the user taps
// their native unsubscribe button (RFC 8058 one-click).
export async function POST(req: NextRequest) {
  return unsubscribe(req.nextUrl.searchParams.get('token'))
}
