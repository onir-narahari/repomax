'use client'

export default function GenerateBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden bg-[#070A12]"
      aria-hidden="true"
    >
      {/* Elevated workspace — soft surface behind the main column */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 82% 62% at 50% 44%, rgba(13, 17, 28, 0.92) 0%, rgba(13, 17, 28, 0.42) 48%, transparent 74%),
            radial-gradient(ellipse 55% 40% at 50% 38%, rgba(17, 24, 39, 0.55) 0%, transparent 68%)
          `,
        }}
      />

      {/* Accent bloom — ties headline + input to the surface */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 48% 36% at 50% 36%, rgba(122, 167, 255, 0.08) 0%, rgba(122, 167, 255, 0.02) 50%, transparent 72%)',
        }}
      />

      {/* Structure grid — visible but quiet */}
      <div className="gen-grid absolute inset-0" />

      {/* Ruled lines — editorial document feel */}
      <div
        className="absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245, 243, 234, 0.35) 1px, transparent 1px)',
          backgroundSize: '100% 3.5rem',
          maskImage:
            'radial-gradient(ellipse 72% 58% at 50% 46%, black 12%, transparent 78%)',
        }}
      />

      {/* Slow ambient drift — no purple, no neon */}
      <div className="gen-orb gen-orb-a absolute left-[18%] top-[12%] h-[340px] w-[340px] rounded-full bg-[#7AA7FF]/[0.05] blur-[100px]" />
      <div className="gen-orb gen-orb-b absolute bottom-[8%] right-[12%] h-[280px] w-[280px] rounded-full bg-[#F5F3EA]/[0.025] blur-[90px]" />

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 95% 85% at 50% 45%, transparent 32%, rgba(7, 10, 18, 0.72) 100%),
            linear-gradient(to bottom, rgba(7, 10, 18, 0.35) 0%, transparent 18%, transparent 82%, rgba(7, 10, 18, 0.45) 100%)
          `,
        }}
      />
    </div>
  )
}
