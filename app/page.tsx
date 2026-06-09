import LandingHero from '@/components/LandingHero'
import HomePageSections from '@/components/HomePageSections'

export default function Home() {
  return (
    <main className="flex flex-col bg-[#131929]">
      <LandingHero />
      <HomePageSections />
      <footer className="bg-[#131929] border-t border-[#303A55] px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#A7B0C3]/60">
            © {new Date().getFullYear()} RepoMax
          </span>
          <div className="flex items-center gap-4 text-xs text-[#A7B0C3]/60">
            <a href="/privacy" className="hover:text-[#F8FAFC] transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#F8FAFC] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
