'use client'

import React, { useState } from 'react'
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

// ─── Preview: Startup Outreach ────────────────────────────────────────────────

function StartupOutreachPreview() {
  const ROWS = [
    { idx: '01', tag: 'EDTECH', name: 'StudyFetch', desc: 'AI flashcards, quizzes, and tutoring' },
    { idx: '02', tag: 'EDTECH', name: 'Knowt',      desc: 'Notes → study guides → practice tests' },
    { idx: '03', tag: 'EDTECH', name: 'Quizgecko',  desc: 'AI quiz generator from PDFs and docs'  },
  ]
  return (
    <div className={cn(landingSurface, 'overflow-hidden')}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3d4a66]">
        <span className={cn(landingAccentLabel, 'mb-0')}>Startup Outreach · CramMaster</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">3 matched</span>
      </div>
      {ROWS.map((r) => (
        <div key={r.idx} className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#3d4a66]/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={landingMeta}>{r.idx}</span>
              <span className={cn(landingMeta, 'opacity-50')}>·</span>
              <span className={landingTag}>{r.tag}</span>
            </div>
            <p className="text-[14px] font-semibold text-[#F8FAFC]">{r.name}</p>
            <p className={cn('text-[12px] mt-0.5', landingTextSecondary)}>{r.desc}</p>
          </div>
          <span className="shrink-0 mt-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">✓ match</span>
        </div>
      ))}
      <div className="px-5 py-4">
        <p className={cn(sectionLabel, 'mb-3')}>Drafted email</p>
        <div className="space-y-1.5 mb-3">
          <p className="text-[12px]">
            <span className={cn(landingMeta, 'mr-2')}>To:</span>
            <span className={landingTextSecondary}>sarah@studyfetch.com</span>
          </p>
          <p className="text-[12px]">
            <span className={cn(landingMeta, 'mr-2')}>Subject:</span>
            <span className="text-[#F8FAFC]">built an AI study tool in your space</span>
          </p>
        </div>
        <p className={cn('text-[12px] leading-relaxed', landingTextSecondary)}>
          Hey Sarah, I&apos;m a CS student who built CramMaster, an AI study app that turns notes into flashcards and quizzes. Saw StudyFetch is in the same space and thought my take on generation quality might be worth a quick chat. Open to 15 minutes?
        </p>
        <p className={cn(sectionLabel, 'mt-3 mb-0')}>Drafted from repo · edit before sending</p>
      </div>
    </div>
  )
}

// ─── Preview: Interview Prep ──────────────────────────────────────────────────

function InterviewPrepPreview() {
  const QS = [
    { idx: '01', tag: 'ARCHITECTURE', q: 'Walk me through how CramMaster turns raw notes into flashcards.' },
    { idx: '02', tag: 'RELIABILITY',  q: 'How do you stop bad AI output from reaching students?' },
    { idx: '03', tag: 'SCALE',        q: 'What breaks first if 10,000 students upload notes at once?' },
  ]
  return (
    <div className={cn(landingSurface, 'overflow-hidden')}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3d4a66]">
        <span className={cn(landingAccentLabel, 'mb-0')}>Interview Prep · CramMaster</span>
        <span className={cn(landingTag, 'normal-case tracking-[0.1em]')}>3 questions</span>
      </div>
      {QS.map((item) => (
        <div key={item.idx} className="px-5 py-4 border-b border-[#3d4a66]/60">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={landingMeta}>{item.idx}</span>
            <span className={cn(landingMeta, 'opacity-50')}>·</span>
            <span className={landingTag}>{item.tag}</span>
          </div>
          <p className="text-[13px] text-[#F8FAFC] leading-snug">{item.q}</p>
        </div>
      ))}
      <div className="px-5 py-4 border-l-2 border-[#38D9FF]">
        <p className={cn(landingAccentLabel, 'mb-2')}>Sample answer angle</p>
        <p className="text-[12px] text-[#F8FAFC] leading-snug mb-2">
          Walk through the full pipeline: input → chunking → LLM generation → validation → storage.
        </p>
        <ol className="space-y-1 text-[12px] leading-snug text-[#B8C4DC]">
          <li className="flex gap-2"><span className="text-[#38D9FF] shrink-0">→</span>Upload PDF, extract and chunk text</li>
          <li className="flex gap-2"><span className="text-[#38D9FF] shrink-0">→</span>LLM returns Q&amp;A pairs via JSON schema</li>
          <li className="flex gap-2"><span className="text-[#38D9FF] shrink-0">→</span>Validate output, drop malformed cards</li>
        </ol>
      </div>
    </div>
  )
}

// ─── Preview: Social Post ─────────────────────────────────────────────────────

