import LandingHero from '@/components/LandingHero'
import HomeInteractiveSection from '@/components/HomeInteractiveSection'

export default function Home() {
  return (
    <main className="flex flex-col bg-[#0a1020]">
      <LandingHero />
      <HomeInteractiveSection />
    </main>
  )
}
