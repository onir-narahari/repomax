'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  type FeatureKey,
  featuresSectionBg,
  featuresSectionBorder,
  landingAccentLabel,
  landingMeta,
  landingSurface,
  landingTag,
  landingTextMuted,
  landingTextSecondary,
  sectionLabel,
  sectionMax,
  sectionX,
  sectionYCompact,
  testimonialsSectionBg,
  testimonialsSectionBorder,
} from '@/lib/landing-layout'

// ─── Shared simulation primitives ──────────────────────────────────────────────

const REPO_SLUG = 'MSAbhishek22/CramMaster'
const TYPE_SPEED_MS = 32
const TYPE_DURATION_MS = REPO_SLUG.length * TYPE_SPEED_MS + 400

type LogEntry = { key: string; delay: number; col: 'left' | 'right'; render: () => React.ReactNode }

/** Reveals `text` one character at a time, once, on mount. */
function useTypewriter(text: string, speedMs: number) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    let i = 0
    const t = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) window.clearInterval(t)
    }, speedMs)
    return () => window.clearInterval(t)
  }, [text, speedMs])
  return { shown, done: shown === text }
}

/** Reveals `entries` one at a time (cumulative — nothing disappears), starting
 *  `startDelayMs` after mount. Runs once and holds on the fully-built state. */
function useSimulationTimeline(entries: LogEntry[], startDelayMs: number) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    const timeouts: number[] = []
    let acc = startDelayMs
    entries.forEach((entry, i) => {
      acc += entry.delay
      timeouts.push(window.setTimeout(() => setVisibleCount(i + 1), acc))
    })
    return () => timeouts.forEach((t) => window.clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, startDelayMs])

  return visibleCount
}

function SimulationCard({
  label,
  status,
  children,
}: {
  label: string
  status: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={cn(landingSurface, 'overflow-hidden')}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3d4a66]">
        <span className={cn(landingAccentLabel, 'mb-0')}>{label}</span>
        {status}
      </div>
      {children}
    </div>
  )
}

function RepoUrlRow({ shown }: { shown: string }) {
  return (
    <div className="px-5 py-4 border-b border-[#3d4a66]">
      <p className={cn(sectionLabel, 'mb-2')}>Paste a repo</p>
      <div className="flex items-center rounded-lg border border-[#3d4a66] bg-[#131a2c] px-3 py-2.5">
        <span className="font-mono text-[12px] text-[#6B7A9A]">github.com/</span>
        <span className="font-mono text-[12px] text-[#F8FAFC]">{shown}</span>
        <span className="ml-0.5 inline-block h-[13px] w-[1.5px] bg-[#38D9FF] animate-pulse" />
      </div>
    </div>
  )
}

/** All entries render immediately (space reserved from frame one — no layout jump,
 *  no scrolling), each fading in at its scheduled turn based on `visibleCount`. */
function RevealItem({ entry, index, visibleCount }: { entry: LogEntry; index: number; visibleCount: number }) {
  const visible = index < visibleCount
  return (
    <motion.div animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }} transition={{ duration: 0.3 }}>
      {entry.render()}
    </motion.div>
  )
}

/** Two side-by-side columns — left = what got found/generated, right = what happens
 *  with it — so the full 0→1 process is visible together on one card, no scrolling. */
