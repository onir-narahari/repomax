'use client'

import { forwardRef, useRef, useEffect, useState, useCallback } from 'react'
import { Check } from 'lucide-react'

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

function ScoreRing({ score, size = 104 }: { score: number; size?: number }) {
  const { label, color } = grade(score)
  const r        = 38
  const circ     = 2 * Math.PI * r
  const numPx    = Math.round(size * 0.30)
  const labelPx  = Math.max(10, Math.round(size * 0.092))
  const subPx    = Math.max(8, Math.round(size * 0.077))
  return (
    <div className="flex flex-col items-center gap-3">
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
      <div className="flex items-center gap-3 bg-[#24292f] px-4 py-2.5">
        <svg height="20" width="20" viewBox="0 0 16 16" fill="#fff" className="opacity-80 shrink-0">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span className="text-[13px] text-white/60">
          <span className="text-[#58a6ff]">onir-narahari</span>
          <span className="text-white/30 mx-1">/</span>
          <span className="text-[#58a6ff] font-semibold">repomax</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-2.5 py-1 text-[12px] text-white/60">
            <svg height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" /></svg>
            Star
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-2.5 py-1 text-[12px] text-white/60">
            <svg height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 100-1.5.75.75 0 000 1.5zm-3 8.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" /></svg>
            Fork
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between bg-[#f6f8fa] border-b border-[#d0d7de] px-4 py-2">
        <div className="flex items-center gap-1.5 text-[13px] text-[#57606a]">
          <svg height="13" viewBox="0 0 16 16" fill="currentColor" className="shrink-0"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16h-9.5A1.75 1.75 0 012 14.25V1.75zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 00.25-.25V6h-2.75A1.75 1.75 0 019 4.25V1.5H3.75zm6.75.56v2.19c0 .138.112.25.25.25h2.19L10.5 2.06z" /></svg>
          README.md
        </div>
        <div className="flex items-center gap-3 text-[12px] text-[#0969da]">
          <span>Raw</span>
          <span>Blame</span>
        </div>
      </div>
    </>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-[#f6f8fa] text-[#1f2328] border border-[#d0d7de] rounded px-[0.3em] py-[0.1em] text-[85%] font-mono">
      {children}
    </code>
  )
}

function ReadmeDoc() {
  return (
    <div
      className="bg-white px-8 py-6 text-[#1f2328]"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', lineHeight: 1.5 }}
    >
      <h1 className="text-[#1f2328] text-[2rem] font-semibold border-b border-[#d0d7de] pb-3 mb-4">RepoMax</h1>

      <p className="text-[15px] leading-relaxed mb-5">
        Turn a public GitHub repo into a <strong>Repo Score</strong> (6 weighted categories) and{' '}
        <strong>3 resume bullets</strong> grounded in what you actually built.
      </p>

      <h2 className="text-[#1f2328] text-[1.5rem] font-semibold border-b border-[#d0d7de] pb-2 mb-3 mt-4">Local development</h2>
      <pre className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-3 overflow-x-auto mb-3">
        <code className="text-[#1f2328] text-[13px] font-mono leading-relaxed">{`npm install
cp .env.example .env.local   # add OPENAI_API_KEY
npm run dev`}</code>
      </pre>
      <p className="text-[14px] text-[#57606a] mb-5">
        Open <InlineCode>http://localhost:3000</InlineCode> — no other services required locally.
      </p>

      <h2 className="text-[#1f2328] text-[1.5rem] font-semibold border-b border-[#d0d7de] pb-2 mb-3 mt-4">Environment variables</h2>
      <table className="w-full border-collapse text-[13px] mb-5">
        <thead>
          <tr>
            {['Variable', 'Required', 'Purpose'].map(h => (
              <th key={h} className="text-[#1f2328] font-semibold bg-[#f6f8fa] border border-[#d0d7de] px-3 py-1.5 text-left">{h}</th>
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
              <td className="border border-[#d0d7de] px-3 py-1.5"><InlineCode>{v}</InlineCode></td>
              <td className="border border-[#d0d7de] px-3 py-1.5 text-[#1f2328]">{r}</td>
              <td className="border border-[#d0d7de] px-3 py-1.5 text-[#57606a]">{d}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-[#1f2328] text-[1.5rem] font-semibold border-b border-[#d0d7de] pb-2 mb-3 mt-4">Deploy on Vercel</h2>
      <p className="text-[14px] text-[#57606a] mb-3">
        Push to GitHub, import at vercel.com, and set your environment variables.
      </p>
      <pre className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-3 overflow-x-auto mb-3">
        <code className="text-[#1f2328] text-[13px] font-mono">{`# One-command deploy:
npm run deploy`}</code>
      </pre>
      <ul className="list-disc ml-5 space-y-1 mb-6">
        {[
          'OPENAI_API_KEY — required',
          'GITHUB_TOKEN — recommended (higher rate limits)',
          'UPSTASH_REDIS_REST_* — recommended (abuse prevention)',
        ].map(s => (
          <li key={s} className="text-[13px] text-[#57606a]">{s}</li>
        ))}
      </ul>
    </div>
  )
}

// ─── Card shell ───────────────────────────────────────────────────────────────

const Card = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; style?: React.CSSProperties }>(
  ({ children, className = '', style }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl border border-white/[0.08] bg-[#111116]/95 backdrop-blur-md shadow-2xl p-5 ${className}`}
      style={style}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

const GAPS = [
  'No live demo or deploy link',
  'Hook fails the 5-second scan',
  'Tech stack not front-loaded',
]

function MiniCTA({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <a
      href="/#top"
      className={`self-center rounded-full border-2 px-6 py-2.5 font-mono text-[12px] font-bold transition-colors ${colorClass}`}
    >
      {label}
    </a>
  )
}

function StepLabel({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono text-[10px] font-bold text-emerald-400">{n}</span>
      <p className="text-[12px] font-semibold text-white/80">{text}</p>
    </div>
  )
}

// ─── Left stack: proof cards ────────────────────────────────────────────────

function ScoreCard({ displayScore, started }: { displayScore: number; started: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-5 p-6">
      <ScoreRing score={displayScore} size={120} />
      <div className="w-full space-y-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-3">Category breakdown</p>
        {CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[11.5px] text-white/80">{cat.label}</span>
              <span className="font-mono text-[11px] text-white/60">
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
      <MiniCTA label="See my score →" colorClass="border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/15" />
    </Card>
  )
}

function FindingsCard({ className = '' }: { className?: string }) {
  return (
    <Card className={`flex flex-col gap-4 ${className}`}>
      <div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-3">What we found</p>
        <p className="text-[14px] font-semibold text-white mb-1.5">Strengths identified</p>
        <ul className="space-y-1">
          {['Setup is clean, just three commands.', 'Env vars are well organized with required vs optional labeled.'].map((s) => (
            <li key={s} className="flex items-start gap-2 text-[12px] text-[#8B9DC3] leading-relaxed">
              <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[14px] font-semibold text-white">Issues we found</p>
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-mono text-[9px] font-semibold text-red-400">3 found</span>
        </div>
        <div className="space-y-2">
          {GAPS.map((gap, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3 py-2.5">
              <span className="mt-0.5 shrink-0 text-[12px] font-bold text-red-400">!</span>
              <p className="text-[13px] font-semibold text-white leading-snug">{gap}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ─── Right stack: feature proof cards ───────────────────────────────────────

const MATCHES = [
  { initials: 'TL', name: 'Teal', color: '#7AA7FF' },
  { initials: 'HU', name: 'Huntr', color: '#38D9FF' },
  { initials: 'SI', name: 'Simplify', color: '#A78BFA' },
]

function StartupOutreachCard({ className = '' }: { className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const t1 = setTimeout(() => setSendStatus('sending'), 1400)
      const t2 = setTimeout(() => setSendStatus('sent'), 2600)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Card ref={cardRef} className={`flex flex-col gap-4 ${className}`}>
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">Startup Outreach Automation</p>

      <div>
        <StepLabel n={1} text="Find 3 matching startups" />
        <div className="flex items-center gap-3">
          {MATCHES.map((m) => (
            <div key={m.name} className="flex flex-col items-center gap-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-[#07111F]"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </div>
              <span className="text-[12px] font-semibold text-white/75 text-center leading-tight">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div>
        <StepLabel n={2} text="Draft email to founders" />
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[12px] font-semibold text-white mb-1">alex@teal.com</p>
          <p className="text-[12px] text-[#8B9DC3] leading-relaxed">
            Hey Alex — I built RepoMax to turn GitHub repos into resume bullets. Been using Teal for my own job search and think there&apos;s real overlap in how we both score resumes…
          </p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono text-[10px] font-bold text-emerald-400">3</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 font-mono text-[11px] font-bold text-emerald-400">
          {sendStatus === 'idle' && 'Queued to send'}
          {sendStatus === 'sending' && (
            <>
              <span className="inline-flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-1 w-1 rounded-full bg-current opacity-70"
                    style={{ animation: 'dotPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </span>
              Sending
            </>
          )}
          {sendStatus === 'sent' && <>Sent <Check className="h-3.5 w-3.5" /></>}
        </span>
      </div>

      <p className="text-center font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-400/80">All automated by RepoMax</p>
    </Card>
  )
}

const PREP_QUESTIONS = [
  { tag: 'ARCHITECTURE', q: 'Walk me through how RepoMax turns a raw README into a score.' },
  { tag: 'RELIABILITY', q: 'How do you stop the AI from inventing metrics that aren’t in the repo?' },
]

function InterviewPrepCard({ className = '' }: { className?: string }) {
  return (
    <Card className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/55">Interview Prep</p>
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-white/60">2 questions</span>
      </div>

      <div className="space-y-2">
        {PREP_QUESTIONS.map((item) => (
          <div key={item.tag} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#38D9FF] mb-1">{item.tag}</p>
            <p className="text-[13px] font-semibold text-white leading-snug">{item.q}</p>
          </div>
        ))}
      </div>

      <MiniCTA label="See my questions →" colorClass="border-[#38D9FF]/25 bg-[#38D9FF]/10 text-[#38D9FF] hover:bg-[#38D9FF]/15" />
    </Card>
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

  // Stage 1320, readme 780 → side gap = 270, card 248 → 22px clear of README edges
  const STAGE_W  = 1320
  const README_W = 780
  const CARD_W   = 248

  return (
    <section
      ref={sectionRef}
      id="readme-live"
      className="relative z-10 bg-[#131929] -mt-24 sm:-mt-28 lg:-mt-32 mb-0 pb-10 sm:pb-12"
    >
      {/* ── Desktop layout ─────────────────────────────────────────────────── */}
      <div className="hidden lg:block relative mx-auto px-4" style={{ maxWidth: `${STAGE_W + 32}px` }}>
        <div
          className="grid items-stretch gap-6 mx-auto"
          style={{ gridTemplateColumns: `${CARD_W}px ${README_W}px ${CARD_W}px`, maxWidth: `${STAGE_W}px` }}
        >
          {/* Left: proof stack */}
          <div className="flex flex-col gap-5">
            <ScoreCard displayScore={displayScore} started={started} />
            <FindingsCard className="mt-auto" />
          </div>

          {/* Center: README document */}
          <div className="flex flex-col rounded-xl overflow-hidden border border-[#30363d] shadow-[0_28px_90px_rgba(0,0,0,0.6)]">
            <GitHubChrome />
            <div className="flex-1 bg-white">
              <ReadmeDoc />
            </div>
          </div>

          {/* Right: feature proof stack */}
          <div className="flex flex-col gap-5">
            <StartupOutreachCard />
            <InterviewPrepCard className="mt-auto" />
          </div>
        </div>
      </div>

      {/* ── Mobile layout ───────────────────────────────────────────────── */}
      <div className="lg:hidden px-4 space-y-4">
        <div className="rounded-xl overflow-hidden border border-[#30363d] shadow-xl">
          <GitHubChrome />
          <ReadmeDoc />
        </div>

        <ScoreCard displayScore={displayScore} started={started} />
        <FindingsCard />
        <StartupOutreachCard />
        <InterviewPrepCard />
      </div>
    </section>
  )
}
