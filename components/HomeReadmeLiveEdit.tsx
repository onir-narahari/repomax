'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { sectionMax, sectionX } from '@/lib/landing-layout'

// ─── Constants ────────────────────────────────────────────────────────────────

const SCORE = 64

const CATEGORIES = [
  { label: 'Hook & tagline', val: 8,  max: 20 },
  { label: 'Demo & proof',   val: 4,  max: 20 },
  { label: 'Setup clarity',  val: 17, max: 20 },
  { label: 'Structure',      val: 15, max: 20 },
  { label: 'Stack context',  val: 12, max: 20 },
]

function grade(s: number) {
  if (s >= 91) return { label: 'STRONG', color: '#34d399' }
  if (s >= 83) return { label: 'GOOD',   color: '#60a5fa' }
  if (s >= 73) return { label: 'FAIR',   color: '#fbbf24' }
  return           { label: 'WEAK',    color: '#ff3b3b' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 84 }: { score: number; size?: number }) {
  const { label, color } = grade(score)
  const r        = 38
  const circ     = 2 * Math.PI * r
  const numPx    = Math.round(size * 0.30)
  const labelPx  = Math.max(9, Math.round(size * 0.092))
  const subPx    = Math.max(7, Math.round(size * 0.077))
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="9" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 100)}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: `${numPx}px` }} className="font-bold tabular-nums text-white leading-none">{Math.round(score)}</span>
          <span style={{ fontSize: `${subPx}px` }} className="font-mono text-white/30 mt-1">/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: `${labelPx}px`, color }} className="font-mono uppercase tracking-widest transition-colors duration-700">
        {label}
      </span>
    </div>
  )
}

