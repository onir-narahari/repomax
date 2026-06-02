import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import HeroBackground from '@/components/HeroBackground'
import StaticScorePreview from '@/components/hero/StaticScorePreview'

export default function LandingHero() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a1020]">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-[82rem] flex-1 flex-col px-6 sm:px-10 lg:px-12 xl:px-14">
        <nav className="py-7 lg:py-8 anim-in">
          <Wordmark className="text-lg font-bold tracking-tight text-[#F4F0E8] sm:text-xl" />
        </nav>

        <div className="flex flex-1 items-center pb-16 pt-4 lg:pb-20 lg:pt-0">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-x-16 xl:gap-x-20">
            <div className="max-w-[38rem] lg:max-w-[34rem] xl:max-w-[38rem]">
              <h1
                className="mb-5 text-[2.375rem] font-bold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.75rem] lg:text-[3rem] anim-in"
                style={{ animationDelay: '100ms' }}
              >
                See your repo the way{' '}
                <span className="font-display italic text-blue-400">a recruiter does.</span>
              </h1>

              <p
                className="mb-8 max-w-[32rem] text-[1.0625rem] leading-[1.7] text-white/45 anim-in lg:mb-10 lg:text-[1.125rem]"
                style={{ animationDelay: '180ms' }}
              >
                Paste a public repo. Get a{' '}
                <span className="text-white/70">Repo Score</span> across 6 categories and{' '}
                <span className="text-white/70">3 resume bullets</span> grounded in what you built.
              </p>

              <div className="anim-in" style={{ animationDelay: '260ms' }}>
                <Link
                  href="/generate"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_0_36px_rgba(59,130,246,0.42)] active:scale-[0.98]"
                >
                  Get your Repo Score →
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex lg:items-center lg:justify-end" aria-hidden="true">
              <StaticScorePreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
