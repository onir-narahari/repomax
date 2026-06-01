const STEPS = [
  {
    number: '01',
    title: 'Paste your GitHub repo',
    description: 'Drop in any public repo URL. Nothing to install, no signup required.',
  },
  {
    number: '02',
    title: 'ShipToHire reads the project',
    description:
      'We analyze the README, file structure, languages, and dependencies — grounding every claim in what you actually built.',
  },
  {
    number: '03',
    title: 'Copy and use immediately',
    description:
      'Get three resume bullets, a LinkedIn post, and an X post — ready to paste, no editing required.',
  },
]

export default function HowItWorks() {
  return (
    <div className="w-full max-w-2xl">
      <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-[#F4F0E8]/30">
        How it works
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="rounded-xl border border-[#F4F0E8]/8 bg-[#F4F0E8]/[0.02] p-4"
          >
            <span className="mb-2 block font-display italic text-xl font-bold text-blue-400/60">
              {step.number}
            </span>
            <p className="mb-1 text-sm font-semibold text-[#F4F0E8]/80">{step.title}</p>
            <p className="text-xs leading-relaxed text-[#F4F0E8]/40">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
