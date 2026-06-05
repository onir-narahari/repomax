'use client'

import { useEffect, useState } from 'react'
import { FileText, GitFork } from 'lucide-react'
import ScoreRing from '@/components/hero/ScoreRing'
import {
  MOCK_BULLET_COUNT,
  MOCK_BULLET_PREVIEW,
  MOCK_FIXES,
  MOCK_REPO_SLUG,
  MOCK_SCORE,
  mockBarColor,
  mockPreviewCategories,
  mockScoreTheme,
} from '@/lib/score-mock'

const PREVIEW_CATS = mockPreviewCategories(3)
const SCORE_THEME = mockScoreTheme(MOCK_SCORE.total)

const FIX_ACCENTS = [
  'border-red-400/35 bg-red-500/10 text-red-300',
  'border-orange-400/35 bg-orange-500/10 text-orange-300',
] as const

export default function HeroProductDemo() {
  const [runId, setRunId] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setStarted(true)
      setRunId((k) => k + 1)
    }, 400)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="w-full max-w-md xl:max-w-[28rem]" aria-hidden="true">
      <style>{`
        @keyframes heroDemoFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroDemoPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes heroDemoBarGrow {
          from { width: 0; }
        }

        .hero-demo-run .hero-demo-loading {
          opacity: 0;
          animation: heroDemoFadeUp 0.3s ease forwards 0.2s;
        }
        .hero-demo-run .hero-demo-loading-bar {
          animation: heroDemoPulse 0.9s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        .hero-demo-run .hero-demo-result {
          opacity: 0;
          animation: heroDemoFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.6s;
        }
        .hero-demo-run .hero-demo-bar {
          width: 0;
          animation: heroDemoBarGrow 0.35s ease forwards;
        }
        .hero-demo-idle .hero-demo-loading,
        .hero-demo-idle .hero-demo-result {
          opacity: 0;
        }
      `}</style>

      <div
        key={runId}
        className={`overflow-hidden rounded-2xl border border-[#1E3A5F] bg-[#0A0F1E]/95 shadow-[0_0_40px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm ${started ? 'hero-demo-run' : 'hero-demo-idle'}`}
      >
        <div className="flex items-center gap-1.5 border-b border-white/6 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-red-500/55" />
          <span className="h-2 w-2 rounded-full bg-amber-400/45" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/45" />
          <span className="ml-auto font-mono text-[9px] text-white/25">tryrepomax.com</span>
        </div>

        <div className="border-b border-white/8 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <GitFork className="h-3.5 w-3.5 text-blue-400/70" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
              Paste a repo
            </span>
          </div>
          <div className="flex items-center rounded-lg border border-blue-500/20 bg-[#050508] px-3 py-2.5">
            <span className="font-mono text-[11px] text-white/30">github.com/</span>
            <span className="font-mono text-[11px] text-white/85">{MOCK_REPO_SLUG}</span>
          </div>
          <div className="hero-demo-loading mt-2.5 overflow-hidden rounded-full bg-blue-500/10">
            <div className="hero-demo-loading-bar h-1 w-[55%] rounded-full bg-blue-500/50" />
          </div>
          <p className="hero-demo-loading mt-1.5 text-[10px] text-blue-400/60">Analyzing repository…</p>
        </div>

        <div className="hero-demo-result min-h-[17.5rem] bg-gradient-to-br from-red-500/15 via-[#1E3A5F]/25 to-blue-500/10 px-4 pb-5 pt-4">
          <div className="flex items-start gap-3">
            <ScoreRing
              score={MOCK_SCORE.total}
              scoreClassName={SCORE_THEME.score}
              ringClassName={SCORE_THEME.score}
              size="lg"
            />
            <div className="min-w-0 pt-1">
              <p className="text-[11px] leading-snug text-white/50">{MOCK_SCORE.summary}</p>
              <span
                className={`mt-2 inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${SCORE_THEME.badge}`}
              >
                {MOCK_SCORE.label}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
            {PREVIEW_CATS.map((cat, i) => (
              <div key={cat.label} className="space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[10px] text-white/50">{cat.label}</span>
                  <span className="text-[10px] tabular-nums text-white/55">
                    {cat.score}/{cat.max}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`hero-demo-bar h-full rounded-full ${mockBarColor(cat.pct)}`}
                    style={{ animationDelay: `${1.7 + i * 0.06}s`, width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <ul className="mt-3 space-y-2.5 border-t border-white/8 pt-3">
            {MOCK_FIXES.slice(0, 2).map((item, i) => (
              <li key={item.issue} className="flex gap-2.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${FIX_ACCENTS[i]}`}
                >
                  {i + 1}
                </span>
                <span className="text-[0.8125rem] leading-snug text-white/55">{item.issue}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-500/12 bg-blue-500/5 px-2.5 py-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-400/80" />
            <p className="text-[10px] leading-snug text-white/50">
              <span className="text-blue-300/80">{MOCK_BULLET_COUNT} resume bullets</span>
              {' · '}
              {MOCK_BULLET_PREVIEW.slice(0, 52)}…{' '}
              <span className="text-blue-400/70">+{MOCK_BULLET_COUNT - 1}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
