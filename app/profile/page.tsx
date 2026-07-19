'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Clock, ArrowLeft, ArrowRight, ExternalLink, ChevronRight, Zap, Plus, Check, Menu, Briefcase, X, RefreshCw, Repeat } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import Wordmark from '@/components/Wordmark'
import ProfileButton from '@/components/ProfileButton'
import OutputTabs from '@/components/OutputTabs'
import { LANGUAGE_COLORS, fmtUpdated } from '@/components/GitHubRepoPicker'
import type { AnalyzeResponse, GitHubUserRepo } from '@/types'
import type { User } from '@supabase/supabase-js'

// ─── Types ─────────────────────────────────────────────────────────────────────

type View = 'home' | 'past' | 'detail' | 'repos' | 'jobs'

type RepoFetchStatus = 'ok' | 'failed'

// One match within a repo section — the shape returned per-item by
// GET /api/jobs/matches (see docs/prd-job-matching-revamp.md JM-9). Repo
// attribution lives one level up (RepoMatchGroup.repoName), not on the
// match itself, since the grouped UI already makes it the section header.
interface RepoJobMatch {
  title: string
  company: string
  location: string | null
  techTags: string[]
  reason: string
  url: string
  matchRank: number
}

// One section of the grouped jobs view — always present for every candidate
// repo, even with zero matches or a failed fetch (JM-12/13/14).
interface RepoMatchGroup {
  repoName: string
  fetchStatus: RepoFetchStatus
  matches: RepoJobMatch[]
}

interface SavedScore {
  id: string
  repo_url: string
  repo_name: string
  score: number | null
  label: string | null
  summary: string | null
  result: AnalyzeResponse
  created_at: string
}

