import DemoSimulation from '@/components/DemoSimulation'

export default function SimulatedDemoSection() {
  return (
    <section
      id="demo"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#030712] px-4 py-12 sm:px-8 sm:py-16 lg:px-12"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 75% 50%, rgba(37,99,235,0.08) 0%, transparent 60%)',
          }}
        />
        <svg
          className="absolute right-[-10%] top-1/2 h-[min(80vw,600px)] w-[min(80vw,600px)] -translate-y-1/2 opacity-[0.08]"
          viewBox="0 0 600 600"
          fill="none"
        >
          {[260, 200, 140].map((r) => (
            <ellipse
              key={r}
              cx="300"
              cy="300"
              rx={r}
              ry={r * 0.42}
              stroke="rgba(96,165,250,0.6)"
              strokeWidth="1"
            />
          ))}
        </svg>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 80% at 50% 50%, transparent 0%, rgba(3,7,18,0.5) 70%, rgba(3,7,18,0.95) 100%)',
          }}
        />
      </div>

      <DemoSimulation />
    </section>
  )
}
