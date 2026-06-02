'use client'

import type { RepoScore, CategoryScore } from '@/types'

interface Props {
  score: RepoScore
  repoUrl?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  first_impression_clarity: 'First-Impression Clarity',
  runnable_setup_dx: 'Runnable Setup & Developer Experience',
  technical_depth_system_design: 'Technical Depth & System Design',
  proof_of_shipping: 'Proof of Shipping',
  testing_reliability_quality: 'Testing, Reliability & Quality Gates',
  documentation_depth: 'Documentation Depth',
  recruiter_resume_extractability: 'Recruiter / Resume Extractability',
}

const CATEGORY_ORDER = [
  'first_impression_clarity',
  'runnable_setup_dx',
  'technical_depth_system_design',
  'proof_of_shipping',
  'testing_reliability_quality',
  'documentation_depth',
  'recruiter_resume_extractability',
] as const

function scoreColor(total: number) {
  if (total >= 90) return { text: 'text-emerald-400', bar: 'bg-emerald-400', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' }
  if (total >= 80) return { text: 'text-blue-400',    bar: 'bg-blue-400',    badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20' }
  if (total >= 70) return { text: 'text-amber-400',   bar: 'bg-amber-400',   badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20' }
  if (total >= 60) return { text: 'text-orange-400',  bar: 'bg-orange-400',  badge: 'bg-orange-400/10 text-orange-400 border-orange-400/20' }
  return               { text: 'text-red-400',     bar: 'bg-red-400',     badge: 'bg-red-400/10 text-red-400 border-red-400/20' }
}

function catColor(score: number, max: number) {
  const pct = score / max
  if (pct >= 0.9) return 'bg-emerald-400'
  if (pct >= 0.75) return 'bg-blue-400'
  if (pct >= 0.55) return 'bg-amber-400'
  if (pct >= 0.4) return 'bg-orange-400'
  return 'bg-red-400'
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-[#242B3A] bg-[#0D111C] ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-[#242B3A] px-5 py-4">
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#687386]">
      {children}
    </p>
  )
}

function CategoryRow({ label, cat }: { label: string; cat: CategoryScore }) {
  const displayScore = Math.min(cat.score, cat.max)
  const pct = Math.min(100, Math.round((displayScore / cat.max) * 100))
  const barClass = catColor(displayScore, cat.max)
  return (
    <div className="space-y-1.5" title={cat.reason}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[#9AA3B5]">{label}</span>
        <span className="shrink-0 text-xs font-medium tabular-nums text-[#F5F3EA]">
          {displayScore}/{cat.max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A2235]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function RepoScoreCard({ score, repoUrl }: Props) {
  const colors = scoreColor(score.total)

  const categories = score.categories as unknown as Record<string, CategoryScore>

  const displayUrl = repoUrl
    ? repoUrl.replace('https://github.com/', '')
    : null

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card>
        <div className="px-6 py-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#F5F3EA]">Repo Review</h2>
              {displayUrl && (
                <p className="mt-0.5 font-mono text-xs text-[#687386]">{displayUrl}</p>
              )}
            </div>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${colors.badge}`}>
              {score.label}
            </span>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex items-baseline gap-1">
              <span className={`text-6xl font-bold tabular-nums leading-none tracking-tight ${colors.text}`}>
                {score.total}
              </span>
              <span className="text-2xl font-light text-[#687386]">/100</span>
            </div>
            <p className="mb-1 max-w-lg text-sm leading-relaxed text-[#9AA3B5]">
              {score.summary}
            </p>
          </div>

          {score.strengths.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {score.strengths.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1 text-xs text-emerald-400">
                  <span className="text-[10px]">✓</span>{s}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 2-col grid on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <SectionTitle>Scores</SectionTitle>
            </CardHeader>
            <div className="divide-y divide-[#1A2235]">
              {CATEGORY_ORDER.map((key) => {
                const cat = categories[key]
                if (!cat) return null
                return (
                  <div key={key} className="px-5 py-4">
                    <CategoryRow label={CATEGORY_LABELS[key]} cat={cat} />
                  </div>
                )
              })}
            </div>
          </Card>

        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Issues & Fixes */}
          {(score.weaknesses.length > 0 || score.fixes.length > 0) && (
            <Card>
              <CardHeader>
                <SectionTitle>What&apos;s holding this repo back</SectionTitle>
              </CardHeader>
              <div className="divide-y divide-[#1A2235]">
                {score.weaknesses.map((issue, i) => {
                  const fix = score.fixes[i]
                  return (
                    <div key={i} className="space-y-1.5 px-5 py-4">
                      <p className="text-sm font-medium leading-relaxed text-[#F5F3EA]">{issue}</p>
                      {fix && (
                        <p className="flex gap-2 border-l-2 border-blue-400/25 pl-3 text-xs leading-relaxed text-[#687386]">
                          <span className="shrink-0 text-blue-400">→</span>{fix}
                        </p>
                      )}
                    </div>
                  )
                })}
                {/* Any extra fixes without a paired weakness */}
                {score.fixes.slice(score.weaknesses.length).map((fix, i) => (
                  <div key={`fix-extra-${i}`} className="px-5 py-4">
                    <p className="flex gap-2 border-l-2 border-blue-400/25 pl-3 text-sm leading-relaxed text-[#687386]">
                      <span className="shrink-0 text-blue-400">→</span>{fix}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Resume positioning tips */}
          {score.resume_positioning_tips.length > 0 && (
            <Card>
              <CardHeader>
                <SectionTitle>How to position this project</SectionTitle>
              </CardHeader>
              <ul className="divide-y divide-[#1A2235]">
                {score.resume_positioning_tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 px-5 py-4">
                    <span className="mt-0.5 shrink-0 text-xs font-semibold tabular-nums text-[#7AA7FF]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm leading-relaxed text-[#9AA3B5]">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
