'use client'

import posthog from 'posthog-js'
import { useEffect, useState } from 'react'
import OutputCard from '@/components/OutputCard'
import RepoScoreCard, { type SaveStatus } from '@/components/RepoScoreCard'
import RepoScoreCardGhost from '@/components/RepoScoreCardGhost'
import type { AnalyzeResponse } from '@/types'

type TabId = 'review' | 'resume'

const UNLOCKED_TABS: { id: TabId; label: string }[] = [
  { id: 'review', label: 'Repo Review' },
  { id: 'resume', label: 'Resume Bullets' },
]

interface Props {
  data?: AnalyzeResponse
  repoUrl?: string
  isLoading?: boolean
  isAuthed?: boolean
  onRequireAuth?: (action: () => void) => void
  saveStatus?: SaveStatus
  onSaveScore?: () => void
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

function PillTabBar({
  active,
  onSelect,
  showReview,
}: {
  active: TabId
  onSelect: (id: TabId) => void
  showReview: boolean
}) {
  const unlocked = showReview ? UNLOCKED_TABS : UNLOCKED_TABS.filter((t) => t.id === 'resume')

  return (
    <div
      role="tablist"
      aria-label="Generated outputs"
      className="mb-5 inline-flex flex-wrap gap-0.5 rounded-full border border-[#242B3A] bg-[#0D111C] p-1"
    >
      {unlocked.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7AA7FF]/25',
              isActive ? 'bg-[#111827] text-[#7AA7FF]' : 'text-[#687386] hover:text-[#9AA3B5]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function OutputTabs({ data, repoUrl, isLoading = false, isAuthed = false, onRequireAuth, saveStatus, onSaveScore }: Props) {
  const hasData = !!data
  const hasReview = !!data?.repoScore

  const [activeTab, setActiveTab] = useState<TabId>('review')

  useEffect(() => {
    if (hasReview) setActiveTab('review')
    else if (hasData) setActiveTab('resume')
  }, [hasData, hasReview, data?.repoScore?.total])

  return (
    <div>
      {data && data.warnings.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-amber-400/15 bg-[#111827] px-5 py-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">Heads up</p>
          <ul className="space-y-1">
            {data.warnings.map((w, i) => (
              <li key={i} className="text-sm leading-relaxed text-amber-100/65">{w}</li>
            ))}
          </ul>
        </div>
      )}

      <PillTabBar
        active={activeTab}
        showReview={hasReview}
        onSelect={(id) => {
          posthog.capture('output_tab_switched', { tab: id, previous_tab: activeTab })
          setActiveTab(id)
        }}
      />

      <div role="tabpanel" key={`${activeTab}-${hasData ? 'data' : 'idle'}`} className="relative output-panel-enter">
        {isLoading && (
          <div
            className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-[#070A12]/55 pt-8 backdrop-blur-[2px]"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-[#9AA3B5]">Scoring your repo…</p>
          </div>
        )}

        {hasData ? (
          activeTab === 'review' && data?.repoScore ? (
            <RepoScoreCard score={data.repoScore} repoUrl={repoUrl} saveStatus={saveStatus} onSave={onSaveScore} />
          ) : (
            <OutputCard
              content={data?.resumeBullets ?? []}
              empty={false}
              tabId="resume"
              isAuthed={isAuthed}
              onRequireAuth={onRequireAuth}
            />
          )
        ) : activeTab === 'review' ? (
          <RepoScoreCardGhost />
        ) : (
          <OutputCard content={[]} empty tabId="resume" />
        )}
      </div>
    </div>
  )
}
