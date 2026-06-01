import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import HeroBackground from '@/components/HeroBackground'

export default function LandingHero() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a1020]">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-[82rem] flex-1 flex-col px-6 sm:px-10 lg:px-12 xl:px-14">
        <nav className="py-7 lg:py-8 anim-in">
          <Wordmark className="text-lg font-bold tracking-tight text-[#F4F0E8] sm:text-xl" />
        </nav>

        <div className="flex flex-1 items-center pb-16 pt-4 lg:pb-20 lg:pt-0">
          <div className="grid w-full grid-cols-1 items-center lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
            <div className="max-w-[38rem] lg:max-w-[34rem] xl:max-w-[38rem] lg:pr-6 xl:pr-10">
              <h1
                className="mb-6 text-[2.625rem] font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.875rem] lg:text-[3.125rem] xl:text-[3.375rem] anim-in"
                style={{ animationDelay: '100ms' }}
              >
                Turn your repo into<br />
                a story that gets you{' '}
                <span className="font-display italic text-blue-400">hired.</span>
              </h1>

              <p
                className="mb-10 max-w-[34rem] text-[1.0625rem] leading-[1.7] text-white/45 anim-in lg:text-[1.125rem]"
                style={{ animationDelay: '180ms' }}
              >
                Join 100+ users in &ldquo;turning repos into stories that get you
                hired,&rdquo; grounded in what you actually shipped.
              </p>

              <div className="anim-in" style={{ animationDelay: '260ms' }}>
                <Link
                  href="/generate"
                  className="inline-flex w-fit items-center gap-2.5 rounded-full bg-blue-600 px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_0_36px_rgba(59,130,246,0.42)] active:scale-[0.98]"
                >
                  Try it on your repo
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className="hidden min-h-[480px] lg:block" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}
