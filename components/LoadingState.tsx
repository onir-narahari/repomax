'use client'

import { useEffect, useState } from 'react'

const LABELS = [
  'Reading your repository…',
  'Extracting project signals…',
  'Writing resume bullets…',
  'Polishing your story…',
]

function RotatingLabel() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % LABELS.length), 2200)
    return () => clearInterval(id)
  }, [])
  return (
    <p key={i} className="loading-label text-[11px] text-[#687386]">
      {LABELS[i]}
    </p>
  )
}

export default function LoadingState() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#242B3A] bg-[#0D111C] shadow-[0_20px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)]"
      aria-live="polite"
      aria-label="Generating your project story"
    >
      <div className="flex items-center justify-between border-b border-[#242B3A] px-6 py-3.5">
        <div className="skeleton-shimmer h-2.5 w-28 rounded-full" />
        <div className="skeleton-shimmer h-7 w-20 rounded-full" />
      </div>

      <div className="divide-y divide-[#242B3A] px-6">
        {[88, 72, 80].map((pct, i) => (
          <div key={i} className="flex items-start gap-4 py-[1.125rem]">
            <div className="skeleton-shimmer mt-2 h-2 w-4 rounded-full" />
            <div className="flex-1 space-y-2.5 py-0.5">
              <div className="skeleton-shimmer h-2.5 rounded-full" style={{ width: `${pct}%` }} />
              <div className="skeleton-shimmer h-2.5 rounded-full" style={{ width: `${pct - 18}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#242B3A] px-6 py-3">
        <RotatingLabel />
      </div>
    </div>
  )
}
