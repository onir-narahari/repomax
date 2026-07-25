import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getPostHogClient } from '@/lib/posthog-server'

// OAuth providers redirect here with a `code` param. Must exchange it for a
// session here (server-side, so the session cookie is set via Set-Cookie
// before the redirect) — without this route, middleware.ts's logged-in
// check runs on the very next request with no session cookie yet and
// bounces the user straight back off /profile.
//
// `account_created` for OAuth sign-ins is captured here rather than from a
// client-side onAuthStateChange listener: this route runs exactly once per
// real OAuth completion, so it can't double-fire on remount/tab-refocus and
// can't miss a signup because some other page's listener never mounted.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/profile'
  const safeNext = next.startsWith('/') ? next : '/profile'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { user } = data
      const isNewAccount =
        !!user.created_at &&
        !!user.last_sign_in_at &&
        Math.abs(new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime()) < 5000
      if (isNewAccount) {
        getPostHogClient().capture({
          distinctId: user.id,
          event: 'account_created',
          properties: { method: user.app_metadata?.provider ?? 'unknown' },
        })
        after(() => getPostHogClient().flush())
      }
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
