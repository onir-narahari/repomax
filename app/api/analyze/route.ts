import { NextRequest, NextResponse } from 'next/server'
import { AnalyzeRequestSchema } from '@/lib/schema'
import { parseRepoUrl, fetchRepoContext } from '@/lib/github'
import { generateContent } from '@/lib/prompt'
import { checkRateLimit } from '@/lib/ratelimit'
import { getPostHogClient } from '@/lib/posthog-server'
import type { AppErrorCode } from '@/types'

export const maxDuration = 60

function errorResponse(code: AppErrorCode, status: number) {
  return NextResponse.json({ error: code }, { status })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
  const distinctId = req.headers.get('x-posthog-distinct-id') ?? ip
  const { limited } = await checkRateLimit(ip)
  if (limited) {
    getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: 'RATE_LIMITED' } })
    return errorResponse('RATE_LIMITED', 429)
  }

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
    getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: 'INVALID_URL', repo_url: repoUrl } })
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
    getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: code, repo_url: repoUrl } })
    return errorResponse(code, statusMap[code])
  }

  try {
    const result = await generateContent(repoContext, targetRole)
    getPostHogClient().capture({
      distinctId,
      event: 'repo_scored',
      properties: {
        repo_url: repoUrl,
        repo_owner: owner,
        repo_name: repo,
        target_role: targetRole ?? null,
        score_total: (result as { repoScore?: { total?: number } }).repoScore?.total ?? null,
      },
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[RepoMax] LLM error:', err)
    getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: 'LLM_ERROR', repo_url: repoUrl } })
    return errorResponse('LLM_ERROR', 502)
  }
}
