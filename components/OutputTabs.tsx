'use client'

import { useState } from 'react'
import OutputCard from '@/components/OutputCard'
import type { AnalyzeResponse } from '@/types'

type TabId = 'resume' | 'linkedin' | 'x'

const TABS: { id: TabId; label: string }[] = [
  { id: 'resume', label: 'Resume' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X / Twitter' },
]

interface Props {
  data?: AnalyzeResponse
}

export default function OutputTabs({ data }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('resume')
  const hasData = !!data

  const getContent = (): { content: string | string[]; charLimit?: number } => {
    if (!data) return { content: '' }
    switch (activeTab) {
      case 'resume':   return { content: data.resumeBullets }
      case 'linkedin': return { content: data.linkedInPost }
      case 'x':        return { content: data.twitterPost, charLimit: 280 }
    }
  }

  const { content, charLimit } = getContent()

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

      <div
        role="tablist"
        aria-label="Output format"
        className="mb-5 inline-flex gap-0.5 rounded-full border border-[#242B3A] bg-[#0D111C] p-1"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7AA7FF]/25',
                isActive
                  ? 'bg-[#111827] text-[#7AA7FF]'
                  : 'text-[#687386] hover:text-[#9AA3B5]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" key={activeTab} className="output-panel-enter">
        <OutputCard
          content={content}
          charLimit={charLimit}
          empty={!hasData}
          tabId={activeTab}
        />
      </div>
    </div>
  )
}
