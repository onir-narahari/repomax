import LandingHero from '@/components/LandingHero'
import SimulatedDemoSection from '@/components/SimulatedDemoSection'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#0a1020]">
      <LandingHero />
      <SimulatedDemoSection />
    </main>
  )
}
