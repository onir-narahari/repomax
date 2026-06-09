export default function HeroDemoPreview() {
  return (
    <div className="relative w-full">
      {/* Glow behind the card */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-12 h-32"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(167,139,250,0.16) 0%, transparent 70%)',
        }}
      />

      {/* Browser chrome — rounded top, no bottom border, bleeds below fold */}
      <div
        className="relative overflow-hidden rounded-t-xl border border-b-0 border-white/10"
        style={{
          background: 'rgba(12,14,8,0.97)',
          boxShadow: '0 -4px 40px rgba(167,139,250,0.14), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.025] px-4 py-2.5">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1">
              <span className="font-mono text-[11px] text-white/30">
                /analyze/alexchen/my-portfolio
              </span>
            </div>
          </div>
          <div className="hidden w-16 shrink-0 sm:block" />
        </div>

        {/* Side-by-side split */}
        <div className="relative flex h-[360px] sm:h-[440px]">
          {/* LEFT — Before */}
          <div className="flex w-1/2 flex-col border-r border-white/[0.06]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-red-500/[0.04] px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-red-400/70">
                Before RepoMax
              </span>
              <span className="ml-auto rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-red-400">
                31/100
              </span>
            </div>
            <div className="flex-1 overflow-hidden p-4 font-mono text-[12px] leading-relaxed">
              <p className="mb-1 font-semibold text-white/50"># my-portfolio</p>
              <p className="mb-3 text-white/30">This is my portfolio website. Built with React.</p>
              <p className="mb-0.5 text-white/20">## How to run</p>
              <p className="mb-3 text-white/25">npm start</p>
              <p className="mb-0.5 text-white/15">## License</p>
              <p className="text-white/15">MIT</p>
              <div className="mt-4 space-y-1.5">
                {[
                  'No demo link or live URL',
                  'Missing tech stack section',
                  'No install instructions',
                  'README is 4 lines',
                ].map((gap) => (
                  <div key={gap} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                    <span className="text-[10px] text-red-400/50">{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER DIVIDER */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <div className="h-full w-px bg-white/[0.06]" />
            <div
              className="absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 text-xs font-bold text-white/60"
              style={{
                background: 'rgba(12,14,8,0.97)',
                boxShadow: '0 0 0 4px rgba(12,14,8,0.97)',
              }}
            >
              R
            </div>
          </div>

          {/* RIGHT — After */}
          <div className="flex w-1/2 flex-col">
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-green-500/[0.04] px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-green-400/70">
                After RepoMax
              </span>
              <span className="ml-auto rounded bg-green-500/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-green-400">
                87/100
              </span>
            </div>
            <div className="flex-1 overflow-hidden p-4 font-mono text-[12px] leading-relaxed">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {['React', 'Tailwind', 'Vercel'].map((t) => (
                  <span
                    key={t}
                    className="rounded bg-[#A78BFA]/15 px-1.5 py-0.5 text-[9px] text-[#A78BFA]/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mb-1 font-semibold text-white/80"># my-portfolio</p>
              <p className="mb-2 text-white/50">
                Responsive portfolio built with React 18 and Tailwind CSS. Dark mode, dynamic
                filtering, deployed on Vercel.
              </p>
              <p className="mb-2 text-[#2EE6A6]/80">🔗 my-portfolio.vercel.app</p>
              <p className="mb-0.5 text-white/30">## Tech Stack</p>
              <p className="mb-2 text-white/30">React · Tailwind · Framer Motion</p>
              <p className="mb-0.5 text-white/30">## Getting Started</p>
              <p className="text-white/30">npm install &amp;&amp; npm run dev</p>
              <div className="mt-3 space-y-1.5">
                {['Live demo link added', 'Full tech stack listed', 'Install steps included'].map(
                  (win) => (
                    <div key={win} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-green-400/60" />
                      <span className="text-[10px] text-green-400/50">{win}</span>
                    </div>
                  ),
                )}
              </div>
              <div className="mt-3 rounded border border-white/[0.07] bg-white/[0.03] p-2.5">
                <p className="mb-1 text-[9px] uppercase tracking-widest text-white/20">
                  Resume bullet
                </p>
                <p className="text-[10px] leading-relaxed text-white/45">
                  Built responsive portfolio with React 18 and Tailwind CSS, implementing dynamic
                  project filtering and dark mode
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
