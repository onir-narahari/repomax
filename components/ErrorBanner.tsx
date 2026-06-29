import type { AppErrorCode } from '@/types'

const MESSAGES: Record<AppErrorCode, { title: string; detail: string }> = {
  INVALID_URL: {
    title: 'Invalid URL',
    detail: 'Enter a full public GitHub repo URL — e.g. https://github.com/owner/repo',
  },
  NOT_GITHUB_URL: {
    title: 'Not a GitHub URL',
    detail: 'RepoMax only works with GitHub repos. Paste a link from github.com.',
  },
  PRIVATE_REPO: {
    title: 'Private repository',
    detail: 'RepoMax only works with public repos. Make the repo public and try again.',
  },
  NOT_FOUND: {
    title: 'Repo not found',
    detail: "We couldn't find that repo. Double-check the URL — it may have been renamed or deleted.",
  },
  EMPTY_REPO: {
    title: 'Empty repository',
    detail: "That repo has no commits yet. Push some code first, then try again.",
  },
  REPO_BLOCKED: {
    title: 'Repository unavailable',
    detail: 'This repo is unavailable on GitHub and cannot be analyzed.',
  },
  RATE_LIMITED: {
    title: 'Too many requests',
    detail: 'Please wait a minute, then try again.',
  },
  GITHUB_RATE_LIMITED: {
    title: 'GitHub rate limit hit',
    detail: 'The GitHub API is temporarily rate-limited. Please try again in a few minutes.',
  },
  GITHUB_ERROR: {
    title: 'GitHub error',
    detail: "GitHub returned an unexpected error. Please try again.",
  },
  LLM_ERROR: {
    title: 'Generation failed',
    detail: 'Content generation ran into an issue. Please try again.',
  },
  LLM_TIMEOUT: {
    title: 'Generation timed out',
    detail: 'Analysis took too long to complete. Please try again.',
  },
  LLM_PARSE_ERROR: {
    title: 'Generation failed',
    detail: 'Got an unexpected response from the AI. Please try again.',
  },
  UNKNOWN: {
    title: 'Something went wrong',
    detail: 'An unexpected error occurred. Please try again.',
  },
}

interface Props {
  code: AppErrorCode
  onDismiss: () => void
}

export default function ErrorBanner({ code, onDismiss }: Props) {
  const msg = MESSAGES[code] ?? MESSAGES.UNKNOWN
  return (
    <div
      role="alert"
      className="overflow-hidden rounded-2xl border border-red-400/20 bg-gradient-to-br from-red-500/[0.1] to-red-600/[0.04] px-5 py-4 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-300/90">
            {msg.title}
          </p>
          <p className="text-sm leading-relaxed text-red-100/70">{msg.detail}</p>
        </div>
        <button
          onClick={onDismiss}
          className="mt-0.5 shrink-0 rounded-lg border border-red-400/15 bg-red-400/[0.08] px-2 py-1 text-xs text-red-300/60 transition hover:border-red-400/25 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-400/25"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
