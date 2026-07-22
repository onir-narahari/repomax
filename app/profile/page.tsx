'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Clock, ArrowLeft, ArrowRight, ExternalLink, ChevronRight, Plus, Check, Menu, Briefcase, X, RefreshCw, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import Wordmark from '@/components/Wordmark'
import ProfileButton from '@/components/ProfileButton'
import OutputTabs from '@/components/OutputTabs'
import JobsOnboardingConfirm from '@/components/JobsOnboardingConfirm'
import Sparkline from '@/components/Sparkline'
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
  postedAt: string | null
  // null when the matching engine's fallback path picked this candidate
  // without a GPT score (see lib/matching-engine.ts) — labeled as "Possible
  // fit" rather than hidden or given a fabricated number.
  confidence: number | null
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

// Three-tier system for the Repos Scored dashboard (rail color, chip, and
// sparkline tone all key off this) — deliberately coarser than scoreAccent's
// five bands above, since a rail/chip only needs to answer "does this repo
// need attention or not," not show the full gradient.
type Tier = 'green' | 'blue' | 'amber' | 'muted'

function tierMeta(n: number | null): { tone: Tier; name: string } {
  if (n === null) return { tone: 'muted', name: 'Unscored' }
  if (n >= 80) return { tone: 'green', name: 'Strong' }
  if (n >= 60) return { tone: 'blue', name: 'Good' }
  return { tone: 'amber', name: 'Needs attention' }
}

const TIER_CLASSES: Record<Tier, { rail: string; chip: string; text: string; glow: string }> = {
  green: { rail: 'bg-[#22C55E]', chip: 'border-[#22C55E]/25 bg-[#22C55E]/10 text-[#22C55E]', text: 'text-[#22C55E]', glow: 'hover:shadow-[0_16px_36px_-18px_rgba(34,197,94,0.45)]' },
  blue: { rail: 'bg-[#7AA7FF]', chip: 'border-[#7AA7FF]/25 bg-[#7AA7FF]/10 text-[#7AA7FF]', text: 'text-[#7AA7FF]', glow: 'hover:shadow-[0_16px_36px_-18px_rgba(122,167,255,0.45)]' },
  amber: { rail: 'bg-[#F59E0B]', chip: 'border-[#F59E0B]/25 bg-[#F59E0B]/10 text-[#F59E0B]', text: 'text-[#F59E0B]', glow: 'hover:shadow-[0_16px_36px_-18px_rgba(245,158,11,0.45)]' },
  muted: { rail: 'bg-[#3D4A60]', chip: 'border-[#1E2A3D] bg-[#111827] text-[#687386]', text: 'text-[#687386]', glow: '' },
}

// Days-since-update bucket used for the "worth scoring right now" freshness
// dot on unscored GitHub repos — recency is the only signal we have before
// a repo's been scanned at all.
function freshnessTone(iso: string): Tier {
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000
  if (days < 7) return 'green'
  if (days < 30) return 'blue'
  return 'muted'
}

// Every match now always shows — the confidence gate only decides how it's
// labeled, not whether it's shown at all (2026-07-20: "no repo left with a
// wall"). null means the matching engine's fallback picked this candidate
// without a GPT score at all, so it gets the lowest, most honest tier.
function matchFitTier(confidence: number | null) {
  if (confidence === null) {
    return { label: 'Possible fit', className: 'border-[#1E2A3D] bg-[#111827] text-[#687386]' }
  }
  if (confidence >= 75) {
    return { label: 'Strong fit', className: 'border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]' }
  }
  if (confidence >= 50) {
    return { label: 'Good fit', className: 'border-blue-400/20 bg-blue-400/10 text-blue-400' }
  }
  return { label: 'Possible fit', className: 'border-[#1E2A3D] bg-[#111827] text-[#687386]' }
}

// One repo's full scan history, derived client-side from the flat `scores`
// rows (one row per scan) — no schema change needed to get a trend line.
interface RepoHistory {
  repoUrl: string
  repoName: string
  latest: SavedScore
  history: number[] // non-null scores, oldest → newest
  delta: number | null // latest - first, only set with 2+ scored scans
  scanCount: number
}

