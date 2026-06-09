'use client'

export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#131929]" />

      {/* Purple bloom beneath the CTA */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 108%, rgba(167,139,250,0.22) 0%, rgba(167,139,250,0.06) 55%, transparent 72%)',
        }}
      />

      {/* Tighter inner glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 35% 22% at 50% 108%, rgba(167,139,250,0.16) 0%, transparent 60%)',
        }}
      />

      {/* Left edge flare */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 40% 50% at -5% 80%, rgba(56,217,255,0.05) 0%, transparent 65%)',
        }}
      />

      {/* Right edge flare */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 40% 50% at 105% 80%, rgba(167,139,250,0.05) 0%, transparent 65%)',
        }}
      />

      {/* Top fade */}
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, rgba(19,25,41,0.95) 0%, transparent 100%)',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  )
}
