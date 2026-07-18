'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import HeroGithubCta from '@/components/hero/HeroGithubCta'
import {
  featuresSectionBg,
  featuresSectionBorder,
  landingAccentLabel,
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

// ─── Daily job matching section ────────────────────────────────────────────────

const BULLETS = [
  'Matches 3 open roles to your GitHub',
  'Delivered to your inbox every day at noon',
]

const MATCHES = [
  { company: 'Vercel', role: 'Frontend Engineer Intern', location: 'Remote · US', score: 94 },
  { company: 'Datadog', role: 'New Grad Software Engineer', location: 'New York, NY', score: 88 },
  { company: 'Ramp', role: 'Backend Engineer, New Grad', location: 'New York, NY · Hybrid', score: 82 },
]

function TodaysMatchCard() {
  return (
    <div className={cn(landingSurface, 'overflow-hidden')}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
        <span className={cn(landingAccentLabel, 'mb-0')}>Today&apos;s Match</span>
        <span className={cn('font-mono text-[10px] uppercase tracking-[0.12em]', landingTextMuted)}>
          12:00 PM daily
        </span>
      </div>
      <div className="divide-y divide-white/[0.08]">
        {MATCHES.map((m) => (
          <div key={m.company} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[15px] font-bold text-[#F8FAFC] truncate">{m.company}</p>
                <span className={landingTag}>{m.location}</span>
              </div>
              <p className={cn('text-[13px] truncate', landingTextSecondary)}>{m.role}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn('font-mono text-[9px] uppercase tracking-widest mb-1', landingTextMuted)}>Match</p>
              <p className="text-[24px] font-bold text-[#EC4899] tabular-nums leading-none">{m.score}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePageSections() {
  return (
    <section className={cn('relative border-t', featuresSectionBorder, featuresSectionBg, sectionYCompact)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0A0A0F] to-[#0D0D12]"
        aria-hidden
      />

      <div className={cn('relative', sectionMax, sectionX)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className={sectionLabel}>Daily job matching</p>
            <h2
              className="font-bold text-[#F8FAFC] tracking-[-0.03em] leading-[1.1] mb-7 max-w-lg"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}
            >
              Find roles that are tailored to you.
            </h2>
            <ul className="space-y-3.5">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#EC4899] shrink-0" />
                  <span className={cn('text-[14px] leading-relaxed', landingTextSecondary)}>{b}</span>
                </li>
              ))}
            </ul>
            <HeroGithubCta size="md" className="mt-7" label="Get your matches today" />
          </div>

          <TodaysMatchCard />
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials Carousel ────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "RepoMax flagged that my README had no demo link and no setup instructions. I fixed both in an afternoon and my score went from 54 to 89. A recruiter mentioned the live demo in my first call.",
    name: 'Priya',
    school: 'Georgia Tech',
    year: "'27",
    feature: 'Repo Score',
  },
  {
    quote: "I stopped scrolling job boards. RepoMax scans my repos every morning and three matched roles show up in my inbox by noon. I applied to one from Datadog the same day and got a recruiter screen a week later.",
    name: 'Marcus',
    school: 'UT Austin',
    year: "'26",
    feature: 'Daily Job Match',
  },
  {
    quote: "My resume bullets used to say 'built a web app.' RepoMax pulled out what I actually built — the auth flow, the caching layer, the stack — and turned it into bullets that sounded like an engineer wrote them.",
    name: 'Elena',
    school: 'UIUC',
    year: "'28",
    feature: 'Repo Score',
  },
]

export function TestimonialsCarousel() {
  const [idx, setIdx] = useState(0)
  const t = TESTIMONIALS[idx]
  const prev = () => setIdx((i) => (i + 2) % 3)
  const next = () => setIdx((i) => (i + 1) % 3)

  const arrowClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6B7280] transition-colors duration-200 hover:text-[#EC4899] hover:bg-white/[0.06]'

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
                <span className="h-1.5 w-1.5 rounded-full bg-[#EC4899]" />
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

          <div className="flex items-center justify-center gap-3 mt-8 sm:mt-10">
            <span className={cn('font-mono text-[10px] tabular-nums', landingTextMuted)}>01</span>
            <div className="flex items-center gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Testimonial ${i + 1}`}
                  className={cn(
                    'h-[2px] rounded-full transition-all duration-300',
                    i === idx ? 'w-8 bg-[#EC4899]' : 'w-4 bg-white/15 hover:bg-white/25',
                  )}
                />
              ))}
            </div>
            <span className={cn('font-mono text-[10px] tabular-nums', landingTextMuted)}>03</span>
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
