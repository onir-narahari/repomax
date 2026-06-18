import Wordmark from '@/components/Wordmark'
import HeroBackground from '@/components/HeroBackground'
import HeroRepoForm from '@/components/hero/HeroRepoForm'
import ReposScoredNavBadge from '@/components/ReposScoredNavBadge'
import { heroFormMax, pageMax, pageX } from '@/lib/landing-layout'
import { cn } from '@/lib/utils'

export default function LandingHero() {
  return (
    <section
      id="top"
      className="relative flex min-h-dvh flex-col overflow-visible bg-[#131929]"
    >
      <HeroBackground />

      <nav className="relative z-20 shrink-0 anim-in">
        <div className={cn('w-full', pageMax, pageX)}>
          <div className="flex items-center justify-between py-5 lg:py-6">
            <Wordmark className="text-xl font-bold tracking-tight text-[#F8FAFC] sm:text-2xl lg:text-[1.75rem]" />
            <div className="flex items-center gap-2">
              <ReposScoredNavBadge />
              <span className="rounded-full border border-[#303A55] px-3 py-1 text-xs text-[#A7B0C3]">
                Free — no account needed
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* flex-1 centers content; pb shifts visual center up slightly above midpoint */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center pb-20 sm:pb-28">
        <div
          className={cn(
            'flex w-full flex-col items-center text-center gap-6 sm:gap-8',
            pageMax,
            pageX,
          )}
        >
          <h1
            className="anim-in flex w-full flex-col gap-1.5"
            style={{ animationDelay: '100ms' }}
          >
            <span className="text-[2rem] font-bold leading-[0.88] tracking-[-0.03em] text-[#F8FAFC] sm:text-[2.75rem] lg:text-[3.25rem]">
              Your repo is{' '}
              <span className="text-[#ff3b3b]">
                losing
              </span>
            </span>
            <span className="text-[2rem] font-bold leading-[0.88] tracking-[-0.03em] text-[#F8FAFC] sm:text-[2.75rem] lg:text-[3.25rem]">
              you interviews.
            </span>
          </h1>

          <p
            className="anim-in max-w-md text-sm leading-relaxed text-[#A7B0C3]"
            style={{ animationDelay: '180ms' }}
          >
            Most repos score under 55. Paste yours and see exactly what&apos;s costing you interviews.
          </p>

          <div className={cn('anim-in', heroFormMax)} style={{ animationDelay: '225ms' }}>
            <HeroRepoForm />
          </div>
        </div>
      </div>
    </section>
  )
}
