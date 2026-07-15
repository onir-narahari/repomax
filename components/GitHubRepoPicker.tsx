'use client'

import { useEffect, useState } from 'react'
import type { GitHubUserRepo } from '@/types'

interface Props {
  username: string
  onSelectRepo: (repoUrl: string) => void
}

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-400',
  JavaScript: 'bg-amber-400',
  Python: 'bg-yellow-400',
  Go: 'bg-cyan-400',
  Rust: 'bg-orange-400',
  Java: 'bg-red-400',
  'C++': 'bg-pink-400',
  C: 'bg-slate-400',
  Ruby: 'bg-red-500',
  HTML: 'bg-orange-500',
  CSS: 'bg-indigo-400',
  Swift: 'bg-orange-400',
  Kotlin: 'bg-purple-400',
}

export function fmtUpdated(iso: string) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return 'today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}

const VISIBLE_CAP = 3

export default function GitHubRepoPicker({ username, onSelectRepo }: Props) {
  const [repos, setRepos] = useState<GitHubUserRepo[] | null>(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/github/repos')
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (!cancelled) setRepos(data.repos as GitHubUserRepo[])
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your repos from GitHub.')
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="rounded-2xl border border-[#22C55E]/25 bg-[#0D111C] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#F5F3EA]">Pick a repo to score</p>
        <span className="rounded-full border border-[#1E2A3D] bg-[#111827] px-2 py-0.5 font-mono text-[10px] text-[#7AA7FF]">@{username}</span>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {!error && repos === null && (
        <div className="mt-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[52px] animate-pulse rounded-xl border border-[#1E2A3D] bg-[#090D16]" />
          ))}
        </div>
      )}

      {repos !== null && repos.length === 0 && (
        <p className="mt-4 text-sm text-[#687386]">No public repos found on your GitHub account yet.</p>
      )}

      {repos !== null && repos.length > 0 && (
        <div className="mt-4 space-y-2">
          {(expanded ? repos : repos.slice(0, VISIBLE_CAP)).map((repo) => (
            <button
              key={repo.name}
              type="button"
              onClick={() => onSelectRepo(repo.htmlUrl)}
              className="flex w-full items-center justify-between rounded-xl border border-[#1E2A3D] bg-[#090D16] px-4 py-3 text-left transition hover:border-[#22C55E]/40"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium text-[#F5F3EA]">{repo.name}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-[#687386]">
                  {repo.language && (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${LANGUAGE_COLORS[repo.language] ?? 'bg-[#687386]'}`} />
                  )}
                  <span className="truncate">{repo.language ? `${repo.language} · ` : ''}updated {fmtUpdated(repo.updatedAt)}</span>
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-[#22C55E]/15 px-3 py-1.5 text-xs font-semibold text-[#22C55E]">Scan →</span>
            </button>
          ))}
        </div>
      )}

      {repos !== null && repos.length > VISIBLE_CAP && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1E2A3D] py-2 text-xs font-medium text-[#7AA7FF] transition hover:border-[#334155]"
        >
          View {repos.length - VISIBLE_CAP} more repos <span className="text-[10px]">▾</span>
        </button>
      )}

      <p className="mt-4 text-center text-[11px] text-[#3D4A60]">Only your own public repos ever show up here.</p>
    </div>
  )
}
