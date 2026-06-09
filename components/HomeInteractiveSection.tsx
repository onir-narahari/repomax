'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, RotateCcw } from 'lucide-react'
import {
  BEFORE_LINES,
  AFTER_LINES,
  HIGHLIGHT_EVENTS,
  type ReadmeLine,
} from '@/lib/scan-simulator-content'

// ─── Sub-components ──────────────────────────────────────────────────────────

function ReadmePanel({
  label,
  badgeColor,
  lines,
  highlights,
}: {
  label: string
  badgeColor: string
  lines: ReadmeLine[]
  highlights: Map<string, 'drop' | 'keep'>
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0A0F1E]/80 overflow-hidden">
      {/* macOS chrome bar */}
      <div className="flex items-center gap-1.5 border-b border-white/6 px-4 py-2.5 bg-white/[0.025]">
        <span className="h-2 w-2 rounded-full bg-red-500/55" />
        <span className="h-2 w-2 rounded-full bg-amber-400/45" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/45" />
        <span className={`ml-auto font-mono text-[10px] ${badgeColor}`}>{label}</span>
      </div>
      {/* Content */}
      <div className="overflow-y-auto max-h-[380px] p-4 space-y-0.5 overscroll-contain">
        {lines.map(line => {
          const sentiment = highlights.get(line.id)
          const highlightClass =
            sentiment === 'drop'
              ? 'border-l-2 border-red-500/70 bg-red-500/[0.08] text-red-300/90'
              : sentiment === 'keep'
              ? 'border-l-2 border-emerald-500/70 bg-emerald-500/[0.08] text-emerald-300/90'
              : ''

          if (line.type === 'blank') return <div key={line.id} className="h-2" />

          if (line.type === 'demo-block') return (
            <div
              key={line.id}
              className={`rounded border py-5 text-center font-mono text-[11px] text-white/30 transition-all duration-500 ${
                sentiment
                  ? highlightClass
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {line.text}
            </div>
          )

          const baseClass = `rounded px-2 py-0.5 transition-all duration-500 ${highlightClass}`

          if (line.type === 'heading') return (
            <div key={line.id} className={`${baseClass} font-mono text-[13px] font-semibold ${!sentiment ? 'text-white/85' : ''}`}>
              {line.text}
            </div>
          )
          if (line.type === 'subheading') return (
            <div key={line.id} className={`${baseClass} font-mono text-[12px] font-semibold ${!sentiment ? 'text-white/70' : ''}`}>
              {line.text}
            </div>
          )
          if (line.type === 'tagline') return (
            <div key={line.id} className={`${baseClass} font-mono text-[11px] italic ${!sentiment ? 'text-blue-300/60' : ''}`}>
              {line.text}
            </div>
          )
          if (line.type === 'link-row') return (
            <div key={line.id} className={`${baseClass} font-mono text-[11px] ${!sentiment ? 'text-blue-400/50' : ''}`}>
              {line.text}
            </div>
          )
          if (line.type === 'code') return (
            <div key={line.id} className={`${baseClass} font-mono text-[11px] ${!sentiment ? 'bg-white/[0.03] text-blue-300/70' : ''}`}>
              {line.text}
            </div>
          )
          // body / default
          return (
            <div key={line.id} className={`${baseClass} font-mono text-[11px] ${!sentiment ? 'text-white/50' : ''}`}>
              {line.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LabelRow({ label, sentiment }: { label: string | null; sentiment: 'drop' | 'keep' }) {
  if (!label) return <div className="h-5" />
  return (
    <p
      key={label}
      className={`scan-label-in text-center text-[11px] leading-snug ${
        sentiment === 'drop' ? 'text-red-400/70' : 'text-emerald-400/70'
      }`}
    >
      {label}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomeInteractiveSection() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [timeLeft, setTimeLeft] = useState(30)
  const sectionRef = useRef<HTMLElement>(null)

  // Scroll-triggered auto-start
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && phase === 'idle') {
          setPhase('running')
        } else if (!entry.isIntersecting && phase === 'done') {
          setPhase('idle')
          setTimeLeft(30)
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [phase])

  // Countdown timer
  useEffect(() => {
    if (phase !== 'running') return
    setTimeLeft(30)
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // Derive active highlights from current timeLeft
  const activeHighlights = useMemo(() => {
    const map = new Map<string, 'drop' | 'keep'>()
    if (phase === 'idle') return map
    for (const event of HIGHLIGHT_EVENTS) {
      if (event.atSecond >= timeLeft) {
        for (const id of event.lineIds) map.set(id, event.sentiment)
      }
    }
    return map
  }, [timeLeft, phase])

  // Latest label per side
  const latestLabel = (side: 'before' | 'after') =>
    [...HIGHLIGHT_EVENTS]
      .filter(e => e.side === side && e.atSecond >= timeLeft && phase !== 'idle')
      .at(-1)?.label ?? null

  const handleReplay = () => {
    setPhase('idle')
    setTimeLeft(30)
    setTimeout(() => setPhase('running'), 50)
  }

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="relative flex min-h-screen flex-col border-t border-[#303A55] bg-[#131929]"
    >
      <div className="mx-auto flex w-full max-w-[82rem] flex-1 flex-col px-6 pb-16 pt-14 sm:px-10 sm:pb-20 sm:pt-16 lg:px-12 xl:px-14">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A78BFA]/80 font-mono">
            Recruiter Scan Simulator
          </p>
          <h2 className="text-xl font-semibold leading-snug text-[#F8FAFC] sm:text-2xl">
            Recruiters judge your repo in 30 seconds.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#A7B0C3]">
            Watch what they actually see.
          </p>
        </div>

        {/* Timer */}
        <div className="mx-auto mt-8 flex flex-col items-center gap-2 sm:mt-10">
          <span
            className={`text-[4rem] sm:text-[5rem] font-bold tabular-nums leading-none tracking-tighter transition-colors duration-500 ${
              timeLeft > 14
                ? 'text-[#F8FAFC]'
                : timeLeft > 7
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {timeLeft}
          </span>
          <div className="h-0.5 w-48 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#A78BFA]/70 transition-[width] duration-[980ms] linear"
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Panels */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 sm:mt-10">
          <ReadmePanel
            label="README.md · Untouched"
            badgeColor="text-red-400/50"
            lines={BEFORE_LINES}
            highlights={activeHighlights}
          />
          <ReadmePanel
            label="README.md · RepoMax"
            badgeColor="text-emerald-400/50"
            lines={AFTER_LINES}
            highlights={activeHighlights}
          />
        </div>

        {/* Labels below panels */}
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <LabelRow label={latestLabel('before')} sentiment="drop" />
          <LabelRow label={latestLabel('after')} sentiment="keep" />
        </div>

        {/* Verdict banner */}
        {phase === 'done' && (
          <div className="scan-verdict-in mt-10 flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2 text-sm font-semibold text-red-300">
                Left repo: recruiter closed the tab at 8s
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-300">
                Right repo: recruiter forwarded it to the team
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/#top"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#38D9FF] px-8 py-3.5 text-base font-semibold text-[#07111F] transition hover:bg-[#5DE4FF] hover:shadow-[0_0_36px_rgba(56,217,255,0.35)]"
              >
                See how your repo scores
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={handleReplay}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#303A55] px-4 py-2 text-sm text-[#A7B0C3]/60 transition hover:border-[#A78BFA]/40 hover:text-[#A7B0C3]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Replay
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