const SCORE_FEATURES = [
  'Repo score out of 100 — weighted like a recruiter skim',
  'Specific gaps in README, setup, docs, and shipping proof',
  'Resume bullets pulled from your actual stack and features',
  'Saved to your workspace so you can rescore as you improve',
] as const

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function scoreAccent(n: number | null) {
  if (n === null) return { text: 'text-[#687386]', badge: 'bg-[#111827] text-[#687386] border-[#1E2A3D]', box: 'bg-[#111827] border-[#1E2A3D]' }
  if (n >= 90) return { text: 'text-emerald-400', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20', box: 'bg-emerald-500/10 border-emerald-500/25' }
  if (n >= 80) return { text: 'text-blue-400', badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20', box: 'bg-blue-500/10 border-blue-500/25' }
  if (n >= 70) return { text: 'text-amber-400', badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20', box: 'bg-amber-500/10 border-amber-500/25' }
  if (n >= 60) return { text: 'text-orange-400', badge: 'bg-orange-400/10 text-orange-400 border-orange-400/20', box: 'bg-orange-500/10 border-orange-500/25' }
  return { text: 'text-red-400', badge: 'bg-red-400/10 text-red-400 border-red-400/20', box: 'bg-red-500/10 border-red-500/25' }
}

function continueScoreText(n: number | null) {
  if (n === null) return 'text-[#687386]'
  if (n >= 90) return 'text-emerald-400'
  if (n >= 80) return 'text-[#7AA7FF]'
  if (n >= 70) return 'text-amber-400'
  if (n >= 60) return 'text-orange-400'
  return 'text-red-400'
}

function pastRepoScoreAccent(n: number | null) {
  if (n !== null && n >= 80) {
    return { text: 'text-[#22C55E]', badge: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/25' }
  }
  const accent = scoreAccent(n)
  return { text: accent.text, badge: accent.badge }
}

function averageScore(scores: SavedScore[]) {
  const scored = scores.filter((s) => s.score !== null)
  if (!scored.length) return null
  return Math.round(scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length)
}

// ─── GitHub repo grid card ──────────────────────────────────────────────────────

function GithubRepoCard({ repo, onScore, accent = 'green' }: { repo: GitHubUserRepo; onScore: (url: string) => void; accent?: 'green' | 'blue' }) {
  const border = accent === 'green' ? 'border-[#22C55E]/25 hover:border-[#22C55E]/45' : 'border-[#7AA7FF]/25 hover:border-[#7AA7FF]/45'
  return (
    <button
      type="button"
      onClick={() => onScore(repo.htmlUrl)}
      className={`group flex w-full flex-col rounded-xl border ${border} bg-[#0D111C] p-5 text-left transition hover:bg-[#0F1420]`}
    >
      <p className="truncate font-mono text-sm font-medium text-[#F5F3EA]">{repo.name}</p>
      <p className="mt-2 flex items-center gap-2 text-xs text-[#687386]">
        {repo.language && (
          <span className={`h-2 w-2 shrink-0 rounded-full ${LANGUAGE_COLORS[repo.language] ?? 'bg-[#687386]'}`} />
        )}
        <span className="truncate">{repo.language ? `${repo.language} · ` : ''}updated {fmtUpdated(repo.updatedAt)}</span>
      </p>
      <span className="mt-5 inline-flex w-fit items-center gap-1 rounded-lg bg-[#22C55E]/15 px-2.5 py-1 text-[11px] font-semibold text-[#22C55E] transition group-hover:bg-[#22C55E]/25">
        Score →
      </span>
    </button>
  )
}

// ─── Past repos grid ───────────────────────────────────────────────────────────

function PastRepoCard({ s, onOpen }: { s: SavedScore; onOpen: () => void }) {
  const accent = pastRepoScoreAccent(s.score)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col rounded-xl border border-[#22C55E]/25 bg-[#0D111C] p-5 text-left transition hover:border-[#22C55E]/45 hover:bg-[#0F1420]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tabular-nums leading-none ${accent.text}`}>
            {s.score ?? '—'}
          </span>
          <span className="text-sm text-[#3D4A60]">/100</span>
        </div>
        <time className="text-xs tabular-nums text-[#3D4A60]" dateTime={s.created_at}>
          {fmtDate(s.created_at)}
        </time>
      </div>

      <p className="mt-4 truncate font-mono text-sm font-medium text-[#F5F3EA]">{s.repo_name}</p>

      {s.label && (
        <span className={`mt-2 inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-medium ${accent.badge}`}>
          {s.label}
        </span>
      )}

      <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-[#22C55E]/70 transition group-hover:text-[#22C55E]">
        View score
        <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

interface NavItem {
  id: View
  label: string
  Icon: React.ComponentType<{ className?: string }>
  active: boolean
  badge: number | null
}

function NavButtons({ items, onSelect }: { items: NavItem[]; onSelect: (id: View) => void }) {
  return (
    <>
      {items.map(({ id, label, Icon, active, badge }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            active ? 'bg-[#151D30] text-[#F5F3EA]' : 'text-[#687386] hover:bg-[#0F1520] hover:text-[#9AA3B5]'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
          {badge !== null && (
            <span className="ml-auto rounded-full bg-[#141D2E] px-1.5 py-0.5 text-[10px] tabular-nums text-[#3D4A60]">
              {badge}
            </span>
          )}
        </button>
      ))}
    </>
  )
}

function JobMatchCard({ m }: { m: RepoJobMatch }) {
  return (
    <div className="flex w-full flex-col rounded-xl border border-[#1E2A3D] bg-[#0D111C] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#F5F3EA]">{m.title}</p>
          <p className="mt-0.5 truncate text-xs text-[#687386]">
            {m.company}
            {m.location ? ` · ${m.location}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-bold text-[#22C55E]">
          #{m.matchRank}
        </span>
      </div>

      {m.techTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {m.techTags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full border border-[#1E2A3D] bg-[#111827] px-2 py-0.5 text-[10px] text-[#9AA3B5]">
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm leading-snug text-[#9AA3B5]">{m.reason}</p>

      <div className="mt-4 flex items-center justify-end border-t border-[#1E2A3D] pt-3">
        <a
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#F5F3EA] px-3 py-1.5 text-xs font-semibold text-[#070A12] transition hover:bg-white"
        >
          Apply <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

// ─── Job matching: per-repo section (JM-12 through JM-15) ──────────────────────

function RepoMatchSection({
  group,
  githubUsername,
  swapCandidates,
  swapOpen,
  swapSubmitting,
  onToggleSwap,
  onSwap,
  onRetry,
  retrying,
}: {
  group: RepoMatchGroup
  githubUsername: string
  swapCandidates: GitHubUserRepo[]
  swapOpen: boolean
  swapSubmitting: boolean
  onToggleSwap: () => void
  onSwap: (repoName: string) => void
  onRetry: () => void
  retrying: boolean
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate font-mono text-sm font-semibold text-[#F5F3EA]">{group.repoName}</h2>
          <a
            href={`https://github.com/${githubUsername}/${group.repoName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[#3D4A60] transition hover:text-[#7AA7FF]"
            aria-label={`Open ${group.repoName} on GitHub`}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onToggleSwap}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2A3D] px-2.5 py-1 text-xs font-medium text-[#9AA3B5] transition hover:border-[#334155] hover:text-[#F5F3EA]"
          >
            <Repeat className="h-3 w-3" /> Swap
          </button>

          {swapOpen && (
            <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-xl border border-[#1E2A3D] bg-[#0D111C] p-2 shadow-2xl shadow-black/60">
              <p className="px-2 py-1 text-[11px] text-[#3D4A60]">Use a different repo for this slot</p>
              {swapCandidates.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[#687386]">No other eligible repos found.</p>
              ) : (
                <div className="max-h-56 space-y-1 overflow-y-auto">
                  {swapCandidates.map((r) => (
                    <button
                      key={r.name}
                      type="button"
                      disabled={swapSubmitting}
                      onClick={() => onSwap(r.name)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-[#9AA3B5] transition hover:bg-[#111827] hover:text-[#F5F3EA] disabled:opacity-50"
                    >
                      <span className="truncate font-mono">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {group.fetchStatus === 'failed' && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-red-400/25 bg-[#0D111C] px-5 py-8 text-center">
          <p className="text-sm font-medium text-red-400">Couldn&apos;t load this repo.</p>
          <p className="mt-1 max-w-sm text-xs text-[#3D4A60]">GitHub didn&apos;t respond in time for this repo — the rest of your matches are unaffected.</p>
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#1E2A3D] px-3 py-1.5 text-xs font-semibold text-[#9AA3B5] transition hover:border-[#334155] hover:text-[#F5F3EA] disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} /> {retrying ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      )}

      {group.fetchStatus === 'ok' && group.matches.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-[#1E2A3D] px-5 py-8 text-center">
          <p className="text-sm text-[#9AA3B5]">No strong match yet for this repo.</p>
          <p className="mt-1 max-w-sm text-xs text-[#3D4A60]">We only surface roles that genuinely fit — nothing forced to fill a slot.</p>
        </div>
      )}

      {group.fetchStatus === 'ok' && group.matches.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {group.matches.map((m) => (
            <JobMatchCard key={`${group.repoName}-${m.matchRank}`} m={m} />
          ))}
        </div>
      )}
    </section>
  )
}

// Dynamic header/summary copy (JM-17) — reflects the actual match count and
// repo spread instead of a hardcoded number.
function jobsHeaderCopy(groups: RepoMatchGroup[] | null): string {
  if (groups === null) return 'Matching open roles to your GitHub repos.'
  if (groups.length === 0) return 'No eligible repos found to match against yet.'

  const totalMatches = groups.reduce((sum, g) => sum + g.matches.length, 0)
  const reposWithMatches = groups.filter((g) => g.matches.length > 0).length

  if (totalMatches === 0) {
    return `Checked ${groups.length} of your repos — no strong matches yet.`
  }

  return `${totalMatches} role${totalMatches === 1 ? '' : 's'} across ${reposWithMatches} of your project${reposWithMatches === 1 ? '' : 's'}.`
}

function PastRepoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-[#22C55E]/20 bg-[#0D111C] p-5">
          <div className="h-8 w-16 animate-pulse rounded bg-[#1A2235]" />
          <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-[#1A2235]" />
          <div className="mt-2 h-5 w-20 animate-pulse rounded-full bg-[#1A2235]" />
        </div>
      ))}
    </div>
  )
}

// ─── Main dashboard ────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser]         = useState<User | null>(null)
  const [view, setView]         = useState<View>('home')
  const [scores, setScores]     = useState<SavedScore[]>([])
  const [selected, setSelected] = useState<SavedScore | null>(null)
  const [loading, setLoading]   = useState(true)
  const [githubRepos, setGithubRepos] = useState<GitHubUserRepo[] | null>(null)
  const [githubReposError, setGithubReposError] = useState('')
  const [jobMatchGroups, setJobMatchGroups] = useState<RepoMatchGroup[] | null>(null)
  const [jobMatchesError, setJobMatchesError] = useState('')
  const [jobMatchesRefreshing, setJobMatchesRefreshing] = useState(false)
  const [swapOpenFor, setSwapOpenFor] = useState<string | null>(null)
  const [swapSubmitting, setSwapSubmitting] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mobileNavRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setMobileNavOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/'); return }
      setUser(data.session.user)
      const { data: rows } = await supabase
        .from('repo_scores')
        .select('*')
        .order('created_at', { ascending: false })
      setScores((rows as SavedScore[]) ?? [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('view') === 'repos') setView('repos')
  }, [])

  const username  = user?.user_metadata?.username || user?.email?.split('@')[0] || 'you'
  const initial   = username[0]?.toUpperCase() ?? '?'
  const hasScores = scores.length > 0
  const githubUsername = user?.app_metadata?.provider === 'github' ? (user.user_metadata?.user_name ?? null) : null

  useEffect(() => {
    if (!githubUsername) return
    fetch('/api/github/repos')
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        setGithubRepos(data.repos as GitHubUserRepo[])
      })
      .catch(() => setGithubReposError('Could not load your repos from GitHub.'))
  }, [githubUsername])

  // Fetches /api/jobs/matches (JM-9's grouped-by-repo shape). `refresh: true`
  // bypasses the daily cache — used by the manual refresh button (JM-16),
  // per-repo retry action (JM-14), and after a swap (JM-15) so the new
  // candidate set is reflected immediately rather than waiting a day.
  const fetchJobMatches = useCallback((opts?: { refresh?: boolean }) => {
    setJobMatchesError('')
    if (opts?.refresh) setJobMatchesRefreshing(true)
    return fetch(`/api/jobs/matches${opts?.refresh ? '?refresh=1' : ''}`)
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        setJobMatchGroups(data.repos as RepoMatchGroup[])
      })
      .catch(() => setJobMatchesError('Could not load your matched roles right now.'))
      .finally(() => setJobMatchesRefreshing(false))
  }, [])

  useEffect(() => {
    if (view !== 'jobs' || !githubUsername || jobMatchGroups !== null) return
    fetchJobMatches()
  }, [view, githubUsername, jobMatchGroups, fetchJobMatches])

  // Swap action (JM-15): persists the override, then forces a full
  // re-fetch so the new candidate set (not yesterday's cache) is reflected.
  // There's no per-position patch endpoint — this calls the same
  // repo-overrides POST described in the task brief with the chosen repo
  // and this section's position.
  const handleSwap = useCallback(
    async (position: number, repoName: string) => {
      if (!githubUsername) return
      setSwapSubmitting(true)
      setJobMatchesError('')
      try {
        const res = await fetch('/api/jobs/repo-overrides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo_full_name: `${githubUsername}/${repoName}`, position }),
        })
        if (!res.ok) throw new Error()
        setSwapOpenFor(null)
        await fetchJobMatches({ refresh: true })
      } catch {
        setJobMatchesError('Could not swap that repo in — try again.')
      } finally {
        setSwapSubmitting(false)
      }
    },
    [githubUsername, fetchJobMatches]
  )

  const openDetail = (s: SavedScore) => { setSelected(s); setView('detail') }
  const rescan     = (s: SavedScore) => router.push(`/generate?repo=${encodeURIComponent(s.repo_url)}`)
  const scanRepo   = (repoUrl: string) => router.push(`/generate?repo=${encodeURIComponent(repoUrl)}`)

  const latest = scores[0]

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', Icon: Home, active: view === 'home', badge: null },
    { id: 'past', label: 'Past Repos', Icon: Clock, active: view === 'past' || view === 'detail', badge: scores.length > 0 ? scores.length : null },
    ...(githubUsername
      ? [{ id: 'repos' as View, label: 'My GitHub Repos', Icon: GithubIcon, active: view === 'repos', badge: githubRepos && githubRepos.length > 0 ? githubRepos.length : null }]
      : []),
    { id: 'jobs', label: 'My Job Postings', Icon: Briefcase, active: view === 'jobs', badge: null },
  ]

  const selectView = (id: View) => { setView(id); setSelected(null) }

  return (
    <div className="flex h-screen bg-[#080C18] text-[#F5F3EA]">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[#141D2E] bg-[#0B0F1C] md:flex">
        <div className="border-b border-[#141D2E] px-5 py-[18px]">
          <button
            type="button"
            onClick={() => { setView('home'); setSelected(null) }}
            className="transition-opacity hover:opacity-80"
            aria-label="RepoMax workspace home"
          >
            <Wordmark className="text-lg font-bold tracking-tight text-[#F8FAFC]" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          <NavButtons items={navItems} onSelect={selectView} />
        </nav>

        <div className="border-t border-[#141D2E] p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7AA7FF] text-xs font-bold text-[#070A12]">{initial}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#F5F3EA]">{username}</p>
              <p className="truncate text-[11px] text-[#3D4A60]">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">

        <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-[#141D2E] bg-[#080C18]/90 px-6 py-3 backdrop-blur-xl md:justify-end md:px-8">
          <div ref={mobileNavRef} className="relative flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9AA3B5] transition hover:bg-[#111827] hover:text-[#F5F3EA]"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => { setView('home'); setSelected(null) }}
              className="transition-opacity hover:opacity-80"
              aria-label="RepoMax workspace home"
            >
              <Wordmark className="text-lg font-bold tracking-tight text-[#F8FAFC]" />
            </button>

            {mobileNavOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-[#1E2A3D] bg-[#0D111C] p-1.5 shadow-2xl shadow-black/60">
                <NavButtons items={navItems} onSelect={(id) => { selectView(id); setMobileNavOpen(false) }} />
              </div>
            )}
          </div>
          <ProfileButton />
        </header>

        {/* ═══ HOME ════════════════════════════════════════════════════════════ */}
        {view === 'home' && (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8 sm:py-10">

              {/* Header */}
              <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-[#F5F3EA]">Your repo workspace</h1>
                <p className="mt-1 text-sm text-[#687386]">Score new repos and revisit saved ones.</p>
              </div>

              {/* Continue where you left off — compact banner, not a competing action */}
              {hasScores && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(latest)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openDetail(latest) }}
                  className="group mb-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#1E2A3D] bg-[#0D111C] px-5 py-3.5 transition hover:border-[#334155]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#3D4A60]">Continue</p>
                    <p className="truncate font-mono text-sm font-medium text-[#F5F3EA]">{latest.repo_name}</p>
                    {latest.label && (
                      <span className="hidden shrink-0 text-xs text-[#687386] sm:inline">{latest.label}</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <p className={`text-lg font-bold tabular-nums leading-none ${continueScoreText(latest.score)}`}>
                      {latest.score ?? '—'}<span className="text-xs font-normal text-[#3D4A60]">/100</span>
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); rescan(latest) }}
                      className="rounded-lg bg-[#F5F3EA] px-3 py-1.5 text-xs font-semibold text-[#070A12] transition group-hover:bg-white"
                    >
                      Rescore →
                    </button>
                  </div>
                </div>
              )}

              {/* Score a new repo — the one primary action on this screen */}
              {githubUsername ? (
                <div className="rounded-2xl border border-[#22C55E]/25 bg-[#0D111C] p-7">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#22C55E]">
                      <Plus className="h-2.5 w-2.5" /> NEW SCORE
                    </span>
                    <span className="rounded-full border border-[#1E2A3D] bg-[#111827] px-2 py-0.5 font-mono text-[10px] text-[#7AA7FF]">@{githubUsername}</span>
                  </div>

                  {githubReposError && <p className="mt-5 text-sm text-red-400">{githubReposError}</p>}

                  {!githubReposError && githubRepos === null && (
                    <div className="mt-5 space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-[52px] animate-pulse rounded-xl border border-[#1E2A3D] bg-[#090D16]" />
                      ))}
                    </div>
                  )}

                  {githubRepos !== null && githubRepos.length === 0 && (
                    <p className="mt-5 text-sm text-[#687386]">No public repos found on your GitHub account yet.</p>
                  )}

                  {githubRepos !== null && githubRepos.length > 0 && (
                    <div className="mt-5 space-y-2">
                      {githubRepos.slice(0, 3).map((repo) => (
                        <button
                          key={repo.name}
                          type="button"
                          onClick={() => scanRepo(repo.htmlUrl)}
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
                          <span className="shrink-0 rounded-lg bg-[#22C55E]/15 px-3 py-1.5 text-xs font-semibold text-[#22C55E]">Score →</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {githubRepos !== null && githubRepos.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setView('repos')}
                      className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-[#7AA7FF] hover:text-[#9DBCFF]"
                    >
                      View all {githubRepos.length} repos →
                    </button>
                  )}
                </div>
              ) : (
                <Link
                  href="/generate"
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#22C55E]/25 bg-[#0D111C] p-7 transition hover:border-[#22C55E]/45 hover:bg-[#0C1510] sm:p-8"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#22C55E]/[0.07] to-transparent" />

                  <div className="relative">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#22C55E]">
                      <Plus className="h-2.5 w-2.5" /> NEW SCORE
                    </span>
                  </div>

                  <ul className="relative mt-5 space-y-3.5">
                    {SCORE_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/15">
                          <Check className="h-3 w-3 text-[#22C55E]" strokeWidth={2.5} />
                        </span>
                        <span className="text-sm leading-snug text-[#9AA3B5]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-8">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-[#F5F3EA] px-6 py-3 text-sm font-bold text-[#070A12] transition group-hover:bg-white">
                      Score My Repo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                    <p className="mt-3 text-xs text-[#3D4A60]">Takes about 30 seconds · no install needed</p>
                  </div>
                </Link>
              )}

            </div>
          </div>
        )}

        {/* ═══ PAST REPOS ══════════════════════════════════════════════════════ */}
        {view === 'past' && !selected && (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8 sm:py-10">

              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#F5F3EA]">Past repos</h1>
                  <p className="mt-1 text-sm text-[#687386]">
                    {loading ? 'Loading…' : scores.length === 0
                      ? 'Your saved scores live here.'
                      : (() => {
                          const avg = averageScore(scores)
                          return avg !== null
                            ? `${scores.length} repo${scores.length === 1 ? '' : 's'} · ${avg} avg score`
                            : `${scores.length} repo${scores.length === 1 ? '' : 's'}`
                        })()}
                  </p>
                </div>
                <Link
                  href="/generate"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F5F3EA] px-4 py-2 text-sm font-medium text-[#070A12] transition hover:bg-white"
                >
                  <Plus className="h-4 w-4" /> New score
                </Link>
              </div>

              {loading ? (
                <PastRepoGridSkeleton />
              ) : scores.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-[#1E2A3D] px-6 py-16 text-center">
                  <p className="text-sm text-[#9AA3B5]">No repos scored yet.</p>
                  <p className="mt-1 text-xs text-[#3D4A60]">Paste a GitHub URL to get your first score.</p>
                  <Link
                    href="/generate"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#F5F3EA] px-4 py-2 text-sm font-medium text-[#070A12] transition hover:bg-white"
                  >
                    Score a repo <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {scores.map((s) => (
                    <PastRepoCard key={s.id} s={s} onOpen={() => openDetail(s)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ MY GITHUB REPOS ═══════════════════════════════════════════════════ */}
        {view === 'repos' && (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8 sm:py-10">

              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#F5F3EA]">My GitHub repos</h1>
                  <p className="mt-1 text-sm text-[#687386]">
                    {githubRepos === null
                      ? 'Loading…'
                      : `${githubRepos.length} public repo${githubRepos.length === 1 ? '' : 's'} · forks hidden`}
                  </p>
                </div>
                <span className="rounded-full border border-[#1E2A3D] bg-[#111827] px-3 py-1.5 font-mono text-xs text-[#7AA7FF]">@{githubUsername}</span>
              </div>

              {githubReposError && <p className="text-sm text-red-400">{githubReposError}</p>}

              {!githubReposError && githubRepos === null && <PastRepoGridSkeleton />}

              {githubRepos !== null && githubRepos.length === 0 && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-[#1E2A3D] px-6 py-16 text-center">
                  <p className="text-sm text-[#9AA3B5]">No public repos found on your GitHub account yet.</p>
                </div>
              )}

              {githubRepos !== null && githubRepos.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {githubRepos.map((repo) => (
                    <GithubRepoCard key={repo.name} repo={repo} onScore={scanRepo} accent="blue" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ MY JOB POSTINGS ═══════════════════════════════════════════════════ */}
        {view === 'jobs' && (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8 sm:py-10">

              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#F5F3EA]">My job postings</h1>
                  <p className="mt-1 text-sm text-[#687386]">{jobsHeaderCopy(jobMatchGroups)}</p>
                </div>
                {githubUsername && (
                  <button
                    type="button"
                    onClick={() => fetchJobMatches({ refresh: true })}
                    disabled={jobMatchesRefreshing}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#1E2A3D] bg-[#0D111C] px-3 py-2 text-xs font-medium text-[#9AA3B5] transition hover:border-[#334155] hover:text-[#F5F3EA] disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${jobMatchesRefreshing ? 'animate-spin' : ''}`} />
                    {jobMatchesRefreshing ? 'Refreshing…' : 'Refresh matches'}
                  </button>
                )}
              </div>

              {!githubUsername && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-[#1E2A3D] px-6 py-16 text-center">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#111827]">
                    <Briefcase className="h-4 w-4 text-[#3D4A60]" />
                  </span>
                  <p className="text-sm font-medium text-[#9AA3B5]">Connect GitHub to get matched.</p>
                  <p className="mt-1 max-w-sm text-xs text-[#3D4A60]">
                    Job matching is available for accounts signed in with GitHub — it looks at 3-4 of your active public repos (no forks, no empty ones).
                  </p>
                </div>
              )}

              {githubUsername && jobMatchesError && jobMatchGroups !== null && (
                <p className="mb-6 text-sm text-red-400">{jobMatchesError}</p>
              )}

              {githubUsername && jobMatchGroups === null && !jobMatchesError && (
                <div className="space-y-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <div className="mb-3 h-4 w-32 animate-pulse rounded bg-[#1A2235]" />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-[#1E2A3D] bg-[#0D111C] p-5">
                          <div className="h-4 w-2/3 animate-pulse rounded bg-[#1A2235]" />
                          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#1A2235]" />
                          <div className="mt-4 h-3 w-full animate-pulse rounded bg-[#1A2235]" />
                          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-[#1A2235]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {githubUsername && jobMatchGroups === null && jobMatchesError && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-red-400/25 bg-[#0D111C] px-6 py-16 text-center">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#111827]">
                    <Briefcase className="h-4 w-4 text-red-400" />
                  </span>
                  <p className="text-sm font-medium text-red-400">{jobMatchesError}</p>
                  <p className="mt-1 max-w-sm text-xs text-[#3D4A60]">Something went wrong loading your matched roles.</p>
                  <button
                    type="button"
                    onClick={() => fetchJobMatches({ refresh: true })}
                    disabled={jobMatchesRefreshing}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-[#1E2A3D] bg-[#0D111C] px-3 py-1.5 text-xs font-semibold text-[#9AA3B5] transition hover:border-[#334155] hover:text-[#F5F3EA] disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${jobMatchesRefreshing ? 'animate-spin' : ''}`} />
                    {jobMatchesRefreshing ? 'Refreshing…' : 'Refresh matches'}
                  </button>
                </div>
              )}

              {githubUsername && jobMatchGroups !== null && jobMatchGroups.length === 0 && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-[#1E2A3D] px-6 py-16 text-center">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#111827]">
                    <Briefcase className="h-4 w-4 text-[#3D4A60]" />
                  </span>
                  <p className="text-sm font-medium text-[#9AA3B5]">No eligible repos found yet.</p>
                  <p className="mt-1 max-w-sm text-xs text-[#3D4A60]">
                    We match against active, non-fork public repos — push something and refresh.
                  </p>
                </div>
              )}

              {githubUsername && jobMatchGroups !== null && jobMatchGroups.length > 0 && (
                <div className="space-y-8">
                  {jobMatchGroups.map((group, idx) => {
                    const candidateNames = new Set(jobMatchGroups.map((g) => g.repoName))
                    const swapCandidates = (githubRepos ?? []).filter((r) => !candidateNames.has(r.name))
                    return (
                      <RepoMatchSection
                        key={group.repoName}
                        group={group}
                        githubUsername={githubUsername}
                        swapCandidates={swapCandidates}
                        swapOpen={swapOpenFor === group.repoName}
                        swapSubmitting={swapSubmitting}
                        onToggleSwap={() => setSwapOpenFor((cur) => (cur === group.repoName ? null : group.repoName))}
                        onSwap={(repoName) => handleSwap(idx, repoName)}
                        onRetry={() => fetchJobMatches({ refresh: true })}
                        retrying={jobMatchesRefreshing}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ DETAIL ══════════════════════════════════════════════════════════ */}
        {view === 'detail' && selected && (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-8 py-8">

              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <button
                    onClick={() => { setView('past'); setSelected(null) }}
                    className="mb-3 flex items-center gap-1.5 text-xs text-[#687386] transition hover:text-[#F5F3EA]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Past Repos
                  </button>
                  <p className="font-mono text-lg font-semibold text-[#F5F3EA]">{selected.repo_name}</p>
                  <p className="mt-0.5 text-xs text-[#3D4A60]">Scored {fmtDate(selected.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-2 pt-8">
                  <a
                    href={selected.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-[#1E2A3D] bg-[#0D111C] px-3 py-2 text-xs font-medium text-[#9AA3B5] transition hover:border-[#2E3A52] hover:text-[#F5F3EA]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> GitHub
                  </a>
                  <button
                    onClick={() => rescan(selected)}
                    className="rounded-xl bg-[#F5F3EA] px-4 py-2 text-xs font-semibold text-[#070A12] transition hover:bg-white"
                  >
                    Rescore →
                  </button>
                </div>
              </div>

              <OutputTabs data={selected.result} repoUrl={selected.repo_url} isLoading={false} isAuthed />
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
