'use client'

import { Check, GitFork } from 'lucide-react'

const STEPS = [
  'Reading README',
  'Detecting tech stack',
  'Extracting key features',
  'Ranking resume-worthy details',
  'Writing project story',
]

export default function ProcessPanel() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Repo input card */}
      <div
        className="rounded-xl border border-[#1E3A5F] bg-[#0A0F1E] p-4 sm:rounded-2xl sm:p-5"
        style={{ boxShadow: '0 0 32px rgba(59,130,246,0.06)' }}
      >
        <div className="mb-3 flex items-center gap-2">
          <GitFork className="h-3.5 w-3.5 text-blue-400/70" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 sm:text-[11px]">
            Paste a repo
          </span>
        </div>
        <div className="flex items-center overflow-hidden rounded-lg border border-blue-500/15 bg-[#050508] px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3">
          <span className="font-mono text-[11px] text-white/30 sm:text-xs">github.com/</span>
          <span className="demo-typewriter-url font-mono text-[11px] text-white/80 sm:text-xs">
            onir/stock-analysis-agent
          </span>
          <span className="demo-typewriter-cursor" />
        </div>

        <div className="demo-analyzing-bar mt-3 overflow-hidden rounded-full bg-blue-500/10">
          <div className="demo-analyzing-fill h-1 rounded-full bg-blue-500/50" />
        </div>
        <p className="demo-analyzing-label mt-2 text-[10px] text-blue-400/60 sm:text-[11px]">
          Analyzing repository…
        </p>
      </div>

      {/* Process steps card */}
      <div
        className="rounded-xl border border-[#1E3A5F] bg-[#0A0F1E] p-4 sm:rounded-2xl sm:p-5"
        style={{ boxShadow: '0 0 32px rgba(59,130,246,0.06)' }}
      >
        <div className="mb-3 flex items-center gap-2 sm:mb-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 sm:text-[11px]">
            RepoMax is working
          </span>
        </div>
        <div className="space-y-2 sm:space-y-2.5">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className="demo-step-item flex items-center gap-2.5 sm:gap-3"
              style={{ animationDelay: `${0.7 + i * 0.3}s` }}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 sm:h-5 sm:w-5">
                <Check className="h-2 w-2 text-blue-400 sm:h-2.5 sm:w-2.5" strokeWidth={3} />
              </span>
              <span className="text-xs text-white/65 sm:text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
