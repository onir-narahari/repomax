import LandingHero from '@/components/LandingHero'
import HomeReadmeLiveEdit from '@/components/HomeReadmeLiveEdit'
import HomePageSections, { TestimonialsCarousel } from '@/components/HomePageSections'
import { footerSectionBg } from '@/lib/landing-layout'

export default function Home() {
  return (
    <main className="flex flex-col bg-[#131929]">
      <LandingHero />
      <HomeReadmeLiveEdit />
      <HomePageSections />
      <TestimonialsCarousel />
      <footer className={`${footerSectionBg} border-t border-[#2f3a52] px-6 py-8`}>
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#8B9CC4]">
            © {new Date().getFullYear()} RepoMax
          </span>
          <div className="flex items-center gap-4 text-xs text-[#8B9CC4]">
            <a href="/privacy" className="hover:text-[#F8FAFC] transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#F8FAFC] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
