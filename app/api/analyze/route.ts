import { NextRequest, NextResponse, after } from 'next/server'
import { AnalyzeRequestSchema } from '@/lib/schema'
import { parseRepoUrl, fetchRepoContext } from '@/lib/github'
import { generateContent } from '@/lib/prompt'
import { checkRateLimit } from '@/lib/ratelimit'
import { getPostHogClient } from '@/lib/posthog-server'
import type { AppErrorCode } from '@/types'
import { ERROR_FAULT } from '@/types'

export const maxDuration = 60

function errorResponse(code: AppErrorCode, status: number) {
  return NextResponse.json({ error: code }, { status })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
  const distinctId = req.headers.get('x-posthog-distinct-id') ?? ip
  const { limited } = await checkRateLimit(ip)
  if (limited) {
    getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: 'RATE_LIMITED', fault: 'system' } })
    after(() => getPostHogClient().flush())
    return errorResponse('RATE_LIMITED', 429)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('INVALID_URL', 400)
  }

  // Detect non-GitHub URLs before schema validation so we can give a specific error code
  const rawUrl = (body as Record<string, unknown>).repoUrl
  if (typeof rawUrl === 'string') {
    try {
      const host = new URL(rawUrl).hostname
      if (host && host !== 'github.com') {
        getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: 'NOT_GITHUB_URL', repo_url: rawUrl, fault: 'user' } })
        after(() => getPostHogClient().flush())
        return errorResponse('NOT_GITHUB_URL', 400)
      }
    } catch { /* not a valid URL — schema will reject it as INVALID_URL */ }
  }

  const parsed = AnalyzeRequestSchema.safeParse(body)
  if (!parsed.success) {
    getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: 'INVALID_URL', repo_url: typeof rawUrl === 'string' ? rawUrl : undefined, fault: 'user' } })
    after(() => getPostHogClient().flush())
    return errorResponse('INVALID_URL', 400)
  }

  const { repoUrl, targetRole } = parsed.data

  let owner: string, repo: string
  try {
    ;({ owner, repo } = parseRepoUrl(repoUrl))
  } catch {
    getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: 'INVALID_URL', repo_url: repoUrl, fault: 'user' } })
    after(() => getPostHogClient().flush())
    return errorResponse('INVALID_URL', 400)
  }

  const GITHUB_CODES: AppErrorCode[] = ['NOT_FOUND', 'PRIVATE_REPO', 'EMPTY_REPO', 'REPO_BLOCKED', 'GITHUB_RATE_LIMITED', 'GITHUB_ERROR']
  const LLM_CODES: AppErrorCode[] = ['LLM_ERROR', 'LLM_TIMEOUT', 'LLM_PARSE_ERROR']

  const statusMap: Record<AppErrorCode, number> = {
    INVALID_URL: 400,
    NOT_GITHUB_URL: 400,
    NOT_FOUND: 404,
    PRIVATE_REPO: 403,
    EMPTY_REPO: 422,
    REPO_BLOCKED: 451,
    RATE_LIMITED: 429,
    GITHUB_RATE_LIMITED: 429,
    GITHUB_ERROR: 502,
    LLM_ERROR: 502,
    LLM_TIMEOUT: 504,
    LLM_PARSE_ERROR: 502,
    UNKNOWN: 500,
  }

  let repoContext
  try {
    repoContext = await fetchRepoContext(owner, repo)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN'
    const code: AppErrorCode = GITHUB_CODES.includes(msg as AppErrorCode) ? (msg as AppErrorCode) : 'UNKNOWN'
    getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: code, repo_url: repoUrl, fault: ERROR_FAULT[code] } })
    after(() => getPostHogClient().flush())
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
    const msg = err instanceof Error ? err.message : 'UNKNOWN'
    const code: AppErrorCode = LLM_CODES.includes(msg as AppErrorCode) ? (msg as AppErrorCode) : 'LLM_ERROR'
    console.error('[RepoMax] LLM error:', code, err)
    getPostHogClient().capture({ distinctId, event: 'repo_score_failed', properties: { error_code: code, repo_url: repoUrl, fault: 'system' } })
    after(() => getPostHogClient().flush())
    return errorResponse(code, statusMap[code])
  }
}
