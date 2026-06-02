const GITHUB_REPO_PATTERN =
  /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

/** Normalize shorthand and partial GitHub URLs to https://github.com/owner/repo */
export function normalizeRepoUrl(input: string): string {
  let raw = input.trim()
  if (!raw) return ''

  raw = raw.replace(/\/+$/, '')

  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(raw)) {
    return `https://github.com/${raw}`
  }

  if (/^github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/i.test(raw)) {
    return `https://${raw}`
  }

  if (raw.startsWith('http://github.com/')) {
    raw = `https://${raw.slice('http://'.length)}`
  }

  return raw.replace(/\/+$/, '')
}

export function validateRepoUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return 'Enter a GitHub repo URL'

  const normalized = normalizeRepoUrl(trimmed)
  if (!GITHUB_REPO_PATTERN.test(normalized)) {
    return 'Paste a full GitHub link (https://github.com/owner/repo)'
  }

  return null
}

export function repoUrlToSlug(url: string): string {
  const normalized = normalizeRepoUrl(url)
  return normalized.replace(/^https:\/\/github\.com\//, '')
}

export function buildGenerateHref(input: string): string {
  const normalized = normalizeRepoUrl(input)
  return `/generate?repo=${encodeURIComponent(normalized)}`
}