function SimulationColumns({
  entries,
  visibleCount,
  leftLabel,
  rightLabel,
}: {
  entries: LogEntry[]
  visibleCount: number
  leftLabel: string
  rightLabel: string
}) {
  const left = entries.filter((e) => e.col === 'left')
  const right = entries.filter((e) => e.col === 'right')
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-[#3d4a66]">
      <div className="px-5 py-4 border-t sm:border-t-0 border-[#3d4a66]/60">
        <p className={cn(sectionLabel, 'mb-3')}>{leftLabel}</p>
        <div className="space-y-3">
          {left.map((e) => (
            <RevealItem key={e.key} entry={e} index={entries.indexOf(e)} visibleCount={visibleCount} />
          ))}
        </div>
      </div>
      <div className="px-5 py-4 border-t sm:border-t-0 border-[#3d4a66]/60">
        <p className={cn(sectionLabel, 'mb-3')}>{rightLabel}</p>
        <div className="space-y-3">
          {right.map((e) => (
            <RevealItem key={e.key} entry={e} index={entries.indexOf(e)} visibleCount={visibleCount} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#38D9FF]">
      {children}
    </p>
  )
}

// ─── Simulation: Startup Outreach ──────────────────────────────────────────────

const OUTREACH_ROWS = [
  { idx: '01', tag: 'EDTECH', name: 'StudyFetch', desc: 'AI flashcards, quizzes, and tutoring' },
  { idx: '02', tag: 'EDTECH', name: 'Knowt',      desc: 'Notes → study guides → practice tests' },
  { idx: '03', tag: 'EDTECH', name: 'Quizgecko',  desc: 'AI quiz generator from PDFs and docs'  },
]

const OUTREACH_MATCHED_AT = 1 + OUTREACH_ROWS.length // status line + 3 rows

const OUTREACH_ENTRIES: LogEntry[] = [
  {
    key: 'status-match',
    delay: 400,
    col: 'left',
    render: () => <StatusLine>Matching startups…</StatusLine>,
  },
  ...OUTREACH_ROWS.map((r, i) => ({
    key: `row-${r.idx}`,
    delay: i === 0 ? 500 : 350,
    col: 'left' as const,
    render: () => (
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={landingMeta}>{r.idx}</span>
            <span className={cn(landingMeta, 'opacity-50')}>·</span>
            <span className={landingTag}>{r.tag}</span>
          </div>
          <p className="text-[13px] font-semibold text-[#F8FAFC]">{r.name}</p>
          <p className={cn('text-[11px] mt-0.5', landingTextSecondary)}>{r.desc}</p>
        </div>
        <span className="shrink-0 mt-0.5 whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">✓ match</span>
      </div>
    ),
  })),
  {
    key: 'status-draft',
    delay: 600,
    col: 'right',
    render: () => <StatusLine>Drafting email…</StatusLine>,
  },
  {
    key: 'email',
    delay: 500,
    col: 'right',
    render: () => (
      <div>
        <div className="space-y-1 mb-2">
          <p className="text-[11px]">
            <span className={cn(landingMeta, 'mr-2')}>To:</span>
            <span className={landingTextSecondary}>sarah@studyfetch.com</span>
          </p>
          <p className="text-[11px]">
            <span className={cn(landingMeta, 'mr-2')}>Subject:</span>
            <span className="text-[#F8FAFC]">built an AI study tool in your space</span>
          </p>
        </div>
        <p className={cn('text-[11px] leading-relaxed', landingTextSecondary)}>
          Hey Sarah, I&apos;m a CS student who built CramMaster, an AI study app that turns notes into flashcards and quizzes. Saw StudyFetch is in the same space and thought my take on generation quality might be worth a quick chat. Open to 15 minutes?
        </p>
      </div>
    ),
  },
  {
    key: 'status-send',
    delay: 900,
    col: 'right',
    render: () => <StatusLine>Sending from you@gmail.com…</StatusLine>,
  },
  {
    key: 'sent',
    delay: 700,
    col: 'right',
    render: () => (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
        <span className="text-emerald-400 text-[12px]">✓</span>
        <span className="text-[11px] font-semibold text-emerald-300">Sent to sarah@studyfetch.com</span>
      </div>
    ),
  },
]

function StartupOutreachSimulation() {
  const visibleCount = useSimulationTimeline(OUTREACH_ENTRIES, TYPE_DURATION_MS)
  const { shown } = useTypewriter(REPO_SLUG, TYPE_SPEED_MS)

  const status = (
    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">
      {visibleCount >= OUTREACH_MATCHED_AT ? '3 matched' : 'scanning…'}
    </span>
  )

  return (
    <SimulationCard label="Startup Outreach · CramMaster" status={status}>
      <RepoUrlRow shown={shown} />
      <SimulationColumns
        entries={OUTREACH_ENTRIES}
        visibleCount={visibleCount}
        leftLabel="Matched startups"
        rightLabel="Outreach email"
      />
    </SimulationCard>
  )
}

// ─── Simulation: Interview Prep ────────────────────────────────────────────────

const INTERVIEW_QS = [
  { idx: '01', tag: 'ARCHITECTURE', q: 'Walk me through how CramMaster turns raw notes into flashcards.' },
  { idx: '02', tag: 'RELIABILITY',  q: 'How do you stop bad AI output from reaching students?' },
  { idx: '03', tag: 'SCALE',        q: 'What breaks first if 10,000 students upload notes at once?' },
]

const INTERVIEW_QUESTIONS_AT = 1 + INTERVIEW_QS.length // status line + 3 questions

const INTERVIEW_ENTRIES: LogEntry[] = [
  {
    key: 'status-generate',
    delay: 400,
    col: 'left',
    render: () => <StatusLine>Generating interview questions…</StatusLine>,
  },
  ...INTERVIEW_QS.map((item, i) => ({
    key: `q-${item.idx}`,
    delay: i === 0 ? 500 : 350,
    col: 'left' as const,
    render: () => (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={landingMeta}>{item.idx}</span>
          <span className={cn(landingMeta, 'opacity-50')}>·</span>
          <span className={landingTag}>{item.tag}</span>
        </div>
        <p className="text-[12px] text-[#F8FAFC] leading-snug">{item.q}</p>
      </div>
    ),
  })),
  {
    key: 'coach',
    delay: 700,
    col: 'right',
    render: () => (
      <div className="border-l-2 border-[#38D9FF] pl-3">
        <p className={cn(landingAccentLabel, 'mb-1.5')}>What to listen for</p>
        <p className="text-[11px] text-[#F8FAFC] leading-snug mb-1.5">
          Walk through the full pipeline: input → chunking → LLM generation → validation → storage.
        </p>
        <ol className="space-y-1 text-[11px] leading-snug text-[#B8C4DC]">
          <li className="flex gap-2"><span className="text-[#38D9FF] shrink-0">→</span>Upload PDF, extract and chunk text</li>
          <li className="flex gap-2"><span className="text-[#38D9FF] shrink-0">→</span>LLM returns Q&amp;A pairs via JSON schema</li>
          <li className="flex gap-2"><span className="text-[#38D9FF] shrink-0">→</span>Validate output, drop malformed cards</li>
        </ol>
      </div>
    ),
  },
  {
    key: 'ready',
    delay: 900,
    col: 'right',
    render: () => <p className="text-[12px] font-semibold text-emerald-300">✓ Ready for these questions</p>,
  },
]

function InterviewPrepSimulation() {
  const visibleCount = useSimulationTimeline(INTERVIEW_ENTRIES, TYPE_DURATION_MS)
  const { shown } = useTypewriter(REPO_SLUG, TYPE_SPEED_MS)

  const status = (
    <span className={cn(landingTag, 'normal-case tracking-[0.1em]')}>
      {visibleCount >= INTERVIEW_QUESTIONS_AT ? '3 questions' : 'scanning…'}
    </span>
  )

  return (
    <SimulationCard label="Interview Prep · CramMaster" status={status}>
      <RepoUrlRow shown={shown} />
      <SimulationColumns
        entries={INTERVIEW_ENTRIES}
        visibleCount={visibleCount}
        leftLabel="Interview questions"
        rightLabel="How to answer"
      />
    </SimulationCard>
  )
}

// ─── Features config ──────────────────────────────────────────────────────────

const FEATURES: {
  key: FeatureKey
  index: string
  label: string
  headline: string
  Preview: () => React.JSX.Element
}[] = [
  {
    key: 'outreach',
    index: '01',
    label: 'Startup Outreach',
    headline: 'Turn your repo into targeted startup outreach.',
    Preview: StartupOutreachSimulation,
  },
  {
    key: 'interview',
    index: '02',
    label: 'Interview Prep',
    headline: 'Practice the questions recruiters actually ask.',
    Preview: InterviewPrepSimulation,
  },
]

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function FeatureTabs({ active, setActive }: { active: FeatureKey; setActive: (k: FeatureKey) => void }) {
  return (
    <div className={cn('grid grid-cols-2 border-b', featuresSectionBorder)}>
      {FEATURES.map((f) => {
        const isActive = f.key === active
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => setActive(f.key)}
            className={cn(
              'relative px-3 sm:px-6 py-4 sm:py-5 text-left transition-colors duration-200',
              'border-b-2 border-r last:border-r-0 -mb-px',
              featuresSectionBorder,
              isActive
                ? 'border-b-[#38D9FF] bg-[#1a2238]/50'
                : 'border-b-transparent hover:bg-[#1a2238]/25',
            )}
          >
            <p className={cn('font-mono text-[10px] tabular-nums mb-1.5 transition-colors', isActive ? 'text-[#38D9FF]' : landingTextMuted)}>
              {f.index}
            </p>
            <p className={cn('font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.1em] leading-tight transition-colors', isActive ? 'text-[#F8FAFC]' : landingTextMuted)}>
              <span className="hidden sm:inline">{f.label}</span>
              <span className="sm:hidden">{f.label.split(' ')[0]}</span>
            </p>
          </button>
        )
      })}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomePageSections() {
  const [active, setActive] = useState<FeatureKey>('outreach')
  const feature = FEATURES.find((f) => f.key === active)!

  return (
    <section className={cn('relative border-t', featuresSectionBorder, featuresSectionBg, sectionYCompact)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#202941] to-[#171f2e]"
        aria-hidden
      />

      <div className={cn('relative', sectionMax, sectionX)}>
        <div className="mb-8 lg:mb-10">
          <p className={sectionLabel}>After the scan</p>
          <h2
            className="font-bold text-[#F8FAFC] tracking-[-0.03em] leading-[1.1] max-w-2xl"
            style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}
          >
            Turn your repo into opportunities.
          </h2>
        </div>

        <FeatureTabs active={active} setActive={setActive} />

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="pt-8">
              <h3
                className="font-bold text-[#F8FAFC] tracking-[-0.03em] leading-[1.1] mb-5 max-w-2xl"
                style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2rem)' }}
              >
                {feature.headline}
              </h3>
              <feature.Preview />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

// ─── Testimonials Carousel ────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "RepoMax made me actually think through my own project. The interview prep covered architecture, system design, and tradeoffs. When Meta asked about a technical decision I made, I had a real answer.",
    name: 'Onir',
    school: 'UT Austin',
    year: "'28",
    feature: 'Interview Prep',
  },
  {
    quote: "The startup outreach feature matched my fintech project to a YC company I had never heard of. I sent the drafted email, heard back in two days, and I am working there this summer.",
    name: 'Cyra',
    school: 'UIUC',
    year: "'29",
    feature: 'Startup Outreach',
  },
  {
    quote: "I rewrote my README using the suggestions, then posted the social content RepoMax generated. An Amazon recruiter messaged me on LinkedIn three days later and fast-tracked me straight to an interview.",
    name: 'Kevin',
    school: 'Rice',
    year: "'27",
    feature: 'Social Post',
  },
]

export function TestimonialsCarousel() {
  const [idx, setIdx] = useState(0)
  const t = TESTIMONIALS[idx]
  const prev = () => setIdx((i) => (i + 2) % 3)
  const next = () => setIdx((i) => (i + 1) % 3)

  const arrowClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6B7A9A] transition-colors duration-200 hover:text-[#38D9FF] hover:bg-[#1a2238]/60'

  const arrowIcon = (direction: 'prev' | 'next') => (
    <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {direction === 'prev' ? <path d="M9.5 2.5L5 7.5l4.5 5" /> : <path d="M5.5 2.5L10 7.5l-4.5 5" />}
    </svg>
  )

  return (
    <section className={cn('relative border-t', testimonialsSectionBorder, testimonialsSectionBg, sectionYCompact)}>
      <div className={cn('relative', sectionMax, sectionX)}>
        <div className="max-w-[720px] mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-8 sm:mb-10">
            <AnimatePresence mode="wait">
              <motion.div key={t.feature} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#38D9FF]" />
                <span className={cn(landingAccentLabel, 'mb-0')}>{t.feature}</span>
              </motion.div>
            </AnimatePresence>
            <span className={cn('font-mono text-[11px] tabular-nums', landingTextMuted)}>
              {String(idx + 1).padStart(2, '0')} / 03
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <button onClick={prev} aria-label="Previous testimonial" className={cn(arrowClass, 'hidden sm:flex')}>{arrowIcon('prev')}</button>
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.blockquote key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
                  <p className="font-serif text-[#F0F4FA] leading-[1.45] tracking-[-0.01em]" style={{ fontSize: 'clamp(1.25rem, 2.4vw, 1.625rem)' }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </motion.blockquote>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.footer key={t.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-8 sm:mt-10">
                  <p className="text-[14px] font-medium text-[#F8FAFC] tracking-[-0.01em]">{t.name}</p>
                  <p className={cn('font-mono text-[10px] mt-1 uppercase tracking-[0.12em]', landingTextMuted)}>{t.school} {t.year}</p>
                </motion.footer>
              </AnimatePresence>
            </div>
            <button onClick={next} aria-label="Next testimonial" className={cn(arrowClass, 'hidden sm:flex')}>{arrowIcon('next')}</button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 sm:mt-10">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Testimonial ${i + 1}`} className={cn('h-[3px] rounded-full transition-all duration-300', i === idx ? 'w-6 bg-[#38D9FF]' : 'w-[3px] bg-[#4a5878] hover:bg-[#6B7A9A]')} />
            ))}
          </div>

          <div className="flex sm:hidden items-center justify-center gap-6 mt-6">
            <button onClick={prev} aria-label="Previous testimonial" className={arrowClass}>{arrowIcon('prev')}</button>
            <button onClick={next} aria-label="Next testimonial" className={arrowClass}>{arrowIcon('next')}</button>
          </div>
        </div>
      </div>
    </section>
  )
}
