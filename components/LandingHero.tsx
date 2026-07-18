import Wordmark from '@/components/Wordmark'
import HeroBackground from '@/components/HeroBackground'
import HeroGithubCta from '@/components/hero/HeroGithubCta'
import ProfileButton from '@/components/ProfileButton'

export default function LandingHero() {
  return (
    <section
      id="top"
      className="relative flex min-h-dvh flex-col overflow-visible bg-[#0A0A0F]"
    >
      <HeroBackground />

      <nav className="relative z-20 shrink-0 border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <Wordmark className="text-lg font-bold tracking-tight text-[#F8FAFC] sm:text-xl" />
          <ProfileButton />
        </div>
      </nav>

      <div className="relative z-10 flex flex-1 flex-col justify-center pb-20 sm:pb-28">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <h1
              className="anim-in flex flex-col gap-0.5 sm:gap-1"
              style={{ animationDelay: '100ms' }}
            >
              <span className="text-[2.5rem] font-bold leading-[0.95] tracking-[-0.03em] text-[#F8FAFC] sm:text-[3.25rem] lg:text-[4.25rem] xl:text-[5rem]">
                Make your GitHub
              </span>
              <span className="text-[2.5rem] font-bold leading-[0.95] tracking-[-0.03em] text-[#F8FAFC] sm:text-[3.25rem] lg:text-[4.25rem] xl:text-[5rem]">
                get you <span className="text-[#EC4899]">hired</span>.
              </span>
            </h1>

            <p
              className="anim-in mt-6 max-w-lg text-base leading-relaxed text-[#A0A5B0] sm:mt-7 sm:text-lg"
              style={{ animationDelay: '160ms' }}
            >
              A Repo Score with specific gaps, plus 3 matched jobs in your inbox every day at noon.
            </p>

            <div className="anim-in mt-8 sm:mt-9" style={{ animationDelay: '210ms' }}>
              <HeroGithubCta size="lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
