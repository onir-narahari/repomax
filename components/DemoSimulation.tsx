'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Check, FileText, GitFork, MessageCircle } from 'lucide-react'

const RESUME_BULLETS = [
  'Built a FastAPI-based stock analysis platform integrating financial APIs, valuation logic, and LLM query routing to generate natural-language equity research responses',
  'Implemented multi-ticker comparison workflows using Python, structured financial data, and session memory to support follow-up stock analysis queries',
  'Designed intent-based routing across valuation, financials, news, and peer comparison paths using FastAPI route handlers and structured LLM query dispatch',
]

const LINKEDIN_POST = `I built an AI stock research tool that turns natural-language questions into valuation, financials, news, and peer comparison insights.

The project uses FastAPI, financial data APIs, and LLM routing to understand what a user is asking, fetch the right market data, and generate a clear response.

Biggest lesson: building useful AI products is less about the model and more about the data pipeline.`

const X_POST = `Built an AI stock analysis app.

Ask "NVDA vs AMD" or "is AAPL undervalued?" and get valuation, news, and financial insights.

FastAPI + financial APIs + LLM routing.`

const STEPS = [
  'Reading README',
  'Detecting tech stack',
  'Extracting key features',
  'Ranking resume-worthy details',
  'Writing project story',
]

export default function DemoSimulation() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [runId, setRunId] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true)
          setRunId((k) => k + 1)
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sectionRef} className="relative mx-auto w-full max-w-7xl">
      <style>{`
        @keyframes demoSimTypewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes demoSimCursorFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes demoSimCursorHide {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes demoSimStepIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes demoSimCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes demoSimBarPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }

        .demo-sim-run .demo-sim-typewriter {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          animation: demoSimTypewriter 1.4s steps(24, end) 0.5s forwards;
        }
        .demo-sim-run .demo-sim-cursor {
          display: inline-block;
          width: 1.5px;
          height: 0.85em;
          background: #60a5fa;
          vertical-align: middle;
          margin-left: 1px;
          animation:
            demoSimCursorFade 0.7s step-end 1.9s 3,
            demoSimCursorHide 0.3s ease forwards 4s;
        }
        .demo-sim-run .demo-sim-analyzing-wrap {
          opacity: 0;
          animation: demoSimCardIn 0.4s ease forwards 1.9s;
        }
        .demo-sim-run .demo-sim-analyzing-bar {
          animation: demoSimBarPulse 1.2s ease-in-out infinite;
          animation-delay: 1.9s;
        }
        .demo-sim-run .demo-sim-analyzing-text {
          opacity: 0;
          animation: demoSimCardIn 0.4s ease forwards 2s;
        }
        .demo-sim-run .demo-sim-step {
          opacity: 0;
          animation: demoSimStepIn 0.35s ease forwards;
        }
        .demo-sim-run .demo-sim-output {
          opacity: 0;
          animation: demoSimCardIn 0.45s ease forwards;
        }

        .demo-sim-idle .demo-sim-output,
        .demo-sim-idle .demo-sim-step,
        .demo-sim-idle .demo-sim-analyzing-wrap,
        .demo-sim-idle .demo-sim-analyzing-text {
          opacity: 0;
        }
      `}</style>

      <div className="mb-8 sm:mb-10">
        <h2 className="max-w-2xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
          You did the work. Make it get you hired.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#8B9DC3] sm:text-base">
          Months of commits shouldn&apos;t boil down to a repo link and a hope.
        </p>
      </div>

      <div
        key={runId}
        className={hasStarted ? 'demo-sim-run' : 'demo-sim-idle'}
      >
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[2fr_3fr] md:gap-6 lg:gap-8">
          {/* Left: typing + process */}
          <div className="flex flex-col gap-3 md:pr-2 sm:gap-4">
            <div
              className="rounded-xl border border-[#1E3A5F] bg-[#0A0F1E] p-4 sm:rounded-2xl sm:p-5"
              style={{ boxShadow: '0 0 32px rgba(59,130,246,0.06)' }}
            >
              <div className="mb-3 flex items-center gap-2">
                <GitFork className="h-3.5 w-3.5 text-blue-400/70" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 sm:text-[11px]">
                  Paste a repo
                </span>
              </div>
              <div className="flex items-center overflow-hidden rounded-lg border border-blue-500/15 bg-[#050508] px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3">
                <span className="font-mono text-[11px] text-white/30 sm:text-xs">github.com/</span>
                <span className="demo-sim-typewriter font-mono text-[11px] text-white/80 sm:text-xs">
                  onir/stock-analysis-agent
                </span>
                <span className="demo-sim-cursor" />
              </div>

              <div className="demo-sim-analyzing-wrap mt-3 overflow-hidden rounded-full bg-blue-500/10">
                <div
                  className="demo-sim-analyzing-bar h-1 rounded-full bg-blue-500/50"
                  style={{ width: '60%' }}
                />
              </div>
              <p className="demo-sim-analyzing-text mt-2 text-[10px] text-blue-400/60 sm:text-[11px]">
                Analyzing repository…
              </p>
            </div>

            <div
              className="rounded-xl border border-[#1E3A5F] bg-[#0A0F1E] p-4 sm:rounded-2xl sm:p-5"
              style={{ boxShadow: '0 0 32px rgba(59,130,246,0.06)' }}
            >
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 sm:text-[11px]">
                  RepoStory is working
                </span>
              </div>
              <div className="space-y-2 sm:space-y-2.5">
                {STEPS.map((step, i) => (
                  <div
                    key={step}
                    className="demo-sim-step flex items-center gap-2.5 sm:gap-3"
                    style={{ animationDelay: `${0.7 + i * 0.3}s` }}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 sm:h-5 sm:w-5">
                      <Check className="h-2 w-2 text-blue-400 sm:h-2.5 sm:w-2.5" strokeWidth={3} />
                    </span>
                    <span className="text-xs text-white/65 sm:text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: outputs */}
          <div className="flex flex-col gap-3 sm:gap-3.5">
            <div
              className="demo-sim-output rounded-xl border border-[#1E3A5F] bg-[#0A0F1E] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] sm:rounded-2xl sm:p-4"
              style={{ animationDelay: '2.4s', boxShadow: '0 0 32px rgba(59,130,246,0.05)' }}
            >
              <div className="mb-2 flex items-center gap-1.5 sm:mb-2.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/80 sm:text-[11px]">
                  Resume Bullets
                </span>
              </div>
              <ul className="space-y-2 sm:space-y-2.5">
                {RESUME_BULLETS.map((bullet, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[11px] leading-snug text-white/70 sm:text-xs sm:leading-relaxed"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400 sm:mt-2 sm:h-1.5 sm:w-1.5" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-3.5 lg:grid-cols-2">
              <div
                className="demo-sim-output rounded-xl border border-[#1E3A5F] bg-[#0A0F1E] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] sm:rounded-2xl sm:p-4"
                style={{ animationDelay: '2.65s', boxShadow: '0 0 32px rgba(59,130,246,0.05)' }}
              >
                <div className="mb-2 flex items-center gap-1.5 sm:mb-2.5">
                  <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/80 sm:text-[11px]">
                    LinkedIn Post
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[11px] leading-snug text-white/65 sm:text-xs sm:leading-relaxed">
                  {LINKEDIN_POST}
                </p>
              </div>

              <div
                className="demo-sim-output rounded-xl border border-[#1E3A5F] bg-[#0A0F1E] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] sm:rounded-2xl sm:p-4"
                style={{ animationDelay: '2.9s', boxShadow: '0 0 32px rgba(59,130,246,0.05)' }}
              >
                <div className="mb-2 flex items-center gap-1.5 sm:mb-2.5">
                  <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/80 sm:text-[11px]">
                    X Post
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[11px] leading-snug text-white/65 sm:text-xs sm:leading-relaxed">
                  {X_POST}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center sm:mt-10">
        <Link
          href="/generate"
          className="rounded-xl border border-blue-500/25 bg-blue-600/10 px-6 py-3 text-sm font-semibold text-blue-300 transition hover:border-blue-500/45 hover:bg-blue-600/20 hover:text-white"
        >
          Try it on your repo →
        </Link>
      </div>
    </div>
  )
}
