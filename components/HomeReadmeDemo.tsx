'use client'

import HeroRepoForm from '@/components/hero/HeroRepoForm'

const BEFORE_LINES = `# my-project

## Tech Stack
- Python
- TensorFlow
- Flask
- React

## Installation
Clone the repo and install dependencies.

pip install -r requirements.txt

## Usage
Run the app and use the interface.

## License
MIT`

function ReadmePanelShell({
  label,
  labelColor,
  children,
}: {
  label: string
  labelColor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${labelColor}`}>
        {label}
      </span>
      <div className="rounded-2xl border border-white/8 bg-[#0A0F1E]/80 overflow-hidden">
        {/* macOS chrome bar */}
        <div className="flex items-center gap-1.5 border-b border-white/6 px-4 py-2.5 bg-white/[0.025]">
          <span className="h-2 w-2 rounded-full bg-red-500/55" />
          <span className="h-2 w-2 rounded-full bg-amber-400/45" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/45" />
          <span className="ml-auto font-mono text-[10px] text-white/20">README.md</span>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function HomeReadmeDemo() {
  return (
    <section
      id="demo"
      className="relative flex flex-col bg-[#070a12] pt-0 pb-20 sm:pb-24"
    >
      <div className="mx-auto w-full max-w-[82rem] px-6 sm:px-10 lg:px-12 xl:px-14">

        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold leading-snug text-white sm:text-3xl lg:text-4xl">
            This README scored a 38.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#8B9DC3] sm:text-[0.9375rem]">
            Here&apos;s what it looks like after RepoMax.
          </p>
        </div>

        {/* Panels */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 sm:mt-12">
          {/* BEFORE panel — raw pre */}
          <ReadmePanelShell label="Before" labelColor="text-red-400/70">
            <pre className="overflow-y-auto max-h-[420px] min-h-[420px] p-5 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap overscroll-contain text-white/35">
              {BEFORE_LINES}
            </pre>
          </ReadmePanelShell>

          {/* AFTER panel — styled rendered README */}
          <ReadmePanelShell label="After" labelColor="text-emerald-400/70">
            <div className="overflow-y-auto max-h-[420px] min-h-[420px] p-5 overscroll-contain space-y-3">
              <h1 className="font-mono text-[15px] font-bold text-white/90 border-b border-white/10 pb-2">
                AI Schedule Planner
              </h1>
              <p className="font-mono text-[11.5px] text-white/65 leading-relaxed">
                A web app that takes your class list and weekly constraints and generates a conflict-free study schedule using a constraint-satisfaction model built with TensorFlow. Built for college students managing 5+ courses.
              </p>
              <div className="rounded border border-white/10 bg-white/[0.03] py-4 text-center font-mono text-[11px] text-white/30">
                ▶ demo.gif — schedule generation
              </div>
              <div>
                <h2 className="font-mono text-[12px] font-semibold text-white/70 mb-1">## What it does</h2>
                <ul className="space-y-0.5 font-mono text-[11.5px] text-white/60">
                  <li>- Parses your course load and deadline inputs</li>
                  <li>- Runs constraint-satisfaction to block study windows</li>
                  <li>- Exports week-view calendar to Google Calendar</li>
                </ul>
              </div>
              <div>
                <h2 className="font-mono text-[12px] font-semibold text-white/70 mb-1">## Quick Start</h2>
                <div className="rounded bg-white/[0.04] p-3 space-y-0.5 font-mono text-[11px] text-blue-300/70">
                  <div>git clone github.com/you/ai-schedule-planner</div>
                  <div>pip install -r requirements.txt</div>
                  <div>python app.py <span className="text-white/30"># → localhost:5000</span></div>
                </div>
              </div>
              <div>
                <h2 className="font-mono text-[12px] font-semibold text-white/70 mb-1">## Stack</h2>
                <p className="font-mono text-[11.5px] text-white/60">
                  Python · TensorFlow · Flask · React · deployed on Vercel
                </p>
              </div>
            </div>
          </ReadmePanelShell>
        </div>

        {/* Closing CTA */}
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-base font-semibold text-white/80 sm:text-lg">
            Your repo probably looks like the left one.
          </p>
          <p className="max-w-md text-sm leading-relaxed text-[#8B9DC3] mb-3">
            Paste your GitHub URL above and get your score, gaps, and rewritten README in under a minute.
          </p>
          <p className="text-sm text-white/40 mb-3">Paste your repo URL to get your actual score.</p>
          <div className="w-full max-w-md">
            <HeroRepoForm />
          </div>
        </div>

      </div>
    </section>
  )
}