function GitHubChrome() {
  return (
    <>
      <div className="flex items-center gap-2.5 bg-[#24292f] px-3 py-2">
        <svg height="16" width="16" viewBox="0 0 16 16" fill="#fff" className="opacity-80 shrink-0">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span className="text-[11px] text-white/60">
          <span className="text-[#58a6ff]">onir-narahari</span>
          <span className="text-white/30 mx-1">/</span>
          <span className="text-[#58a6ff] font-semibold">repomax</span>
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-2 py-1 text-[10px] text-white/60">
            <svg height="9" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" /></svg>
            Star
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-2 py-1 text-[10px] text-white/60">
            <svg height="9" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 100-1.5.75.75 0 000 1.5zm-3 8.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" /></svg>
            Fork
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between bg-[#f6f8fa] border-b border-[#d0d7de] px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-[#57606a]">
          <svg height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16h-9.5A1.75 1.75 0 012 14.25V1.75zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 00.25-.25V6h-2.75A1.75 1.75 0 019 4.25V1.5H3.75zm6.75.56v2.19c0 .138.112.25.25.25h2.19L10.5 2.06z" /></svg>
          README.md
        </div>
        <div className="flex items-center gap-2.5 text-[10px] text-[#0969da]">
          <span>Raw</span>
          <span>Blame</span>
        </div>
      </div>
    </>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-[#f6f8fa] text-[#1f2328] border border-[#d0d7de] rounded px-[0.3em] py-[0.1em] text-[82%] font-mono">
      {children}
    </code>
  )
}

function ReadmeDoc() {
  return (
    <div
      className="bg-white px-6 py-5 text-[#1f2328]"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', lineHeight: 1.5 }}
    >
      <h1 className="text-[#1f2328] text-[1.5rem] font-semibold border-b border-[#d0d7de] pb-2 mb-3">RepoMax</h1>

      <p className="text-[12px] leading-relaxed mb-4">
        Turn a public GitHub repo into a <strong>Repo Score</strong> (6 weighted categories) and{' '}
        <strong>3 resume bullets</strong> grounded in what you actually built.
      </p>

      <h2 className="text-[#1f2328] text-[1.15rem] font-semibold border-b border-[#d0d7de] pb-1.5 mb-2.5 mt-3">Local development</h2>
      <pre className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-2.5 overflow-x-auto mb-2.5">
        <code className="text-[#1f2328] text-[11px] font-mono leading-relaxed">{`npm install
cp .env.example .env.local   # add OPENAI_API_KEY
npm run dev`}</code>
      </pre>
      <p className="text-[11px] text-[#57606a] mb-4">
        Open <InlineCode>http://localhost:3000</InlineCode> — no other services required locally.
      </p>

      <h2 className="text-[#1f2328] text-[1.15rem] font-semibold border-b border-[#d0d7de] pb-1.5 mb-2.5 mt-3">Environment variables</h2>
      <table className="w-full border-collapse text-[11px] mb-4">
        <thead>
          <tr>
            {['Variable', 'Required', 'Purpose'].map(h => (
              <th key={h} className="text-[#1f2328] font-semibold bg-[#f6f8fa] border border-[#d0d7de] px-2.5 py-1 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['OPENAI_API_KEY',         'Yes', 'Repo scoring and bullet generation'],
            ['GITHUB_TOKEN',           'No',  'Higher API rate limits'],
            ['UPSTASH_REDIS_REST_URL', 'No',  'Rate limiting (5 req / 60s per IP)'],
          ].map(([v, r, d]) => (
            <tr key={v}>
              <td className="border border-[#d0d7de] px-2.5 py-1"><InlineCode>{v}</InlineCode></td>
              <td className="border border-[#d0d7de] px-2.5 py-1 text-[#1f2328]">{r}</td>
              <td className="border border-[#d0d7de] px-2.5 py-1 text-[#57606a]">{d}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-[#1f2328] text-[1.15rem] font-semibold border-b border-[#d0d7de] pb-1.5 mb-2.5 mt-3">Deploy on Vercel</h2>
      <p className="text-[11px] text-[#57606a] mb-2.5">
        Push to GitHub, import at vercel.com, and set your environment variables.
      </p>
      <pre className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-2.5 overflow-x-auto mb-2.5">
        <code className="text-[#1f2328] text-[11px] font-mono">{`# One-command deploy:
npm run deploy`}</code>
      </pre>
      <ul className="list-disc ml-4 space-y-1 mb-5">
        {[
          'OPENAI_API_KEY — required',
          'GITHUB_TOKEN — recommended (higher rate limits)',
          'UPSTASH_REDIS_REST_* — recommended (abuse prevention)',
        ].map(s => (
          <li key={s} className="text-[11px] text-[#57606a]">{s}</li>
        ))}
      </ul>
    </div>
  )
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-[#111116]/95 backdrop-blur-md shadow-2xl p-4 ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomeReadmeLiveEdit() {
  const sectionRef = useRef<HTMLElement>(null)
  const rafRef     = useRef<number | null>(null)
  const [displayScore, setDisplayScore] = useState(0)
  const [started, setStarted]           = useState(false)

  const animateScore = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const t0 = performance.now()
    function tick(now: number) {
      const p    = Math.min((now - t0) / 900, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplayScore(ease * SCORE)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) { setStarted(true); animateScore() }
    }, { threshold: 0.05 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [started, animateScore])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const { color: gradeColor } = grade(displayScore)

  // Stage 1056, readme 624 → side gap = 216, card 200 → ~16px clear of README edges
  const STAGE_W      = 1056
  const README_W     = 624
  const CARD_W       = 200
  const WIDE_CARD_W  = 212
  const CTA_CARD_W   = 230

  return (
    <section
      ref={sectionRef}
      id="readme-live"
      className="relative z-10 bg-[#0A0A0F] -mt-20 sm:-mt-24 lg:-mt-28 mb-0 pb-8 sm:pb-10"
    >
      <div className={cn(sectionMax, sectionX, 'relative z-10 mb-8 sm:mb-10 pt-16 sm:pt-20 text-center')}>
        <h2
          className="font-bold text-[#F8FAFC] tracking-[-0.03em] leading-[1.1] mx-auto max-w-xl"
          style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2rem)' }}
        >
          See your repo the way recruiters do.
        </h2>
      </div>

      {/* ── Desktop layout ─────────────────────────────────────────────────── */}
      <div className="hidden lg:block relative mx-auto px-4" style={{ maxWidth: `${STAGE_W + 32}px` }}>
        <div className="relative mx-auto" style={{ maxWidth: `${STAGE_W}px` }}>

          {/* README document — centered */}
          <div
            className="relative mx-auto rounded-xl overflow-hidden border border-[#30363d] shadow-[0_28px_90px_rgba(0,0,0,0.6)]"
            style={{ maxWidth: `${README_W}px` }}
          >
            <GitHubChrome />
            <ReadmeDoc />
          </div>

          {/* ── Top-left: Gaps flagged ───────────────────────────────── */}
          <Card className="absolute top-6 -left-3 z-10 flex flex-col gap-3" style={{ width: `${WIDE_CARD_W}px` } as React.CSSProperties}>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-white leading-snug">Gaps Flagged</p>
              <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-red-400">3 found</span>
            </div>
            <div className="space-y-2">
              {[
                'No live demo or deploy link',
                'Hook fails the 5-second scan',
                'Tech stack not front-loaded',
              ].map((gap, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-2.5 py-2">
                  <span className="mt-0.5 shrink-0 text-[10px] font-bold text-red-400">!</span>
                  <p className="text-[11px] font-semibold text-white leading-snug">{gap}</p>
                </div>
              ))}
            </div>
            <a
              href="/#top"
              className="mt-1 flex items-center justify-center rounded-full bg-red-500 px-4 py-2 text-[11px] font-semibold text-white hover:bg-red-400 transition-colors"
            >
              Find your repo&apos;s gaps →
            </a>
          </Card>

          {/* ── Top-right: Score + category breakdown ───────────────── */}
          <Card className="absolute top-6 right-0 z-10 flex flex-col items-center gap-4 p-5" style={{ width: `${CARD_W}px` } as React.CSSProperties}>
            <ScoreRing score={displayScore} size={108} />
            <div className="w-full space-y-2.5">
              <p className="font-mono text-[8px] uppercase tracking-widest text-white/30 mb-2.5">Category breakdown</p>
              {CATEGORIES.map((cat) => (
                <div key={cat.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9.5px] text-white/80">{cat.label}</span>
                    <span className="font-mono text-[9px] text-white/60">
                      {cat.val}<span className="text-white/30">/{cat.max}</span>
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: started ? `${(cat.val / cat.max) * 100}%` : '0%',
                        backgroundColor: 'rgba(255,255,255,0.55)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Bottom-left: What we found ───────────────────────────── */}
          <Card className="absolute bottom-6 -left-3 z-10 p-5" style={{ width: `${WIDE_CARD_W}px` } as React.CSSProperties}>
            <p className="font-mono text-[8px] uppercase tracking-widest text-white/30 mb-3">What we found</p>

            <p className="text-[13px] font-semibold text-white mb-1.5">Strengths identified</p>
            <div className="space-y-1.5 mb-4">
              {[
                'Setup takes three commands',
                'Env vars: required vs optional',
              ].map((s) => (
                <div key={s} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1 w-1 rounded-full bg-[#8B9DC3]/50 shrink-0" />
                  <p className="text-[11px] text-[#8B9DC3] leading-snug">{s}</p>
                </div>
              ))}
            </div>

            <div className="h-px bg-white/[0.06] mb-4" />

            <p className="text-[13px] font-semibold text-white mb-1.5">Improvement suggestions</p>
            <div className="space-y-1.5">
              {[
                'No demo link or screenshot',
                'Opening line reads like docs',
              ].map((s) => (
                <div key={s} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1 w-1 rounded-full bg-[#8B9DC3]/50 shrink-0" />
                  <p className="text-[11px] text-[#8B9DC3] leading-snug">{s}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Bottom-right: CTA ───────────────────────────────────── */}
          <Card className="absolute bottom-6 -right-8 z-10 flex flex-col gap-3 p-5" style={{ width: `${CTA_CARD_W}px` } as React.CSSProperties}>
            <p className="text-[15px] font-bold text-white leading-snug">
              See your full breakdown.
            </p>
            <p className="text-[11px] text-[#8B9DC3] leading-relaxed">
              Score, gaps, and resume bullets — 30 seconds.
            </p>
            <a
              href="/#top"
              className="mt-1 flex items-center justify-center rounded-full bg-[#EC4899] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#F472B6] transition-colors"
            >
              See my full breakdown →
            </a>
          </Card>

        </div>
      </div>

      {/* ── Mobile layout ───────────────────────────────────────────────── */}
      <div className="lg:hidden px-4 space-y-3">
        <div className="rounded-xl overflow-hidden border border-[#30363d] shadow-xl">
          <GitHubChrome />
          <ReadmeDoc />
        </div>

        <Card className="">
          <p className="font-mono text-[8px] uppercase tracking-widest text-white/30 mb-2.5">What we found</p>
          <p className="text-[11px] font-semibold text-white mb-1">Strengths identified</p>
          <p className="text-[10px] text-[#8B9DC3] leading-relaxed mb-2.5">Clear setup, documented env vars, multiple deploy paths.</p>
          <div className="h-px bg-white/[0.06] mb-2.5" />
          <p className="text-[11px] font-semibold text-white mb-1">Improvement suggestions</p>
          <p className="text-[10px] text-[#8B9DC3] leading-relaxed">No demo link, tagline too long, deploy section dominates.</p>
        </Card>

        <div className="flex items-center gap-3">
          <Card className="flex-1 flex flex-col items-center gap-2.5">
            <ScoreRing score={displayScore} size={64} />
          </Card>
          <Card className="flex-1">
            <p className="text-[11px] font-semibold text-white mb-2">Fix your repo</p>
            <a
              href="/#top"
              className="flex items-center justify-center rounded-full bg-[#EC4899] px-3 py-1.5 text-[11px] font-semibold text-white"
            >
              Score my repo →
            </a>
          </Card>
        </div>
      </div>

      {/* Gradient fade into section below */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 z-20"
        style={{ background: 'linear-gradient(to bottom, transparent, #0D0D12)' }}
      />
    </section>
  )
}
