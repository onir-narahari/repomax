'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

type TabId = 'resume' | 'linkedin' | 'x'

interface Props {
  content: string | string[]
  charLimit?: number
  empty?: boolean
  tabId?: TabId
}

const CARD_CLASS =
  'output-card relative overflow-hidden rounded-2xl border border-[#242B3A] bg-[#0D111C] shadow-[0_20px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)]'

const GHOST_BULLETS = [
  'Developed a real-time exchange simulator in Python using FastAPI and asyncio, featuring a limit order book with price-time priority matching and an inventory-aware market maker that adjusts quotes based on position risk.',
  'Implemented doubly-linked FIFO queues per price level for efficient order management, achieving O(1) order cancellation through node unlinking and immediate garbage collection of empty price levels.',
  'Optimized system performance with a ~44x runtime reduction on processing 100k orders by redesigning data structures, implementing bounded event storage, and suppressing unnecessary event payloads in benchmark mode.',
]

const GHOST_LINKEDIN = `I built a real-time exchange simulator that models price-time priority matching, market-making logic, and order lifecycle events through a FastAPI backend.

The hardest part wasn't the matching engine — it was keeping cancellations O(1) while the book stayed consistent under load.

If you're building market infra, start with the data structures before you touch the UI.`

const GHOST_X = `Built a limit order book simulator in Python.

FastAPI + asyncio, FIFO queues per price level, and an inventory-aware market maker.

~44x faster after restructuring the hot path.`

const BLUR_CLASS = 'pointer-events-none select-none blur-[6px]'

function GhostCopyButton() {
  return (
    <span
      className="flex items-center gap-1.5 rounded-full border border-[#242B3A] bg-[#111827] px-3 py-1.5 text-xs font-medium text-[#687386]"
      aria-hidden="true"
    >
      <Copy className="h-3 w-3" />
      Copy
    </span>
  )
}

