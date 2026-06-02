import Wordmark from '@/components/Wordmark'
import HeroBackground from '@/components/HeroBackground'
import HeroProductDemo from '@/components/hero/HeroProductDemo'
import HeroRepoForm from '@/components/hero/HeroRepoForm'
import HeroExampleLink from '@/components/hero/HeroExampleLink'

export default function LandingHero() {
  return (
    <section id="top" className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a1020]">
      <HeroBackground />

      <nav className="absolute inset-x-0 top-0 z-20 anim-in">
        <div className="mx-auto max-w-[82rem] px-6 sm:px-10 lg:px-12 xl:px-14">
          <div className="py-7 lg:py-8">
            <Wordmark className="text-xl font-bold tracking-tight text-[#F4F0E8] sm:text-2xl lg:text-[1.75rem]" />
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto flex w-full max-w-[82rem] flex-1 items-center justify-center px-6 py-24 sm:px-10 sm:py-28 lg:px-12 lg:py-32 xl:px-14">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          <div className="mx-auto w-full max-w-[34rem] lg:mx-0 lg:max-w-[36rem]">
            <h1
              className="anim-in mb-5 max-w-[34rem] text-balance"
              style={{ animationDelay: '100ms' }}
            >
              <span className="block text-[1.875rem] font-bold leading-[1.16] tracking-[-0.03em] text-white sm:text-[2.25rem] lg:text-[2.625rem]">
                You have{' '}
                <span className="tabular-nums text-blue-400">30 seconds</span>
                {' '}to impress a recruiter.
              </span>
              <span className="mt-2 block text-[1.875rem] font-bold leading-[1.16] tracking-[-0.03em] text-blue-400 sm:mt-2.5 sm:text-[2.25rem] lg:text-[2.625rem]">
                Test your repo.
              </span>
            </h1>

            <p
              className="max-w-[31rem] text-[1.0625rem] leading-[1.65] text-white/45 anim-in lg:text-[1.125rem]"
              style={{ animationDelay: '180ms' }}
            >
              Your commits deserve more than a GitHub link. Get a{' '}
              <span className="text-white/70">Repo Score</span>, feedback, and{' '}
              <span className="text-white/70">resume bullets</span> in seconds.
            </p>

            <HeroRepoForm />

            <div className="anim-in mt-3" style={{ animationDelay: '300ms' }}>
              <HeroExampleLink />
            </div>
          </div>

          <div className="flex justify-center lg:justify-center">
            <HeroProductDemo />
          </div>
        </div>
      </div>
    </section>
  )
}
