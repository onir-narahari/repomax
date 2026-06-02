'use client'

import { useEffect, useState } from 'react'
import OutputCard from '@/components/OutputCard'
import RepoScoreCard from '@/components/RepoScoreCard'
import RepoScoreCardGhost from '@/components/RepoScoreCardGhost'
import type { AnalyzeResponse } from '@/types'

type TabId = 'review' | 'resume'

const REVIEW_TAB = { id: 'review' as const, label: 'Repo Review', kicker: 'Score' }
const RESUME_TAB = { id: 'resume' as const, label: 'Resume',      kicker: 'Bullets' }

interface Props {
  data?: AnalyzeResponse
  repoUrl?: string
}

function scoreAccent(total: number) {
  if (total >= 90) return 'text-emerald-400'
  if (total >= 80) return 'text-blue-400'
  if (total >= 70) return 'text-amber-400'
  if (total >= 60) return 'text-orange-400'
  return 'text-red-400'
}

function ResultsTabBar({
  tabs,
  active,
  onSelect,
  score,
}: {
  tabs: { id: TabId; label: string; kicker: string }[]
  active: TabId
  onSelect: (id: TabId) => void
  score?: number
}) {
  return (
    <div
      role="tablist"
      aria-label="Generated outputs"
      className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-[#242B3A] bg-[#090D16]/90 p-1 backdrop-blur-sm"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id
        const showScore = tab.id === 'review' && score != null
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={[
              'group relative rounded-xl px-3 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7AA7FF]/30',
              isActive
                ? 'bg-[#111827] shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-[#334155]/60'
                : 'text-[#687386] hover:bg-[#0D111C] hover:text-[#9AA3B5]',
            ].join(' ')}
          >
            {isActive && (
              <span
                className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[#7AA7FF]/50 to-transparent"
                aria-hidden="true"
              />
            )}
            <span
              className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${
                isActive ? 'text-[#7AA7FF]/80' : 'text-[#687386]'
              }`}
            >
              {tab.kicker}
            </span>
            <span
              className={`mt-0.5 block text-sm font-semibold tracking-tight ${
                isActive ? 'text-[#F5F3EA]' : 'text-[#9AA3B5] group-hover:text-[#F5F3EA]'
              }`}
            >
              {tab.label}
            </span>
            {showScore && (
              <span
                className={`mt-1.5 block text-xl font-bold tabular-nums leading-none ${scoreAccent(score)}`}
              >
                {score}
                <span className="text-sm font-normal text-[#687386]">/100</span>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function OutputTabs({ data, repoUrl }: Props) {
  const hasData = !!data
  const hasReview = !!data?.repoScore

  const [activeTab, setActiveTab] = useState<TabId>('review')

  useEffect(() => {
    if (hasReview) setActiveTab('review')
    else if (hasData) setActiveTab('resume')
  }, [hasData, hasReview, data?.repoScore?.total])

  const tabs = hasReview ? [REVIEW_TAB, RESUME_TAB] : [RESUME_TAB]

  return (
    <div>
      {data && data.warnings.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-amber-400/15 bg-[#111827] px-5 py-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
            Heads up
          </p>
          <ul className="space-y-1">
            {data.warnings.map((w, i) => (
              <li key={i} className="text-sm leading-relaxed text-amber-100/65">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasData ? (
        <>
          <ResultsTabBar
            tabs={tabs}
            active={activeTab}
            onSelect={setActiveTab}
            score={data?.repoScore?.total}
          />
          <div role="tabpanel" key={activeTab} className="output-panel-enter">
            {activeTab === 'review' && data?.repoScore ? (
              <RepoScoreCard score={data.repoScore} repoUrl={repoUrl} />
            ) : (
              <OutputCard
                content={data.resumeBullets}
                empty={false}
                tabId="resume"
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <RepoScoreCardGhost />
          </div>
          <OutputCard
            content={[]}
            empty
            tabId="resume"
          />
        </>
      )}
    </div>
  )
}
