'use client'

import { useEffect, useState } from 'react'

const TICKER_ENTRIES = [
  {
    slug: 'alex-m/react-notes-app',
    score: 44,
    verdict: 'Missing setup steps and demo link.',
  },
  {
    slug: 'jkim/expense-tracker',
    score: 71,
    verdict: 'Good stack coverage, no screenshots.',
  },
  {
    slug: 'priya-s/portfolio-v2',
    score: 88,
    verdict: 'Strong README, weak resume bullets.',
  },
] as const

function scoreBadgeClass(score: number): string {
  if (score < 50) return 'border-red-500/40 bg-red-500/10 text-red-300'
  if (score < 80) return 'border-amber-400/40 bg-amber-400/10 text-amber-300'
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
}

export default function HeroScoreTicker() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      const swap = setTimeout(() => {
        setActiveIndex((i) => (i + 1) % TICKER_ENTRIES.length)
        setVisible(true)
      }, 250)
      return () => clearTimeout(swap)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const entry = TICKER_ENTRIES[activeIndex]

  return (
    <div
      className="mb-4 flex items-center gap-2.5 rounded-lg border border-white/6 bg-white/[0.025] px-3 py-2"
      aria-label="Recent audit example"
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white/30">
        Repos scored
      </span>
      <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden="true" />
      <div
        className="flex min-w-0 flex-1 items-center gap-2 transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span className="min-w-0 truncate font-mono text-[11px] text-white/55">
          {entry.slug}
        </span>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${scoreBadgeClass(entry.score)}`}
        >
          {entry.score}/100
        </span>
        <span className="hidden min-w-0 truncate text-[11px] text-white/40 sm:block">
          {entry.verdict}
        </span>
      </div>
    </div>
  )
}
