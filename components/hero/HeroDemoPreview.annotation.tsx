type EditAnnotation = {
  n: number
  dotBg: string
  dotText: string
  borderColor: string
  bgColor: string
  label: string
  fix: string
}

const EDITS: EditAnnotation[] = [
  {
    n: 1,
    dotBg: 'bg-amber-400/20',
    dotText: 'text-amber-300',
    borderColor: 'border-amber-400/50',
    bgColor: 'bg-amber-400/[0.06]',
    label: 'No project tagline',
    fix: 'One line tells recruiters exactly what you built',
  },
  {
    n: 2,
    dotBg: 'bg-red-400/20',
    dotText: 'text-red-300',
    borderColor: 'border-red-400/50',
    bgColor: 'bg-red-400/[0.06]',
    label: 'No live demo link',
    fix: 'Proof it ships = recruiter forwards it',
  },
  {
    n: 3,
    dotBg: 'bg-orange-400/20',
    dotText: 'text-orange-300',
    borderColor: 'border-orange-400/50',
    bgColor: 'bg-orange-400/[0.06]',
    label: '1-line setup',
    fix: 'Full steps show it actually runs',
  },
  {
    n: 4,
    dotBg: 'bg-rose-400/20',
    dotText: 'text-rose-300',
    borderColor: 'border-rose-400/50',
    bgColor: 'bg-rose-400/[0.06]',
    label: 'No tech stack listed',
    fix: 'ATS cannot parse your skills without it',
  },
]

function AnnotationChip({ edit }: { edit: EditAnnotation }) {
  return (
    <div className="w-full rounded-lg border border-white/[0.08] bg-white/[0.025] p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${edit.dotBg} ${edit.dotText}`}
        >
          {edit.n}
        </span>
        <span className="text-[10px] font-medium leading-tight text-red-400/70">{edit.label}</span>
      </div>
      <p className="text-[10px] leading-snug text-white/50">
        <span className="text-[#2EE6A6]/80">→</span> {edit.fix}
      </p>
    </div>
  )
}

export default function HeroDemoPreview() {
  return (
    <div className="relative w-full">
      {/* Glow behind the card */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-12 h-32"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(167,139,250,0.16) 0%, transparent 70%)',
        }}
      />

      {/* Browser chrome */}
      <div
        className="relative overflow-hidden rounded-t-xl border border-b-0 border-white/10"
        style={{
          background: 'rgba(10,12,8,0.98)',
          boxShadow: '0 -4px 40px rgba(167,139,250,0.14), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.025] px-4 py-2.5">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div className="flex min-w-0 items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1">
              <span className="truncate font-mono text-[11px] text-white/30">
                github.com/alexchen/my-portfolio
              </span>
            </div>
          </div>

          {/* Score transformation badge */}
          <div className="flex shrink-0 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.025] px-2.5 py-1">
            <span className="font-mono text-[10px] font-bold text-red-400">31</span>
            <span className="font-mono text-[9px] text-white/20">/100</span>
            <span className="mx-0.5 font-mono text-[10px] text-white/25">→</span>
            <span className="font-mono text-[10px] font-bold text-green-400">87</span>
            <span className="font-mono text-[9px] text-white/20">/100</span>
            <span className="ml-1.5 rounded bg-[#2EE6A6]/20 px-1.5 py-0.5 text-[8px] font-bold text-[#2EE6A6]">
              +56
            </span>
          </div>
        </div>

        {/* GitHub repo header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] bg-white/[0.012] px-4 py-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="shrink-0 text-white/25"
          >
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z" />
          </svg>
          <span className="text-[12px] text-white/35">alexchen /</span>
          <span className="text-[12px] font-semibold text-white/65">my-portfolio</span>
          <div className="ml-auto flex items-center gap-3 text-[11px] text-white/20">
            <span>⭐ 0</span>
            <span>🍴 0</span>
          </div>
        </div>

        {/* README tab */}
        <div className="flex shrink-0 items-center border-b border-white/[0.05] bg-white/[0.008] px-4 py-1.5">
          <span className="font-mono text-[10px] text-white/25">📄 README.md</span>
        </div>

        {/* 4 annotated rows */}
        <div className="flex h-[420px] sm:h-[480px] flex-col overflow-hidden">

          {/* Row 1: Title + description (amber) */}
          <div className="flex flex-1 border-b border-white/[0.04]">
            <div
              className={`min-w-0 flex-1 overflow-hidden border-l-[3px] px-4 py-3 ${EDITS[0].borderColor} ${EDITS[0].bgColor}`}
            >
              <p className="mb-0.5 font-mono text-[13px] font-semibold text-white/65">
                # my-portfolio
              </p>
              <p className="font-mono text-[11px] leading-relaxed text-white/30">
                This is my portfolio website. Built with React.
              </p>
            </div>
            <div className="hidden w-[210px] shrink-0 items-center border-l border-white/[0.04] px-3 sm:flex">
              <AnnotationChip edit={EDITS[0]} />
            </div>
          </div>

          {/* Row 2: No demo link (red) */}
          <div className="flex flex-1 border-b border-white/[0.04]">
            <div
              className={`min-w-0 flex-1 overflow-hidden border-l-[3px] px-4 py-3 ${EDITS[1].borderColor} ${EDITS[1].bgColor}`}
            >
              <p className="mb-0.5 font-mono text-[11px] italic text-white/20">
                — no demo link or live URL —
              </p>
              <p className="font-mono text-[10px] text-white/15">README is 4 lines total</p>
            </div>
            <div className="hidden w-[210px] shrink-0 items-center border-l border-white/[0.04] px-3 sm:flex">
              <AnnotationChip edit={EDITS[1]} />
            </div>
          </div>

          {/* Row 3: Sparse setup (orange) */}
          <div className="flex flex-1 border-b border-white/[0.04]">
            <div
              className={`min-w-0 flex-1 overflow-hidden border-l-[3px] px-4 py-3 ${EDITS[2].borderColor} ${EDITS[2].bgColor}`}
            >
              <p className="mb-1 font-mono text-[11px] font-semibold text-white/35">
                ## How to run
              </p>
              <p className="font-mono text-[11px] text-white/25">npm start</p>
            </div>
            <div className="hidden w-[210px] shrink-0 items-center border-l border-white/[0.04] px-3 sm:flex">
              <AnnotationChip edit={EDITS[2]} />
            </div>
          </div>

          {/* Row 4: License / no tech stack (rose) */}
          <div className="flex flex-1">
            <div
              className={`min-w-0 flex-1 overflow-hidden border-l-[3px] px-4 py-3 ${EDITS[3].borderColor} ${EDITS[3].bgColor}`}
            >
              <p className="mb-1 font-mono text-[11px] font-semibold text-white/30">## License</p>
              <p className="font-mono text-[11px] text-white/20">MIT</p>
            </div>
            <div className="hidden w-[210px] shrink-0 items-center border-l border-white/[0.04] px-3 sm:flex">
              <AnnotationChip edit={EDITS[3]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
