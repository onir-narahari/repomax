import { NextRequest, NextResponse } from 'next/server'
import { AnalyzeRequestSchema } from '@/lib/schema'
import { parseRepoUrl, fetchRepoContext } from '@/lib/github'
import { generateContent } from '@/lib/prompt'
import { checkRateLimit } from '@/lib/ratelimit'
import type { AppErrorCode } from '@/types'

function errorResponse(code: AppErrorCode, status: number) {
  return NextResponse.json({ error: code }, { status })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
  const { limited } = await checkRateLimit(ip)
  if (limited) return errorResponse('RATE_LIMITED', 429)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('INVALID_URL', 400)
  }

  const parsed = AnalyzeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('INVALID_URL', 400)
  }

  const { repoUrl, targetRole } = parsed.data

  let owner: string, repo: string
  try {
    ;({ owner, repo } = parseRepoUrl(repoUrl))
  } catch {
    return errorResponse('INVALID_URL', 400)
  }

  let repoContext
  try {
    repoContext = await fetchRepoContext(owner, repo)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN'
    const validCodes: AppErrorCode[] = ['NOT_FOUND', 'PRIVATE_REPO', 'GITHUB_RATE_LIMITED', 'UNKNOWN']
    const code: AppErrorCode = validCodes.includes(msg as AppErrorCode)
      ? (msg as AppErrorCode)
      : 'UNKNOWN'
    const statusMap: Record<AppErrorCode, number> = {
      NOT_FOUND: 404,
      PRIVATE_REPO: 403,
      GITHUB_RATE_LIMITED: 429,
      INVALID_URL: 400,
      RATE_LIMITED: 429,
      LLM_ERROR: 502,
      UNKNOWN: 500,
    }
    return errorResponse(code, statusMap[code])
  }

  try {
    const result = await generateContent(repoContext, targetRole)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[RepoMax] LLM error:', err)
    return errorResponse('LLM_ERROR', 502)
  }
}