function buildRepoHistories(scores: SavedScore[]): RepoHistory[] {
  const byRepo = new Map<string, SavedScore[]>()
  for (const s of scores) {
    const bucket = byRepo.get(s.repo_url)
    if (bucket) bucket.push(s)
    else byRepo.set(s.repo_url, [s])
  }

  const histories: RepoHistory[] = []
  for (const [repoUrl, rows] of byRepo) {
    const sorted = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const latest = sorted[sorted.length - 1]
    const history = sorted.map((r) => r.score).filter((n): n is number => n !== null)
    const delta = history.length >= 2 ? history[history.length - 1] - history[0] : null
    histories.push({ repoUrl, repoName: latest.repo_name, latest, history, delta, scanCount: sorted.length })
  }

  return histories.sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime())
}

function repoDashboardStats(histories: RepoHistory[]) {
  const scored = histories.map((h) => h.latest.score).filter((n): n is number => n !== null)
  const avg = scored.length ? Math.round(scored.reduce((sum, n) => sum + n, 0) / scored.length) : null
  const mostImproved = histories
    .filter((h) => h.delta !== null && h.delta > 0)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))[0] ?? null
  const needsAttention = histories.filter((h) => h.latest.score !== null && h.latest.score < 60).length
  return { total: histories.length, avg, mostImproved, needsAttention }
}

