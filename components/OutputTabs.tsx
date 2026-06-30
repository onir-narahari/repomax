'use client'

import posthog from 'posthog-js'
import { useEffect, useState } from 'react'
import OutputCard from '@/components/OutputCard'
import RepoScoreCard, { type SaveStatus } from '@/components/RepoScoreCard'
import RepoScoreCardGhost from '@/components/RepoScoreCardGhost'
import type { AnalyzeResponse } from '@/types'

type TabId = 'review' | 'resume' | 'outreach' | 'interview'

const UNLOCKED_TABS: { id: TabId; label: string }[] = [
  { id: 'review', label: 'Repo Review' },
  { id: 'resume', label: 'Resume Bullets' },
]

const LOCKED_TABS: { id: TabId; label: string; desc: string }[] = [
  {
    id: 'outreach',
    label: 'Startup Outreach',
    desc: 'Matched startups + drafted cold email — from your repo.',
  },
  {
    id: 'interview',
    label: 'Interview Prep',
    desc: 'The technical questions a recruiter will ask about your project.',
  },
]

const ALL_TAB_IDS = new Set<TabId>(['review', 'resume', 'outreach', 'interview'])
const LOCKED_IDS = new Set<TabId>(['outreach', 'interview'])

interface Props {
  data?: AnalyzeResponse
  repoUrl?: string
  isLoading?: boolean
  isAuthed?: boolean
  onRequireAuth?: (action: () => void) => void
  saveStatus?: SaveStatus
  onSaveScore?: () => void
}

// ─── Blurred preview content ──────────────────────────────────────────────────

function OutreachBlurPreview() {
  return (
    <div className="rounded-xl border border-[#3d4a66] bg-[#1a2238] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3d4a66]">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#38D9FF]">Startup Outreach · CramMaster</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">3 matched</span>
      </div>
      {[
        { idx: '01', tag: 'EDTECH', name: 'StudyFetch', desc: 'AI flashcards, quizzes, and tutoring' },
        { idx: '02', tag: 'EDTECH', name: 'Knowt', desc: 'Notes → study guides → practice tests' },
        { idx: '03', tag: 'EDTECH', name: 'Quizgecko', desc: 'AI quiz generator from PDFs and docs' },
      ].map((r) => (
        <div key={r.idx} className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#3d4a66]/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-[#8B9CC4]">{r.idx}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#9BB4FF]">{r.tag}</span>
            </div>
            <p className="text-[14px] font-semibold text-[#F8FAFC]">{r.name}</p>
            <p className="text-[12px] mt-0.5 text-[#B8C4DC]">{r.desc}</p>
          </div>
          <span className="shrink-0 mt-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">✓ match</span>
        </div>
      ))}
      <div className="px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8B9CC4] mb-3">Drafted email</p>
        <div className="space-y-1.5 mb-3">
          <p className="text-[12px]"><span className="font-mono text-[10px] text-[#8B9CC4] mr-2">To:</span><span className="text-[#B8C4DC]">sarah@studyfetch.com</span></p>
          <p className="text-[12px]"><span className="font-mono text-[10px] text-[#8B9CC4] mr-2">Subject:</span><span className="text-[#F8FAFC]">built an AI study tool in your space</span></p>
        </div>
        <p className="text-[12px] leading-relaxed text-[#B8C4DC]">Hey Sarah, I&apos;m a CS student who built CramMaster, an AI study app that turns notes into flashcards and quizzes. Saw StudyFetch is in the same space and thought my take on generation quality might be worth a quick chat. Open to 15 minutes?</p>
      </div>
    </div>
  )
}

