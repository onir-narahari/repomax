'use client'

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

// ─── Proof Stats ────────────────────────────────────────────────────────────

const STATS = [
  { value: '500+', label: 'Students use RepoMax' },
  { value: '1,000+', label: 'Repos submitted' },
]

export function ProofStats() {
  return (
    <section className={cn('relative border-t', testimonialsSectionBorder, testimonialsSectionBg, sectionYCompact)}>
      <div className={cn('relative', sectionMax, sectionX)}>
        <div className="max-w-[720px] mx-auto text-center">
          <div className="flex items-center justify-center">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  'px-8 sm:px-12',
                  i > 0 && 'border-l border-white/10',
                )}
              >
                <p
                  className="font-bold text-[#EC4899] tabular-nums tracking-[-0.02em] leading-none"
                  style={{ fontSize: 'clamp(2.25rem, 5vw, 3.25rem)' }}
                >
                  {s.value}
                </p>
                <p className={cn('font-mono text-[10px] mt-3 uppercase tracking-[0.12em]', landingTextMuted)}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <HeroGithubCta size="lg" className="mt-10 sm:mt-12" label="Start for free today" />
        </div>
      </div>
    </section>
  )
}