function EmptyState({ tabId }: { tabId: TabId }) {
  if (tabId === 'resume') {
    return (
      <div className={CARD_CLASS} aria-label="Resume bullets preview — generate to reveal">
        <div className="flex items-center justify-between border-b border-[#242B3A] px-6 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#687386]">
            Resume Bullets
          </p>
          <GhostCopyButton />
        </div>
        <ul className="divide-y divide-[#242B3A] px-6">
          {GHOST_BULLETS.map((bullet, i) => (
            <li
              key={i}
              className="flex items-start gap-4 py-[1.125rem] first:pt-5 last:pb-5"
            >
              <span className="mt-[3px] min-w-[1.5rem] font-mono text-[11px] tabular-nums text-[#687386]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p
                className={`flex-1 text-[0.9375rem] leading-[1.65] text-[#F5F3EA]/90 ${BLUR_CLASS}`}
                aria-hidden="true"
              >
                {bullet}
              </p>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (tabId === 'linkedin') {
    return (
      <div className={CARD_CLASS} aria-label="LinkedIn post preview — generate to reveal">
        <div className="flex items-center justify-between border-b border-[#242B3A] px-6 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#687386]">
            LinkedIn Post
          </p>
          <div className={`flex items-center gap-3 ${BLUR_CLASS}`} aria-hidden="true">
            <span className="text-[11px] tabular-nums text-[#687386]">58 words</span>
            <GhostCopyButton />
          </div>
        </div>
        <div className={`px-6 py-6 ${BLUR_CLASS}`} aria-hidden="true">
          <p className="whitespace-pre-wrap text-[0.9375rem] leading-[1.75] text-[#F5F3EA]/90">
            {GHOST_LINKEDIN}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={CARD_CLASS} aria-label="X post preview — generate to reveal">
      <div className="flex items-center justify-between border-b border-[#242B3A] px-6 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#687386]">
          X Post
        </p>
        <div className={`flex items-center gap-3 ${BLUR_CLASS}`} aria-hidden="true">
          <span className="text-[11px] tabular-nums text-[#687386]">142 / 280</span>
          <GhostCopyButton />
        </div>
      </div>
      <div className={`px-6 py-6 ${BLUR_CLASS}`} aria-hidden="true">
        <p className="whitespace-pre-wrap text-[0.9375rem] font-[450] leading-[1.65] text-[#F5F3EA]/92">
          {GHOST_X}
        </p>
      </div>
    </div>
  )
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return { copied, copy }
}

function CopyButton({
  copied,
  onCopy,
  label,
}: {
  copied: boolean
  onCopy: () => void
  label: string
}) {
  return (
    <button
      onClick={onCopy}
      aria-label={copied ? 'Copied!' : label}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7AA7FF]/20 ${
        copied
          ? 'bg-emerald-500/15 text-emerald-300'
          : 'border border-[#242B3A] bg-[#111827] text-[#687386] hover:border-[#334155] hover:text-[#9AA3B5]'
      }`}
    >
      {copied ? (
        <><Check className="h-3 w-3" /> Copied</>
      ) : (
        <><Copy className="h-3 w-3" /> Copy</>
      )}
    </button>
  )
}

function BulletRow({ bullet, index }: { bullet: string; index: number }) {
  const { copied, copy } = useCopy(bullet)
  return (
    <li
      className="output-bullet group flex items-start gap-4 py-[1.125rem] first:pt-5 last:pb-5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span className="mt-[3px] min-w-[1.5rem] font-mono text-[11px] tabular-nums text-[#687386] select-none">
        {String(index + 1).padStart(2, '0')}
      </span>
      <p className="flex-1 text-[0.9375rem] leading-[1.65] text-[#F5F3EA]/90 transition-colors group-hover:text-[#F5F3EA]">
        {bullet}
      </p>
      <button
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy this bullet'}
        className="mt-[3px] shrink-0 rounded-md p-1.5 opacity-0 transition-all group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#7AA7FF]/20"
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-emerald-400" />
          : <Copy className="h-3.5 w-3.5 text-[#687386]" />}
      </button>
    </li>
  )
}

export default function OutputCard({
  content,
  charLimit,
  empty = false,
  tabId = 'resume',
}: Props) {
  const allText = Array.isArray(content) ? content.join('\n') : (content as string)
  const { copied, copy } = useCopy(allText)
  const charCount = typeof content === 'string' ? content.length : null
  const overLimit = charLimit !== undefined && charCount !== null && charCount > charLimit

  if (empty) return <EmptyState tabId={tabId} />

  if (tabId === 'resume' && Array.isArray(content)) {
    return (
      <div className={CARD_CLASS}>
        <div className="flex items-center justify-between border-b border-[#242B3A] px-6 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#687386]">
            Resume Bullets
          </p>
          <CopyButton copied={copied} onCopy={copy} label="Copy all bullets" />
        </div>
        <ul className="divide-y divide-[#242B3A] px-6">
          {content.map((bullet, i) => (
            <BulletRow key={i} bullet={bullet} index={i} />
          ))}
        </ul>
      </div>
    )
  }

  if (tabId === 'linkedin') {
    const wordCount =
      typeof content === 'string' ? content.split(/\s+/).filter(Boolean).length : 0
    return (
      <div className={CARD_CLASS}>
        <div className="flex items-center justify-between border-b border-[#242B3A] px-6 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#687386]">
            LinkedIn Post
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] tabular-nums text-[#687386]">{wordCount} words</span>
            <CopyButton copied={copied} onCopy={copy} label="Copy post" />
          </div>
        </div>
        <div className="output-panel-enter px-6 py-6">
          <p className="whitespace-pre-wrap text-[0.9375rem] leading-[1.75] text-[#F5F3EA]/90">
            {content as string}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between border-b border-[#242B3A] px-6 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#687386]">X Post</p>
        <div className="flex items-center gap-3">
          {charCount !== null && (
            <span
              className={`text-[11px] tabular-nums ${
                overLimit
                  ? 'text-red-400'
                  : charCount > 250
                    ? 'text-amber-400/70'
                    : 'text-[#687386]'
              }`}
            >
              {charCount} / {charLimit}
            </span>
          )}
          <CopyButton copied={copied} onCopy={copy} label="Copy post" />
        </div>
      </div>
      <div className="output-panel-enter px-6 py-6">
        <p className="whitespace-pre-wrap text-[0.9375rem] font-[450] leading-[1.65] text-[#F5F3EA]/92">
          {content as string}
        </p>
      </div>
    </div>
  )
}
