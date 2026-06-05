'use client'

import posthog from 'posthog-js'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface Props {
  content: string[]
  empty?: boolean
  tabId?: 'resume'
}

const CARD_CLASS =
  'output-card relative overflow-hidden rounded-2xl border border-[#242B3A] bg-[#0D111C] shadow-[0_20px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)]'

const GHOST_BULLETS = [
  'Developed a real-time exchange simulator in Python using FastAPI and asyncio, featuring a limit order book with price-time priority matching and an inventory-aware market maker that adjusts quotes based on position risk.',
  'Implemented doubly-linked FIFO queues per price level for efficient order management, achieving O(1) order cancellation through node unlinking and immediate garbage collection of empty price levels.',
  'Optimized system performance with a ~44x runtime reduction on processing 100k orders by redesigning data structures, implementing bounded event storage, and suppressing unnecessary event payloads in benchmark mode.',
]

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

function EmptyState() {
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
          <li key={i} className="flex items-start gap-4 py-[1.125rem] first:pt-5 last:pb-5">
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

function useCopy(text: string, eventName: string, extraProps?: Record<string, unknown>) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      posthog.capture(eventName, extraProps)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return { copied, copy }
}

function CopyButton({ copied, onCopy, label }: { copied: boolean; onCopy: () => void; label: string }) {
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
  const { copied, copy } = useCopy(bullet, 'resume_bullet_copied', { bullet_index: index })
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

export default function OutputCard({ content, empty = false }: Props) {
  const allText = content.join('\n')
  const { copied, copy } = useCopy(allText, 'resume_bullets_copied', { bullet_count: content.length })

  if (empty) return <EmptyState />

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
