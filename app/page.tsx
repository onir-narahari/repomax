import LandingHero from '@/components/LandingHero'
import HomeReadmeLiveEdit from '@/components/HomeReadmeLiveEdit'
import HomePageSections, { ProofStats } from '@/components/HomePageSections'
import { footerSectionBg } from '@/lib/landing-layout'

export default function Home() {
  return (
    <main className="flex flex-col bg-[#0A0A0F]">
      <LandingHero />
      <HomeReadmeLiveEdit />
      <HomePageSections />
      <ProofStats />
      <footer className={`${footerSectionBg} border-t border-white/[0.06] px-6 py-10 sm:px-8 sm:py-12`}>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:gap-3 sm:text-left">
          <span className="text-[13px] font-medium tracking-[-0.01em] text-[#8A8F9C]">
            © {new Date().getFullYear()} RepoMax
          </span>
          <div className="flex items-center gap-6 text-[13px] text-[#8A8F9C]">
            <a href="/privacy" className="transition-colors hover:text-[#F8FAFC]">Privacy</a>
            <a href="/terms" className="transition-colors hover:text-[#F8FAFC]">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