function InterviewBlurPreview() {
  return (
    <div className="rounded-xl border border-[#3d4a66] bg-[#1a2238] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3d4a66]">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#38D9FF]">Interview Prep · CramMaster</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#9BB4FF]">5 questions</span>
      </div>
      {[
        { idx: '01', tag: 'ARCHITECTURE', q: 'Walk me through how CramMaster turns raw notes into flashcards.' },
        { idx: '02', tag: 'RELIABILITY',  q: 'How do you stop bad AI output from reaching students?' },
        { idx: '03', tag: 'SCALE',        q: 'What breaks first if 10,000 students upload notes at once?' },
        { idx: '04', tag: 'TRADEOFFS',    q: 'What did you give up to ship CramMaster faster?' },
        { idx: '05', tag: 'NEXT STEPS',   q: 'What would you build next if you had 3 more months?' },
      ].map((item) => (
        <div key={item.idx} className="px-5 py-3.5 border-b border-[#3d4a66]/60">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-[#8B9CC4]">{item.idx}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#9BB4FF]">{item.tag}</span>
          </div>
          <p className="text-[13px] text-[#F8FAFC] leading-snug">{item.q}</p>
        </div>
      ))}
      <div className="px-5 py-4 border-l-2 border-[#38D9FF]">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#38D9FF] mb-2">Answer angle</p>
        <p className="text-[12px] text-[#B8C4DC] leading-relaxed">Walk through the pipeline: input → chunking → LLM generation → validation → storage. Cover quality checks and the main tradeoff.</p>
      </div>
    </div>
  )
}

// ─── Locked tab overlay ───────────────────────────────────────────────────────

function LockedTabContent({ tabId }: { tabId: 'outreach' | 'interview' }) {
  const tab = LOCKED_TABS.find((t) => t.id === tabId)!
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'err'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'done' : 'err')
      if (res.ok) posthog.capture('waitlist_signup_client', { email, tab: tabId })
    } catch {
      setStatus('err')
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Full rich blurred preview */}
      <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)', opacity: 0.28 }} aria-hidden>
        {tabId === 'outreach' ? <OutreachBlurPreview /> : <InterviewBlurPreview />}
      </div>

      {/* Email overlay — centered */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-[340px] rounded-xl border border-[#242B3A] bg-[#0D111C]/96 backdrop-blur-sm px-6 py-6 shadow-2xl">
          {status === 'done' ? (
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-[#F5F3EA] mb-1">You&apos;re on the list.</p>
              <p className="text-[12px] text-[#687386]">We&apos;ll email your {tab.label.toLowerCase()} results when ready.</p>
            </div>
          ) : (
            <>
              <p className="text-[15px] font-semibold text-[#F5F3EA] mb-1">Get your results by email.</p>
              <p className="text-[12px] text-[#687386] mb-5">{tab.desc}</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-[#242B3A] bg-[#0D111C] px-4 py-2.5 text-sm text-[#F5F3EA] placeholder:text-[#687386] outline-none focus:border-[#334155] transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-lg bg-[#7AA7FF] py-2.5 text-sm font-semibold text-[#070A12] transition hover:bg-[#93BBFF] disabled:opacity-60"
                >
                  {status === 'loading' ? 'Sending…' : 'Get early access →'}
                </button>
              </form>
              {status === 'err' && (
                <p className="mt-2 text-center text-[11px] text-red-400">Something went wrong — try again.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
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
      {LOCKED_TABS.map((tab) => {
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

  const isLockedTab = LOCKED_IDS.has(activeTab)

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
          if (id === 'resume' && !isAuthed) {
            posthog.capture('output_tab_auth_gate', { tab: id })
            onRequireAuth?.(() => setActiveTab('resume'))
            return
          }
          posthog.capture('output_tab_switched', { tab: id, previous_tab: activeTab })
          setActiveTab(id)
        }}
      />

      {isLockedTab ? (
        <LockedTabContent tabId={activeTab as 'outreach' | 'interview'} />
      ) : (
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
              <OutputCard content={data?.resumeBullets ?? []} empty={false} tabId="resume" />
            )
          ) : activeTab === 'review' ? (
            <RepoScoreCardGhost />
          ) : (
            <OutputCard content={[]} empty tabId="resume" />
          )}
        </div>
      )}
    </div>
  )
}
