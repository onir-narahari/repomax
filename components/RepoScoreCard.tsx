'use client'

import posthog from 'posthog-js'
import { useState } from 'react'
import { Bookmark, Check, ChevronDown } from 'lucide-react'
import type { RepoScore, CategoryScore } from '@/types'

export type SaveStatus = 'idle' | 'checking' | 'unsaved' | 'saving' | 'saved'

interface Props {
  score: RepoScore
  repoUrl?: string
  saveStatus?: SaveStatus
  onSave?: () => void
}

function SaveScoreButton({ status, onClick }: { status: SaveStatus; onClick: () => void }) {
  const isSaved = status === 'saved'
  const isBusy = status === 'saving' || status === 'checking'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaved || isBusy}
      className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#7AA7FF]/25 disabled:cursor-not-allowed ${
        isSaved
          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400'
          : 'border-[#7AA7FF]/30 bg-[#7AA7FF]/15 text-[#7AA7FF] hover:border-[#7AA7FF]/50 hover:bg-[#7AA7FF]/25 disabled:opacity-60'
      }`}
    >
      {isSaved ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Saved
        </>
      ) : isBusy ? (
        <span className="flex items-center gap-2">
          <span className="inline-flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-1 w-1 rounded-full bg-current opacity-70"
                style={{ animation: 'dotPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
          Saving
        </span>
      ) : (
        <>
          <Bookmark className="h-3.5 w-3.5" />
          Save Score
        </>
      )}
    </button>
  )
}

const CATEGORY_SHORT: Record<string, string> = {
  first_impression_clarity: 'First impression',
  runnable_setup_dx: 'Setup & DX',
  technical_depth_system_design: 'Technical depth',
  proof_of_shipping: 'Proof of shipping',
  testing_reliability_quality: 'Quality signals',
  documentation_depth: 'Documentation',
}

const CATEGORY_FULL: Record<string, string> = {
  first_impression_clarity: 'First-Impression Clarity',
  runnable_setup_dx: 'Setup & Developer Experience',
  technical_depth_system_design: 'Technical Depth & System Design',
  proof_of_shipping: 'Proof of Shipping',
  testing_reliability_quality: 'Quality Signals',
  documentation_depth: 'Documentation Depth',
}

const CATEGORY_ORDER = [
  'first_impression_clarity',
  'runnable_setup_dx',
  'technical_depth_system_design',
  'proof_of_shipping',
  'testing_reliability_quality',
  'documentation_depth',
] as const

function scoreColor(total: number) {
  if (total >= 90) return { text: 'text-emerald-400', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' }
  if (total >= 80) return { text: 'text-blue-400', badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20' }
  if (total >= 70) return { text: 'text-amber-400', badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20' }
  if (total >= 60) return { text: 'text-orange-400', badge: 'bg-orange-400/10 text-orange-400 border-orange-400/20' }
  return { text: 'text-red-400', badge: 'bg-red-400/10 text-red-400 border-red-400/20' }
}

function catColor(score: number, max: number) {
  const pct = score / max
  if (pct >= 0.9) return 'bg-emerald-400'
  if (pct >= 0.75) return 'bg-blue-400'
  if (pct >= 0.55) return 'bg-amber-400'
  if (pct >= 0.4) return 'bg-orange-400'
  return 'bg-red-400'
}

function categoryPct(cat: CategoryScore) {
  return Math.min(cat.score, cat.max) / cat.max
}

function CategoryRow({ label, fullLabel, cat }: { label: string; fullLabel: string; cat: CategoryScore }) {
  const displayScore = Math.min(cat.score, cat.max)
  const pct = Math.min(100, Math.round((displayScore / cat.max) * 100))
  const barClass = catColor(displayScore, cat.max)
  return (
    <div className="space-y-1.5" title={`${fullLabel}: ${cat.reason}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm text-[#9AA3B5]">{label}</span>
        <span className="shrink-0 text-xs font-medium tabular-nums text-[#F5F3EA]">
          {displayScore}/{cat.max}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[#1A2235]">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function RepoScoreCard({ score, repoUrl, saveStatus, onSave }: Props) {
  const [showAllScores, setShowAllScores] = useState(false)
  const [showAllFixes, setShowAllFixes] = useState(false)

  const colors = scoreColor(score.total)
  const categories = score.categories as unknown as Record<string, CategoryScore>
  const displayUrl = repoUrl?.replace('https://github.com/', '') ?? null

  const sortedByWorst = [...CATEGORY_ORDER].sort(
    (a, b) => categoryPct(categories[a]) - categoryPct(categories[b])
  )
  const previewKeys = sortedByWorst.slice(0, 3)
  const visibleScoreKeys = showAllScores ? CATEGORY_ORDER : previewKeys

  const visibleWeaknessCount = showAllFixes ? score.weaknesses.length : Math.min(2, score.weaknesses.length)
  const hasMoreWeaknesses = score.weaknesses.length > 2

  return (
    <div className="overflow-hidden rounded-2xl border border-[#242B3A] bg-[#0D111C] shadow-[0_20px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="border-b border-[#242B3A] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {displayUrl && (
              <p className="truncate font-mono text-xs text-[#687386]">{displayUrl}</p>
            )}
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-bold tabular-nums leading-none tracking-tight ${colors.text}`}>
                  {score.total}
                </span>
                <span className="text-xl font-light text-[#687386]">/100</span>
              </div>
              <span className={`mb-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
                {score.label}
              </span>
            </div>
          </div>
          {onSave && (
            <SaveScoreButton status={saveStatus ?? 'idle'} onClick={onSave} />
          )}
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9AA3B5]">{score.summary}</p>

        {score.strengths.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {score.strengths.slice(0, 2).map((s, i) => (
              <li key={i} className="flex gap-2 text-sm leading-snug text-[#9AA3B5]">
                <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                <span className="line-clamp-1">{s}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
        <div className="border-b border-[#242B3A] px-6 py-5 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-xs font-medium text-[#687386]">
            {showAllScores ? 'All scores' : 'Lowest scores'}
          </p>
          <div className="space-y-4">
            {visibleScoreKeys.map((key) => {
              const cat = categories[key]
              if (!cat) return null
              return (
                <CategoryRow
                  key={key}
                  label={CATEGORY_SHORT[key]}
                  fullLabel={CATEGORY_FULL[key]}
                  cat={cat}
                />
              )
            })}
          </div>
          {CATEGORY_ORDER.length > 3 && (
            <button
              type="button"
              onClick={() => {
                const next = !showAllScores
                if (next) posthog.capture('score_details_expanded', { repo_url: repoUrl })
                setShowAllScores(next)
              }}
              className="mt-4 flex items-center gap-1 text-xs font-medium text-[#7AA7FF] transition hover:text-[#9BB8FF]"
            >
              {showAllScores ? 'Show fewer' : `See all ${CATEGORY_ORDER.length} categories`}
              <ChevronDown className={`h-3.5 w-3.5 transition ${showAllScores ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {(score.weaknesses.length > 0 || score.fixes.length > 0) && (
          <div className="px-6 py-5">
            <p className="mb-3 text-xs font-medium text-[#687386]">Fix these first</p>
            <div className="space-y-3">
              {score.weaknesses.slice(0, visibleWeaknessCount).map((issue, i) => {
                const fix = score.fixes[i]
                return (
                  <div key={i} className="rounded-xl bg-[#111827]/60 px-4 py-3">
                    <p className="text-sm font-medium leading-snug text-[#F5F3EA] line-clamp-2">{issue}</p>
                    {fix && (
                      <p className="mt-1.5 text-xs leading-relaxed text-[#687386] line-clamp-2">{fix}</p>
                    )}
                  </div>
                )
              })}
            </div>
            {hasMoreWeaknesses && (
              <button
                type="button"
                onClick={() => {
                  const next = !showAllFixes
                  if (next) posthog.capture('fixes_expanded', { repo_url: repoUrl, total_fixes: score.weaknesses.length })
                  setShowAllFixes(next)
                }}
                className="mt-3 flex items-center gap-1 text-xs font-medium text-[#7AA7FF] transition hover:text-[#9BB8FF]"
              >
                {showAllFixes ? 'Show fewer' : `See ${score.weaknesses.length - 2} more`}
                <ChevronDown className={`h-3.5 w-3.5 transition ${showAllFixes ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
