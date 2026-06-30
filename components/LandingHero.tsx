import Wordmark from '@/components/Wordmark'
import HeroBackground from '@/components/HeroBackground'
import HeroRepoForm from '@/components/hero/HeroRepoForm'
import ProfileButton from '@/components/ProfileButton'
import { heroFormMax, pageMax, pageX } from '@/lib/landing-layout'
import { cn } from '@/lib/utils'

export default function LandingHero() {
  return (
    <section
      id="top"
      className="relative flex min-h-dvh flex-col overflow-visible bg-[#131929]"
    >
      <HeroBackground />

      <nav className="relative z-20 shrink-0 border-b border-white/[0.06] bg-[#131929]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 sm:px-8">
          <Wordmark className="text-lg font-bold tracking-tight text-[#F8FAFC] sm:text-xl" />
          <ProfileButton />
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
            <span className="text-[2rem] font-bold leading-[0.9] tracking-[-0.03em] text-[#F8FAFC] sm:text-[2.75rem] lg:text-[3.25rem]">
              Turn your GitHub repo
            </span>
            <span className="text-[2rem] font-bold leading-[0.9] tracking-[-0.03em] text-[#F8FAFC] sm:text-[2.75rem] lg:text-[3.25rem]">
              into your <span className="text-red-400">next opportunity</span>.
            </span>
          </h1>

          <p
            className="anim-in max-w-sm text-[0.9375rem] sm:text-base leading-relaxed text-[#A7B0C3]"
            style={{ animationDelay: '180ms' }}
          >
            Paste a public repo. Get a score, specific gaps, and resume bullets.
          </p>

          <div className={cn('anim-in', heroFormMax)} style={{ animationDelay: '225ms' }}>
            <HeroRepoForm />
          </div>
        </div>
      </div>
    </section>
  )
}
