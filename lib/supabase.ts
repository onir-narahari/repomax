import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// All OAuth sign-in calls must redirect through /auth/callback (which
// exchanges the code for a session) rather than straight to the destination
// page — see app/auth/callback/route.ts for why.
export function oauthRedirectTo(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
}
