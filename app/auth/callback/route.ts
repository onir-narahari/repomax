import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// OAuth providers redirect here with a `code` param. Must exchange it for a
// session here (server-side, so the session cookie is set via Set-Cookie
// before the redirect) — without this route, middleware.ts's logged-in
// check runs on the very next request with no session cookie yet and
// bounces the user straight back off /profile.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/profile'
  const safeNext = next.startsWith('/') ? next : '/profile'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
