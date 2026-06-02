'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BarChart2, FileText, GitFork } from 'lucide-react'
import {
  MOCK_BULLET_COUNT,
  MOCK_BULLET_PREVIEW,
  MOCK_SCORE,
  mockBarColor,
  mockPreviewCategories,
} from '@/lib/score-mock'

const PREVIEW_CATS = mockPreviewCategories(4)

const MEASURES = [
  { name: 'First impression', pts: 15 },
  { name: 'Setup & DX', pts: 15 },
  { name: 'Technical depth', pts: 25, highlight: true },
  { name: 'Proof of shipping', pts: 15 },
  { name: 'Quality signals', pts: 15 },
  { name: 'Documentation', pts: 15 },
]

export default function HomeInteractiveSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [runId, setRunId] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const start = () => {
      setHasStarted(true)
      setRunId((k) => k + 1)
    }

    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.85) start()

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start()
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="demo"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-start overflow-hidden bg-[#030712] px-4 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-16 lg:px-12 lg:pt-20"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 75% 50%, rgba(37,99,235,0.08) 0%, transparent 60%)',
        }}
      />

      <style>{`
        @keyframes homeTypewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes homeCursorHide {
          0%, 80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes homeFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes homeBarGrow {
          from { width: 0; }
        }
        @keyframes homeBarPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }

        .home-sim-run .home-typewriter {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          animation: homeTypewriter 0.75s steps(24, end) 0.15s forwards;
        }
        .home-sim-run .home-cursor {
          display: inline-block;
          width: 1.5px;
          height: 0.85em;
          background: #60a5fa;
          vertical-align: middle;
          margin-left: 1px;
          animation: homeCursorHide 0.2s ease forwards 1.35s;
        }
        .home-sim-run .home-analyzing {
          opacity: 0;
          animation: homeFadeUp 0.3s ease forwards 0.85s;
        }
        .home-sim-run .home-analyzing-bar {
          animation: homeBarPulse 0.8s ease-in-out infinite;
          animation-delay: 0.85s;
        }
        .home-sim-run .home-proof {
          opacity: 0;
          animation: homeFadeUp 0.4s ease forwards 1.05s;
        }
        .home-sim-run .home-cat-bar {
          width: 0;
          animation: homeBarGrow 0.35s ease forwards;
        }

        .home-sim-idle .home-analyzing,
        .home-sim-idle .home-proof {
          opacity: 0;
        }
        .home-sim-idle .home-cat-bar {
          width: 0;
        }
      `}</style>

      <div className="relative mx-auto w-full max-w-7xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400/70">
          The proof
        </p>

        <div key={runId} className={hasStarted ? 'home-sim-run' : 'home-sim-idle'}>
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[2fr_3fr] md:gap-10 lg:gap-12">

            {/* Left: story + input + CTA */}
            <div className="flex flex-col gap-6 sm:gap-7">
              <div>
                <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-[2rem] md:leading-[1.15]">
                  You did the work. Make it get you hired.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#8B9DC3] sm:text-base">
                  Months of commits shouldn&apos;t boil down to a repo link and a hope.
                </p>
              </div>

              <div className="rounded-xl border border-[#1E3A5F] bg-[#0A0F1E] p-4 shadow-[0_0_32px_rgba(59,130,246,0.06)] sm:rounded-2xl sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <GitFork className="h-3.5 w-3.5 text-blue-400/70" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 sm:text-[11px]">
                    Paste a repo
                  </span>
                </div>
                <div className="flex items-center overflow-hidden rounded-lg border border-blue-500/15 bg-[#050508] px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3">
                  <span className="font-mono text-[11px] text-white/30 sm:text-xs">github.com/</span>
                  <span className="home-typewriter font-mono text-[11px] text-white/80 sm:text-xs">
                    user/ml-research-agent
                  </span>
                  <span className="home-cursor" />
                </div>
                <div className="home-analyzing mt-3 overflow-hidden rounded-full bg-blue-500/10">
                  <div className="home-analyzing-bar h-1 w-[60%] rounded-full bg-blue-500/50" />
                </div>
                <p className="home-analyzing mt-2 text-[10px] text-blue-400/60 sm:text-[11px]">
                  Analyzing repository…
                </p>
              </div>

              <Link
                href="/generate"
                className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 hover:shadow-[0_0_28px_rgba(59,130,246,0.35)] sm:py-3.5 sm:text-[0.9375rem]"
              >
                Get your Repo Score →
              </Link>
            </div>

            {/* Right: one unified proof card (ResuMax pattern) */}
            <div
              className="home-proof overflow-hidden rounded-2xl border border-[#1E3A5F] bg-[#0A0F1E] shadow-[0_0_40px_rgba(59,130,246,0.08)]"
              style={{ animationDelay: '1.05s' }}
            >
              {/* Score header */}
              <div className="border-b border-white/8 px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <BarChart2 className="h-4 w-4 text-blue-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/80">
                      Repo Score
                    </span>
                  </div>
                  <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
                    {MOCK_SCORE.label}
                  </span>
                </div>
                <div className="mt-3 flex items-end gap-4">
                  <div className="flex items-baseline gap-0.5 leading-none">
                    <span className="text-5xl font-bold tabular-nums text-blue-400">{MOCK_SCORE.total}</span>
                    <span className="text-lg font-light text-white/30">/100</span>
                  </div>
                  <p className="mb-1 max-w-xs text-sm leading-snug text-white/45">{MOCK_SCORE.summary}</p>
                </div>
              </div>

              {/* Breakdown + bullets */}
              <div className="grid grid-cols-1 border-b border-white/8 sm:grid-cols-2">
                <div className="border-b border-white/8 px-5 py-4 sm:border-b-0 sm:border-r sm:px-6 sm:py-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#687386]">
                    Category breakdown
                  </p>
                  <div className="space-y-2.5">
                    {PREVIEW_CATS.map((cat, i) => (
                      <div key={cat.label} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-white/55">{cat.label}</span>
                          <span className="shrink-0 text-xs tabular-nums text-white/60">
                            {cat.score}/{cat.max}
                          </span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
                          <div
                            className={`home-cat-bar h-full rounded-full ${mockBarColor(cat.pct)}`}
                            style={{ animationDelay: `${1.2 + i * 0.05}s`, width: `${cat.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-4 sm:px-6 sm:py-5">
                  <div className="mb-3 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#687386]">
                      Resume bullets
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-white/65">{MOCK_BULLET_PREVIEW}</p>
                  <p className="mt-2 text-xs text-blue-400/70">+{MOCK_BULLET_COUNT - 1} more ready to copy</p>
                </div>
              </div>

              {/* What we measure — inline footer, not a separate card */}
              <div className="bg-[#0D111C]/80 px-5 py-3.5 sm:px-6">
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#687386]">
                  What it measures · 100 pts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MEASURES.map(({ name, pts, highlight }) => (
                    <span
                      key={name}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:text-[11px] ${
                        highlight
                          ? 'border-blue-400/25 bg-blue-400/10 text-blue-200'
                          : 'border-[#242B3A] bg-[#111827]/60 text-[#9AA3B5]'
                      }`}
                    >
                      {name}
                      <span className={`tabular-nums ${highlight ? 'text-blue-300' : 'text-[#687386]'}`}>{pts}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
