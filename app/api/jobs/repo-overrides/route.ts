import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const MAX_OVERRIDES = 4

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_job_repo_overrides')
    .select('repo_full_name, position')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({
    overrides: (data ?? []).map((row) => ({ repoFullName: row.repo_full_name, position: row.position })),
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const repoFullName = typeof body?.repo_full_name === 'string' ? body.repo_full_name.trim() : ''
  const position = Number.isInteger(body?.position) ? (body.position as number) : NaN

  if (!repoFullName || Number.isNaN(position)) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const { count } = await supabase
    .from('user_job_repo_overrides')
    .select('repo_full_name', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('repo_full_name', repoFullName)

  if ((count ?? 0) >= MAX_OVERRIDES) {
    return NextResponse.json({ error: 'TOO_MANY_OVERRIDES' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_job_repo_overrides')
    .upsert(
      { user_id: user.id, repo_full_name: repoFullName, position },
      { onConflict: 'user_id,repo_full_name' },
    )

  if (error) {
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const repoFullName = typeof body?.repo_full_name === 'string' ? body.repo_full_name.trim() : ''

  if (!repoFullName) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_job_repo_overrides')
    .delete()
    .eq('user_id', user.id)
    .eq('repo_full_name', repoFullName)

  if (error) {
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
