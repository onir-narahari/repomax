'use client'

import HeroUiCollage from '@/components/hero/HeroUiCollage'

export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#0A0A0F]" />

      {/* Ghosted product-UI collage — scattered repo scores, job matches, gap flags */}
      <HeroUiCollage />

      {/* Top fade — keeps nav legible against the collage */}
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,10,15,0.9) 0%, transparent 100%)',
        }}
      />

      {/* Bottom fade — settles the collage before the next section */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, transparent 100%)',
        }}
      />

      {/* Noise texture — subtle grain for a premium, non-flat feel */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  )
}