function SocialPostPreview() {
  const [variant, setVariant] = useState<'linkedin' | 'x'>('linkedin')
  const posts = {
    linkedin: `I built CramMaster because studying from notes is still too manual.\n\nThe app turns study material into AI generated flashcards and quizzes, so students can practice faster instead of spending hours making study sets.\n\nThe hardest part was making the output actually useful, not just technically possible.`,
    x: `built CramMaster → turns your notes into AI flashcards + quizzes so you can actually study instead of making study sets.\n\nrepo: github.com/MSAbhishek22/CramMaster`,
  }
  return (
    <div className={cn(landingSurface, 'overflow-hidden')}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3d4a66]">
        <span className={cn(landingAccentLabel, 'mb-0')}>Social Post · CramMaster</span>
        <div className="flex items-center gap-1">
          {(['linkedin', 'x'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={cn(
                'rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-200',
                variant === v ? 'bg-[#38D9FF] text-[#07111F]' : cn(landingTextMuted, 'hover:text-[#F8FAFC]'),
              )}
            >
              {v === 'linkedin' ? 'LinkedIn' : 'X'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#3d4a66]/60">
        <div className="h-8 w-8 rounded-full bg-[#2a3550] flex items-center justify-center shrink-0 border border-[#4a5878]">
          <span className="text-[11px] font-semibold text-[#F8FAFC]">CS</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#F8FAFC]">CS Student</p>
          <p className={cn('text-[11px]', landingTextMuted)}>github.com/MSAbhishek22</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className={cn('text-[13px] leading-relaxed whitespace-pre-line', landingTextSecondary)}>{posts[variant]}</p>
      </div>
      {variant === 'linkedin' && (
        <div className="px-5 py-3 border-t border-[#3d4a66]/60 flex flex-wrap gap-x-2">
          {['#buildinpublic', '#csStudent', '#AI', '#edtech'].map((t) => (
            <span key={t} className="text-[11px] text-[#9BB4FF]">{t}</span>
          ))}
        </div>
      )}
      <div className="px-5 py-2.5 border-t border-[#3d4a66]/60">
        <p className={cn(sectionLabel, 'mb-0')}>Generated from repo · edit before posting</p>
      </div>
    </div>
  )
}

// ─── Features config ──────────────────────────────────────────────────────────

const FEATURES: {
  key: FeatureKey
  index: string
  label: string
  headline: string
  description: string
  bullets: string[]
  Preview: () => React.JSX.Element
}[] = [
  {
    key: 'outreach',
    index: '01',
    label: 'Startup Outreach',
    headline: 'Get startup founders to reply to your project.',
    description: 'Matches your repo to startups in your space, finds founder emails, and writes the cold email for you.',
    bullets: [
      'Finds startups with a product similar to yours',
      'Pulls the founder or CEO email for each match',
      'Writes a personalized cold email from your repo',
    ],
    Preview: StartupOutreachPreview,
  },
  {
    key: 'interview',
    index: '02',
    label: 'Interview Prep',
    headline: 'Practice the questions recruiters actually ask.',
    description: 'Questions built from your repo and shaped using interview data from real technical screens.',
    bullets: [
      'Pulled from your README, stack, and code structure',
      'Covers architecture, tradeoffs, and shipping decisions',
      'Each question includes a recruiter-style answer outline',
    ],
    Preview: InterviewPrepPreview,
  },
  {
    key: 'social',
    index: '03',
    label: 'Social Post',
    headline: 'Share what you built without sounding generic.',
    description: 'Turn your repo into a LinkedIn or X post that explains what you built, why it matters, and what was technically interesting.',
    bullets: [
      'LinkedIn and X drafts from your repo context',
      'Leads with the project, not a stack list',
      'Ready to edit and post in one pass',
    ],
    Preview: SocialPostPreview,
  },
]

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function FeatureTabs({ active, setActive }: { active: FeatureKey; setActive: (k: FeatureKey) => void }) {
  return (
    <div className={cn('grid grid-cols-3 border-b', featuresSectionBorder)}>
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
            <div className="pt-8 grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-8 lg:gap-12 items-start">
              {/* Left: text */}
              <div>
                <h3
                  className="font-bold text-[#F8FAFC] tracking-[-0.03em] leading-[1.1] mb-4"
                  style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2rem)' }}
                >
                  {feature.headline}
                </h3>
                <p className={cn('text-[14px] leading-relaxed mb-6', landingTextSecondary)}>
                  {feature.description}
                </p>
                <ul className="flex flex-col gap-3">
                  {feature.bullets.map((b) => (
                    <li key={b} className={cn('flex items-start gap-3 text-[13px]', landingTextSecondary)}>
                      <span className="mt-[5px] h-1 w-1 rounded-full bg-[#38D9FF]/60 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: preview */}
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
