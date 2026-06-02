'use client'

import ContributionGrid from '@/components/hero/ContributionGrid'

export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0a1020]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 65% at 82% 48%, rgba(37,99,235,0.13) 0%, rgba(37,99,235,0.04) 50%, transparent 72%)',
        }}
      />

      <ContributionGrid />

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(10,16,32,0.62) 0%, rgba(10,16,32,0.48) 32%, rgba(10,16,32,0.22) 46%, rgba(10,16,32,0.08) 58%, transparent 72%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 50%, transparent 45%, rgba(10,16,32,0.28) 100%)',
        }}
      />

      <div
        className="absolute inset-x-0 top-0 h-24"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,16,32,0.85) 0%, transparent 100%)',
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-20"
        style={{
          background: 'linear-gradient(to top, rgba(10,16,32,0.80) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}
