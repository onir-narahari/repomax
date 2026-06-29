import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTS.has(ext)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = `upload-${Date.now()}.${ext}`
  const dir = join(process.cwd(), 'public', 'tiktok', 'photos')

  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), buffer)

  return NextResponse.json({ url: `/tiktok/photos/${filename}` })
}
