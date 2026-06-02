'use client'

const BLUR_CLASS = 'pointer-events-none select-none blur-[6px]'

const GHOST_SUMMARY =
  'Strong matching-engine implementation and clear architecture signals, but setup friction and thin test coverage keep this repo from reading as internship-ready at first glance.'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#242B3A] bg-[#0D111C]">
      {children}
    </div>
  )
}

export default function RepoScoreCardGhost() {
  return (
    <div aria-label="Repo review preview — generate to reveal">
    <Card>
      <div className="px-6 py-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#F5F3EA]">Repo Review</h2>
            <p className={`mt-0.5 font-mono text-xs text-[#687386] ${BLUR_CLASS}`} aria-hidden="true">
              owner/exchange-simulator
            </p>
            <p className="mt-0.5 text-[11px] text-[#687386]">Paste a repo to unlock your score</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400 ${BLUR_CLASS}`}
            aria-hidden="true"
          >
            Solid but improvable
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className={`flex items-baseline gap-1 ${BLUR_CLASS}`} aria-hidden="true">
            <span className="text-6xl font-bold tabular-nums leading-none tracking-tight text-amber-400">
              74
            </span>
            <span className="text-2xl font-light text-[#687386]">/100</span>
          </div>
          <p className={`max-w-lg text-sm leading-relaxed text-[#9AA3B5] ${BLUR_CLASS}`} aria-hidden="true">
            {GHOST_SUMMARY}
          </p>
        </div>
      </div>
    </Card>
    </div>
  )
}