// The single repo Home's "next fix" nudge points at — only surfaces one
// that's genuinely below par (< 80) so a repo that's already strong never
// gets an unwarranted "fix this" nudge.
function lowestScoringHistory(histories: RepoHistory[]): RepoHistory | null {
  const candidates = histories.filter((h) => h.latest.score !== null && h.latest.score < 80)
  if (!candidates.length) return null
  return candidates.sort((a, b) => (a.latest.score ?? 0) - (b.latest.score ?? 0))[0]
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

// ─── Repos scored grid ──────────────────────────────────────────────────────────

function ScoredRepoCard({ rh, onOpen }: { rh: RepoHistory; onOpen: () => void }) {
  const { tone, name } = tierMeta(rh.latest.score)
  const cls = TIER_CLASSES[tone]

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative flex w-full flex-col overflow-hidden rounded-xl border border-[#1E2A3D] bg-[#0D111C] p-5 pl-6 text-left transition hover:-translate-y-0.5 hover:border-[#334155] ${cls.glow}`}
    >
      <span className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${cls.rail}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tabular-nums leading-none ${cls.text}`}>{rh.latest.score ?? '—'}</span>
          <span className="text-sm text-[#3D4A60]">/100</span>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls.chip}`}>
          {rh.latest.label ?? name}
        </span>
      </div>

      <div className="mt-3 h-9">
        {rh.history.length > 0 ? (
          <Sparkline points={rh.history} tone={tone} className="h-9 w-full" />
        ) : (
          <div className="h-px w-full bg-[#1E2A3D]" />
        )}
      </div>

      <p className="mt-3 truncate font-mono text-sm font-medium text-[#F5F3EA]">{rh.repoName}</p>

      <p className="mt-1 text-xs text-[#687386]">
        {rh.delta !== null ? (
          rh.delta > 0 ? (
            <span className="text-[#22C55E]">▲ +{rh.delta} all-time</span>
          ) : rh.delta < 0 ? (
            <span className="text-red-400">▼ {rh.delta} all-time</span>
          ) : (
            'No change since first scan'
          )
        ) : rh.scanCount > 1 ? (
          'Flat across scans'
        ) : (
          'First scan · no trend yet'
        )}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-[#1E2A3D] pt-3">
        <time className="text-[11px] text-[#3D4A60]" dateTime={rh.latest.created_at}>
          Scanned {fmtUpdated(rh.latest.created_at)}
        </time>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9AA3B5] transition group-hover:text-[#F5F3EA]">
          View
          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  )
}

// Stats strip above the Repos Scored grid — every number is derived from
// the same `histories` the grid renders, nothing separately computed.
const STAT_LABEL_CLASS = 'mt-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#F5F3EA]'

function ScoredStatsStrip({ stats }: { stats: ReturnType<typeof repoDashboardStats> }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#1E2A3D] bg-[#1E2A3D] sm:grid-cols-4">
      <div className="bg-[#0D111C] px-4 py-3.5">
        <p className="font-mono text-lg font-bold tabular-nums text-[#F9A8D4]">{stats.total}</p>
        <p className={STAT_LABEL_CLASS}>repos scored</p>
      </div>
      <div className="bg-[#0D111C] px-4 py-3.5">
        <p className="font-mono text-lg font-bold tabular-nums text-[#F9A8D4]">{stats.avg ?? '—'}</p>
        <p className={STAT_LABEL_CLASS}>avg score</p>
      </div>
      <div
        className="bg-[#0D111C] px-4 py-3.5"
        title={stats.mostImproved ? `${stats.mostImproved.repoName} · +${stats.mostImproved.delta}` : undefined}
      >
        <p
          className={`font-mono text-lg font-bold tabular-nums text-[#F9A8D4] ${stats.mostImproved ? '' : 'select-none blur-[3px]'}`}
          aria-hidden={stats.mostImproved ? undefined : true}
        >
          {stats.mostImproved ? `+${stats.mostImproved.delta}` : '+12'}
        </p>
        <p className={STAT_LABEL_CLASS}>
          {!stats.mostImproved && <span className="sr-only">Most improved: locked — scan again to unlock — </span>}
          most improved
        </p>
      </div>
      <div className="bg-[#0D111C] px-4 py-3.5">
        <p className="font-mono text-lg font-bold tabular-nums text-[#F9A8D4]">
          {stats.needsAttention}
        </p>
        <p className={STAT_LABEL_CLASS}>needs attention</p>
      </div>
    </div>
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
  const tier = matchFitTier(m.confidence)
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
        <div className="flex shrink-0 items-center gap-1.5">
          {m.postedAt && (
            <span className="rounded-full border border-[#1E2A3D] bg-[#111827] px-2 py-0.5 text-[10px] text-[#687386]">
              Posted {fmtUpdated(m.postedAt)}
            </span>
          )}
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tier.className}`}>
            {tier.label}
          </span>
        </div>
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

function RepoGridSkeleton() {
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

// ─── First-time teasers (blurred dashboard preview) ─────────────────────────────
// Shown instead of a plain "nothing here yet" box for brand-new accounts —
// the real dashboard shape, blurred and clearly labeled as a preview, so the
// payoff of scanning a repo is visible before the user has scanned one.

const TEASER_REPOS: { name: string; score: number; history: number[]; tier: Tier }[] = [
  { name: 'campus-marketplace', score: 91, history: [72, 78, 85, 91], tier: 'green' },
  { name: 'resume-parser-ml', score: 64, history: [58, 60, 55, 64], tier: 'amber' },
  { name: 'job-tracker-api', score: 78, history: [70, 74, 78], tier: 'blue' },
  { name: 'discord-bot-utils', score: 83, history: [83], tier: 'blue' },
]

function ScoredDashboardTeaser({ onScan }: { onScan: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1E2A3D]">
      <div aria-hidden className="pointer-events-none select-none p-6 opacity-60 blur-[5px]">
        <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#1E2A3D] bg-[#1E2A3D] sm:grid-cols-4">
          {[['4', 'repos scored'], ['79', 'avg score'], ['+19', 'most improved'], ['1', 'needs attention']].map(([v, l]) => (
            <div key={l} className="bg-[#0D111C] px-4 py-3.5">
              <p className="font-mono text-lg font-bold tabular-nums text-[#F5F3EA]">{v}</p>
              <p className="mt-0.5 text-[10.5px] text-[#3D4A60]">{l}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEASER_REPOS.map((r) => {
            const cls = TIER_CLASSES[r.tier]
            return (
              <div key={r.name} className="relative overflow-hidden rounded-xl border border-[#1E2A3D] bg-[#0D111C] p-5 pl-6">
                <span className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${cls.rail}`} />
                <div className="flex items-start justify-between gap-3">
                  <span className={`text-3xl font-bold tabular-nums leading-none ${cls.text}`}>{r.score}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${cls.chip}`}>{tierMeta(r.score).name}</span>
                </div>
                <div className="mt-3 h-9">
                  <Sparkline points={r.history} tone={r.tier} className="h-9 w-full" />
                </div>
                <p className="mt-3 truncate font-mono text-sm font-medium text-[#F5F3EA]">{r.name}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#080C18]/5 via-[#080C18]/60 to-[#080C18]/90 px-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1E2A3D] bg-[#0D111C]">
          <Lock className="h-4 w-4 text-[#7AA7FF]" />
        </span>
        <p className="text-sm font-semibold text-[#F5F3EA]">This is your dashboard once you scan a repo</p>
        <p className="max-w-xs text-xs text-[#687386]">Score trends, most-improved, what needs attention — all built from your real scans.</p>
        <button
          type="button"
          onClick={onScan}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#F5F3EA] px-4 py-2 text-sm font-semibold text-[#070A12] transition hover:bg-white"
        >
          Scan your first repo <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Home: two-section layout (black + light-pink accent) ──────────────────────
// "Score your repos" (primary, wider) and "Apply to jobs" (teaser, narrower)
// as two equally-weighted cards, each owning one accent color (#F9A8D4) and
// one clear action — replaces the old stack of same-weight status widgets
// (Continue card, nudge, job teaser, New Score panel).

function ScoreReposSection({
  githubUsername,
  githubRepos,
  githubReposError,
  hasScores,
  latest,
  repoHistories,
  nudgeTarget,
  onOpenDetail,
  onRescan,
  onScanRepo,
  onViewAllRepos,
}: {
  githubUsername: string | null
  githubRepos: GitHubUserRepo[] | null
  githubReposError: string
  hasScores: boolean
  latest: SavedScore | undefined
  repoHistories: RepoHistory[]
  nudgeTarget: RepoHistory | null
  onOpenDetail: (s: SavedScore) => void
  onRescan: (s: SavedScore) => void
  onScanRepo: (url: string) => void
  onViewAllRepos: () => void
}) {
  const weakness = nudgeTarget?.latest.result?.repoScore?.weaknesses?.[0]

  return (
    <div className="rounded-2xl border border-[#1E2A3D] bg-[#0D111C] p-7 lg:col-span-3">
      <h2 className="text-2xl font-bold tracking-tight text-[#F5F3EA]">Score your repos</h2>
      <p className="mt-1 text-sm text-[#687386]">Pick one below and get a score in under a minute.</p>

      {!githubUsername ? (
        <Link
          href="/generate"
          className="group relative mt-6 flex flex-col overflow-hidden rounded-xl border border-[#F9A8D4]/25 bg-[#100C12] p-6 transition hover:border-[#F9A8D4]/45"
        >
          <ul className="space-y-3">
            {SCORE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F9A8D4]/15">
                  <Check className="h-3 w-3 text-[#F9A8D4]" strokeWidth={2.5} />
                </span>
                <span className="text-sm leading-snug text-[#9AA3B5]">{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#F9A8D4] px-5 py-2.5 text-sm font-bold text-[#070A12] transition group-hover:brightness-110">
              Score My Repo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
            <p className="mt-2.5 text-xs text-[#3D4A60]">Takes about 30 seconds · no install needed</p>
          </div>
        </Link>
      ) : (
        <>
          {hasScores && latest && repoHistories[0] && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => onOpenDetail(latest)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenDetail(latest) }}
              className="group relative mt-6 flex cursor-pointer items-center gap-5 rounded-xl bg-[#090D16] px-5 py-4.5 pl-6 transition hover:bg-[#111827]/60"
            >
              <span className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-[#F9A8D4]" />

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate font-mono text-sm font-medium text-[#F5F3EA]">{latest.repo_name}</p>
                {nudgeTarget && weakness && <p className="truncate text-xs text-[#687386]">{weakness}</p>}
              </div>

              <p className="shrink-0 text-xl font-bold tabular-nums text-[#F5F3EA]">
                {latest.score ?? '—'}<span className="text-xs font-normal text-[#3D4A60]">/100</span>
              </p>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRescan(latest) }}
                className="shrink-0 rounded-lg bg-[#F9A8D4] px-4 py-2 text-xs font-semibold text-[#070A12] transition group-hover:brightness-110"
              >
                Rescore →
              </button>
            </div>
          )}

          {githubReposError && <p className="mt-6 text-sm text-red-400">{githubReposError}</p>}

          {!githubReposError && githubRepos === null && (
            <div className="mt-6 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[52px] animate-pulse rounded-lg bg-[#090D16]" />
              ))}
            </div>
          )}

          {githubRepos !== null && githubRepos.length === 0 && (
            <p className="mt-6 text-sm text-[#687386]">No public repos found on your GitHub account yet.</p>
          )}

          {githubRepos !== null && githubRepos.length > 0 && (
            <div className={`divide-y divide-[#1E2A3D] ${hasScores ? 'mt-2 border-t border-[#1E2A3D]' : 'mt-6'}`}>
              {githubRepos.slice(0, 3).map((repo) => {
                const fresh = TIER_CLASSES[freshnessTone(repo.updatedAt)]
                return (
                  <button
                    key={repo.name}
                    type="button"
                    onClick={() => onScanRepo(repo.htmlUrl)}
                    className="flex w-full items-center justify-between py-3.5 text-left transition hover:bg-[#111827]/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${fresh.rail}`} />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-medium text-[#F5F3EA]">{repo.name}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-[#687386]">
                          {repo.language && (
                            <span className={`h-2 w-2 shrink-0 rounded-full ${LANGUAGE_COLORS[repo.language] ?? 'bg-[#687386]'}`} />
                          )}
                          <span className="truncate">{repo.language ? `${repo.language} · ` : ''}updated {fmtUpdated(repo.updatedAt)}</span>
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-[#F9A8D4]/15 px-3 py-1.5 text-xs font-semibold text-[#F9A8D4]">Score →</span>
                  </button>
                )
              })}
            </div>
          )}

          {githubRepos !== null && githubRepos.length > 3 && (
            <button
              type="button"
              onClick={onViewAllRepos}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-[#F9A8D4] hover:brightness-110"
            >
              View all {githubRepos.length} repos →
            </button>
          )}
        </>
      )}
    </div>
  )
}

