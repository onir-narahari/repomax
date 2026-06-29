import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email || !email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  try {
    await fetch('https://us.posthog.com/capture/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        event: 'waitlist_signup',
        distinct_id: email,
        properties: {
          email,
          $set: { email, waitlist: true },
        },
      }),
    })
  } catch {
    // Don't fail the user if PostHog is unavailable
  }

  return NextResponse.json({ success: true })
}
