'use client'

import posthog from 'posthog-js'
import { useState } from 'react'
import { Check, Copy, FileCode2, Package, GitCommit } from 'lucide-react'
import type { ResumeBulletWithEvidence, BulletEvidence } from '@/types'

// ─── Normalisation helper ─────────────────────────────────────────────────────
//
// Accepts either legacy plain-string bullets (from old Supabase-saved scans) or
// the new { bullet, evidence[] } shape. Always returns the new shape so UI code
// only has one type to deal with.

export function normalizeBullet(raw: string | ResumeBulletWithEvidence): ResumeBulletWithEvidence {
  if (typeof raw === 'string') return { bullet: raw, evidence: [] }
  return {
    bullet: raw.bullet ?? '',
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  content: (string | ResumeBulletWithEvidence)[]
  empty?: boolean
  tabId?: 'resume'
  isAuthed?: boolean
  onRequireAuth?: (action: () => void) => void
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const CARD_CLASS =
  'output-card relative overflow-hidden rounded-2xl border border-[#242B3A] bg-[#0D111C] shadow-[0_20px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)]'

const GHOST_BULLETS: ResumeBulletWithEvidence[] = [
  {
    bullet: 'Developed a real-time exchange simulator in Python using FastAPI and asyncio, featuring a limit order book with price-time priority matching and an inventory-aware market maker that adjusts quotes based on position risk.',
    evidence: [],
  },
  {
    bullet: 'Implemented doubly-linked FIFO queues per price level for efficient order management, achieving O(1) order cancellation through node unlinking and immediate garbage collection of empty price levels.',
    evidence: [],
  },
  {
    bullet: 'Optimized system performance with a ~44x runtime reduction on processing 100k orders by redesigning data structures, implementing bounded event storage, and suppressing unnecessary event payloads in benchmark mode.',
    evidence: [],
  },
]

const BLUR_CLASS = 'pointer-events-none select-none blur-[6px]'

// ─── Evidence icon helper ─────────────────────────────────────────────────────

function EvidenceIcon({ type }: { type: BulletEvidence['type'] }) {
  const cls = 'h-2.5 w-2.5 shrink-0'
  if (type === 'dependency') return <Package className={cls} />
  if (type === 'commit') return <GitCommit className={cls} />
  return <FileCode2 className={cls} />
}

// ─── Evidence badges strip ────────────────────────────────────────────────────
// Rendered below each unlocked bullet. Uses existing muted text colours and
// border tokens — no new design system additions.

function EvidenceBadges({ evidence }: { evidence: BulletEvidence[] }) {
  if (!evidence || evidence.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Evidence">
      {evidence.map((e, i) => (
        <span
          key={i}
          title={`${e.type}: ${e.label}`}
          className="inline-flex items-center gap-1 rounded-md border border-[#1E2A3D] bg-[#0B1020] px-2 py-0.5 font-mono text-[10px] text-[#687386]"
        >
          <span className="text-emerald-500/70" aria-hidden>✓</span>
          <EvidenceIcon type={e.type} />
          <span className="truncate max-w-[160px]">{e.label}</span>
        </span>
      ))}
    </div>
  )
}

// ─── Ghost copy button ────────────────────────────────────────────────────────

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

// ─── Empty state ──────────────────────────────────────────────────────────────

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
        {GHOST_BULLETS.map((b, i) => (
          <li key={i} className="flex items-start gap-4 py-[1.125rem] first:pt-5 last:pb-5">
            <span className="mt-[3px] min-w-[1.5rem] font-mono text-[11px] tabular-nums text-[#687386]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p
              className={`flex-1 text-[0.9375rem] leading-[1.65] text-[#F5F3EA]/90 ${BLUR_CLASS}`}
              aria-hidden="true"
            >
              {b.bullet}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Copy hook ────────────────────────────────────────────────────────────────

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

// ─── Copy button ──────────────────────────────────────────────────────────────

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

// ─── Bullet row (unlocked) ────────────────────────────────────────────────────

function BulletRow({ item, index }: { item: ResumeBulletWithEvidence; index: number }) {
  const { copied, copy } = useCopy(item.bullet, 'resume_bullet_copied', { bullet_index: index })
  return (
    <li
      className="output-bullet group flex items-start gap-4 py-[1.125rem] first:pt-5 last:pb-5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span className="mt-[3px] min-w-[1.5rem] font-mono text-[11px] tabular-nums text-[#687386] select-none">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[0.9375rem] leading-[1.65] text-[#F5F3EA]/90 transition-colors group-hover:text-[#F5F3EA]">
          {item.bullet}
        </p>
        <EvidenceBadges evidence={item.evidence} />
      </div>
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

// ─── Locked bullet row ────────────────────────────────────────────────────────
// Evidence badges are intentionally hidden on locked rows — they appear only
// after the user unlocks, providing an additional incentive to sign in.

function LockedBulletRow({ item, index }: { item: ResumeBulletWithEvidence; index: number }) {
  return (
    <li className="flex items-start gap-4 py-[1.125rem] last:pb-5" aria-hidden="true">
      <span className="mt-[3px] min-w-[1.5rem] font-mono text-[11px] tabular-nums text-[#687386]">
        {String(index + 1).padStart(2, '0')}
      </span>
      <p className={`flex-1 text-[0.9375rem] leading-[1.65] text-[#F5F3EA]/90 ${BLUR_CLASS}`}>
        {item.bullet}
      </p>
    </li>
  )
}

// ─── Unlock overlay ───────────────────────────────────────────────────────────

function UnlockOverlay({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <button
        onClick={onUnlock}
        className="rounded-full bg-[#7AA7FF] px-7 py-3.5 text-[14px] font-semibold text-[#070A12] shadow-2xl shadow-black/50 transition hover:bg-[#93BBFF] hover:scale-[1.03]"
      >
        Unlock all bullets →
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OutputCard({ content, empty = false, isAuthed = true, onRequireAuth }: Props) {
  // Normalise every element into ResumeBulletWithEvidence regardless of source
  const items: ResumeBulletWithEvidence[] = content.map(normalizeBullet)

  const allBulletText = items.map((b) => b.bullet).join('\n')
  const { copied, copy } = useCopy(allBulletText, 'resume_bullets_copied', { bullet_count: items.length })

  if (empty) return <EmptyState />

  const locked = !isAuthed && items.length > 1
  const [first, ...rest] = items

  const handleUnlock = () => {
    posthog.capture('resume_bullets_unlock_clicked')
    onRequireAuth?.(() => {})
  }

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between border-b border-[#242B3A] px-6 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#687386]">
          Resume Bullets
        </p>
        {!locked && <CopyButton copied={copied} onCopy={copy} label="Copy all bullets" />}
      </div>

      {locked ? (
        <>
          <ul className="divide-y divide-[#242B3A] px-6">
            <BulletRow item={first} index={0} />
          </ul>
          <div className="relative border-t border-[#242B3A]">
            <ul className="divide-y divide-[#242B3A] px-6">
              {rest.map((item, i) => (
                <LockedBulletRow key={i} item={item} index={i + 1} />
              ))}
            </ul>
            <UnlockOverlay onUnlock={handleUnlock} />
          </div>
        </>
      ) : (
        <ul className="divide-y divide-[#242B3A] px-6">
          {items.map((item, i) => (
            <BulletRow key={i} item={item} index={i} />
          ))}
        </ul>
      )}
    </div>
  )
}