// Always the same teaser, regardless of GitHub/onboarding/match state — same
// idea as ContinueBannerTeaser/ScoredDashboardTeaser elsewhere on Home:
// illustrative rows blurred behind a centered CTA. Home teases; the Jobs tab
// (which onViewJobs routes to) is where real per-state handling (connect
// GitHub, run onboarding, show real matches, errors) actually lives.
function ApplyJobsSection({ onViewJobs }: { onViewJobs: () => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#1E2A3D] bg-[#0D111C] p-7 lg:col-span-2">
      <h2 className="text-2xl font-bold tracking-tight text-[#F5F3EA]">Apply to jobs</h2>
      <p className="mt-1 text-sm text-[#687386]">3 jobs matched to your GitHub profile and skills.</p>

      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-3 rounded-lg bg-[#090D16] px-4 py-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F9A8D4]/15 text-xs font-bold text-[#F9A8D4]">
              {n}
            </span>
            <div aria-hidden className="h-3 select-none rounded-full bg-[#1E2A3D] blur-[4px]" style={{ width: `${64 - n * 10}%` }} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onViewJobs}
        className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#F9A8D4] px-5 py-2.5 text-sm font-semibold text-[#070A12] shadow-[0_6px_16px_-6px_rgba(249,168,212,0.5)] transition hover:brightness-110"
      >
        See your 3 matches <ArrowRight className="h-3.5 w-3.5" />
      </button>
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
  const [jobsProfile, setJobsProfile] = useState<{ onboarded: boolean; status: 'active' | 'needs_reonboarding'; repoNames: string[] } | null>(null)
  const [jobsProfileError, setJobsProfileError] = useState('')
  const [jobsConfirmMode, setJobsConfirmMode] = useState<'edit' | null>(null)
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

  // One entry per distinct repo (not per scan) with its full score history —
  // backs both the Repos Scored grid and Home's Continue banner/nudge, so
  // trend + tier logic lives in one place.
  const repoHistories = useMemo(() => buildRepoHistories(scores), [scores])
  const scoredStats = useMemo(() => repoDashboardStats(repoHistories), [repoHistories])
  const nudgeTarget = useMemo(() => lowestScoringHistory(repoHistories), [repoHistories])

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

  // Checks the onboarding gate for job matching (issue #15) as soon as
  // GitHub is connected — not gated on the jobs view being open — so the
  // "Analyzing your projects…" work the confirm screen kicks off has as
  // much of a head start as possible (docs/prd-job-matching.md §9).
  useEffect(() => {
    if (!githubUsername) return
    fetch('/api/jobs/profile')
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        setJobsProfile({
          onboarded: data.onboarded as boolean,
          status: data.status as 'active' | 'needs_reonboarding',
          repoNames: data.repoNames as string[],
        })
      })
      .catch(() => setJobsProfileError('Could not check your job-matching setup.'))
  }, [githubUsername])

  // Fetches /api/jobs/matches (JM-9's grouped-by-repo shape). `refresh: true`
  // bypasses the daily cache — used by the manual refresh button (JM-16) and
  // the per-repo retry action (JM-14) so the candidate set is reflected
  // immediately rather than waiting a day.
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

  // Only pull matches (the old live-compute path, unchanged by issue #15 —
  // see #17) once onboarding is actually done; otherwise the user is still
  // on the confirm screen and there's nothing meaningful to show yet. Home's
  // Apply-to-jobs card is a static teaser regardless of match state (always
  // routes into this tab), so this only needs to fire once the Jobs tab is
  // actually open.
  useEffect(() => {
    if (view !== 'jobs' || !githubUsername || jobMatchGroups !== null) return
    if (!jobsProfile?.onboarded) return
    fetchJobMatches()
  }, [view, githubUsername, jobMatchGroups, jobsProfile, fetchJobMatches])

  // Onboarding confirm screen (issue #15). `jobsConfirmScreenMode` derives
  // straight from state rather than being tracked separately: an
  // unonboarded user is always shown the onboarding flow (nothing to
  // toggle), while 'edit' is an explicit, dismissible re-entry via the
  // "Edit my projects" affordance.
  const jobsConfirmScreenMode: 'onboarding' | 'edit' | null =
    jobsConfirmMode === 'edit' ? 'edit' : jobsProfile && !jobsProfile.onboarded ? 'onboarding' : null

  const openEditProjects = useCallback(() => setJobsConfirmMode('edit'), [])
  const cancelEditProjects = useCallback(() => setJobsConfirmMode(null), [])

  const handleJobsProfileConfirmed = useCallback((repoNames: string[]) => {
    setJobsProfile((prev) => ({ onboarded: true, status: prev?.status ?? 'active', repoNames }))
    setJobsConfirmMode(null)
  }, [])

  const openDetail = (s: SavedScore) => { setSelected(s); setView('detail') }
  const rescan     = (s: SavedScore) => router.push(`/generate?repo=${encodeURIComponent(s.repo_url)}`)
  const scanRepo   = (repoUrl: string) => router.push(`/generate?repo=${encodeURIComponent(repoUrl)}`)

  const latest = scores[0]

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', Icon: Home, active: view === 'home', badge: null },
    { id: 'past', label: 'Repos Scored', Icon: Clock, active: view === 'past' || view === 'detail', badge: scores.length > 0 ? scores.length : null },
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
            <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 sm:py-10">

              {/* Header */}
              <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-[#F5F3EA]">Your repo workspace</h1>
              </div>

              {/* Two sections, equal footing: score your repos (primary, wider) and
                  apply to jobs (teaser, narrower) — replaces the old stack of
                  status widgets (Continue card, nudge, job teaser, New Score
                  panel) that all competed at the same visual weight.
                  items-start: each card sizes to its own content instead of
                  stretching to match the taller one — a short Jobs teaser
                  next to a long repo list shouldn't inherit its height. */}
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
                <ScoreReposSection
                  githubUsername={githubUsername}
                  githubRepos={githubRepos}
                  githubReposError={githubReposError}
                  hasScores={hasScores}
                  latest={latest}
                  repoHistories={repoHistories}
                  nudgeTarget={nudgeTarget}
                  onOpenDetail={openDetail}
                  onRescan={rescan}
                  onScanRepo={scanRepo}
                  onViewAllRepos={() => setView('repos')}
                />
                <ApplyJobsSection onViewJobs={() => setView('jobs')} />
              </div>

            </div>
          </div>
        )}

        {/* ═══ PAST REPOS ══════════════════════════════════════════════════════ */}
        {view === 'past' && !selected && (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8 sm:py-10">

              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#F5F3EA]">Repos scored</h1>
                  <p className="mt-1 text-sm text-[#687386]">
                    {loading
                      ? 'Loading…'
                      : scoredStats.total === 0
                        ? 'No repos scored yet.'
                        : scoredStats.avg !== null
                          ? `${scoredStats.total} repo${scoredStats.total === 1 ? '' : 's'} · ${scoredStats.avg} avg score`
                          : `${scoredStats.total} repo${scoredStats.total === 1 ? '' : 's'}`}
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
                <RepoGridSkeleton />
              ) : scoredStats.total === 0 ? (
                <ScoredDashboardTeaser onScan={() => router.push('/generate')} />
              ) : (
                <>
                  <ScoredStatsStrip stats={scoredStats} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {repoHistories.map((rh) => (
                      <ScoredRepoCard key={rh.repoUrl} rh={rh} onOpen={() => openDetail(rh.latest)} />
                    ))}
                  </div>
                </>
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

              {!githubReposError && githubRepos === null && <RepoGridSkeleton />}

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
                  <p className="mt-1 text-sm text-[#687386]">
                    {jobsConfirmScreenMode ? 'One-time setup — confirm the projects that represent you.' : jobsHeaderCopy(jobMatchGroups)}
                  </p>
                </div>
                {githubUsername && jobsProfile?.onboarded && !jobsConfirmScreenMode && (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={openEditProjects}
                      className="text-xs font-medium text-[#7AA7FF] underline-offset-2 transition hover:text-[#9DBBFF] hover:underline"
                    >
                      Edit my projects for tomorrow&apos;s matching
                    </button>
                    <span className="text-[11px] text-[#3D4A60]">Matching runs once a day — changes apply to the next run.</span>
                  </div>
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

              {githubUsername && jobsProfileError && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-red-400/25 bg-[#0D111C] px-6 py-16 text-center">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#111827]">
                    <Briefcase className="h-4 w-4 text-red-400" />
                  </span>
                  <p className="text-sm font-medium text-red-400">{jobsProfileError}</p>
                </div>
              )}

              {githubUsername && !jobsProfileError && jobsProfile === null && (
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

              {githubUsername && jobsProfile !== null && jobsConfirmScreenMode && (
                <>
                  {githubReposError && <p className="text-sm text-red-400">{githubReposError}</p>}
                  {!githubReposError && githubRepos === null && (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-[60px] animate-pulse rounded-xl border border-[#1E2A3D] bg-[#090D16]" />
                      ))}
                    </div>
                  )}
                  {!githubReposError && githubRepos !== null && (
                    <JobsOnboardingConfirm
                      mode={jobsConfirmScreenMode}
                      githubRepos={githubRepos}
                      initialRepoNames={jobsProfile.repoNames}
                      onComplete={handleJobsProfileConfirmed}
                      onCancel={jobsConfirmScreenMode === 'edit' ? cancelEditProjects : undefined}
                    />
                  )}
                </>
              )}

              {githubUsername && jobsProfile !== null && jobsProfile.onboarded && !jobsConfirmScreenMode && (
                <>
                  <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-[#7AA7FF]/15 bg-[#7AA7FF]/[0.04] px-4 py-2.5 text-xs text-[#9AA3B5]">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-[#7AA7FF]" />
                    Your top 3 matches are emailed to you every day at 8:00 AM. This page always shows today&apos;s set.
                  </div>

                  {jobMatchesError && jobMatchGroups !== null && (
                    <p className="mb-6 text-sm text-red-400">{jobMatchesError}</p>
                  )}

                  {jobMatchGroups === null && !jobMatchesError && (
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

                  {jobMatchGroups === null && jobMatchesError && (
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

                  {jobMatchGroups !== null && jobMatchGroups.length === 0 && (
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

                  {jobMatchGroups !== null && jobMatchGroups.length > 0 && (() => {
                    // Flat list, not grouped by repo (2026-07-20): each
                    // card's reason text already names the repo it came
                    // from, so a per-repo section header is redundant —
                    // just show the (already capped to DISPLAY_TOTAL_CAP,
                    // one-per-repo) matches themselves.
                    const flatMatches = jobMatchGroups.flatMap((g) => g.matches)
                    if (flatMatches.length === 0) {
                      return (
                        <div className="flex flex-col items-center rounded-xl border border-dashed border-[#1E2A3D] px-6 py-16 text-center">
                          <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#111827]">
                            <Briefcase className="h-4 w-4 text-[#3D4A60]" />
                          </span>
                          <p className="text-sm font-medium text-[#9AA3B5]">No strong match yet.</p>
                          <p className="mt-1 max-w-sm text-xs text-[#3D4A60]">
                            We only surface roles that genuinely fit — nothing forced to fill a slot.
                          </p>
                        </div>
                      )
                    }
                    return (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {flatMatches.map((m, i) => (
                          <JobMatchCard key={`${m.title}-${m.company}-${i}`} m={m} />
                        ))}
                      </div>
                    )
                  })()}
                </>
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
                    <ArrowLeft className="h-3.5 w-3.5" /> Repos Scored
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
