import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { fetchUserRepos } from '@/lib/github'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const username = user?.user_metadata?.user_name as string | undefined
  if (!user || !username) {
    return NextResponse.json({ error: 'NOT_GITHUB_CONNECTED' }, { status: 401 })
  }

  try {
    const repos = await fetchUserRepos(username)
    return NextResponse.json({ repos })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN'
    const status = msg === 'NOT_FOUND' ? 404 : msg === 'GITHUB_RATE_LIMITED' ? 429 : 502
    return NextResponse.json({ error: msg }, { status })
  }
}
