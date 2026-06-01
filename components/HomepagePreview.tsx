import Link from 'next/link'
import { ArrowRight, Briefcase, FileText, GitFork, MessageCircle } from 'lucide-react'

const PREVIEW_CHIPS = [
  {
    id: 'resume',
    label: 'Resume Bullets',
    icon: FileText,
    preview: 'Built a FastAPI platform integrating financial APIs and LLM routing…',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Post',
    icon: Briefcase,
    preview: 'I built an AI stock research tool that turns questions into insights…',
  },
  {
    id: 'x',
    label: 'X Post',
    icon: MessageCircle,
    preview: 'Built an AI stock analysis app. Ask "NVDA vs AMD" and get real insights.',
  },
]

export default function HomepagePreview() {
  return (
    <section className="relative w-full px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/30">
            See what you get
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#1E3A5F]/80 bg-[#0A0F1E]/90 p-6 shadow-[0_0_60px_rgba(37,99,235,0.08)] sm:p-8">
          {/* Fake repo URL card */}
          <div className="mx-auto max-w-xl">
            <div className="mb-6 rounded-xl border border-blue-500/20 bg-[#050508] p-4">
              <div className="mb-2 flex items-center gap-2">
                <GitFork className="h-3.5 w-3.5 text-blue-400/70" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
                  GitHub repo
                </span>
              </div>
              <p className="truncate font-mono text-sm text-white/75">
                github.com/onir/stock-analysis-agent
              </p>
            </div>

            {/* Process preview */}
            <div className="mb-8 flex items-center justify-center gap-3 text-center">
              <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-blue-500/20 sm:block" />
              <p className="max-w-md text-sm leading-relaxed text-[#8B9DC3]">
                RepoStory extracts your README, stack, and project structure — then writes
                career-ready content grounded in what you built.
              </p>
              <div className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-blue-500/20 sm:block" />
            </div>
          </div>

          {/* Output preview chips */}
          <div className="grid gap-3 sm:grid-cols-3">
            {PREVIEW_CHIPS.map((chip) => {
              const Icon = chip.icon
              return (
                <div
                  key={chip.id}
                  className="rounded-xl border border-[#1E3A5F]/60 bg-[#050508]/60 p-4 transition-colors hover:border-blue-500/35"
                >
                  <div className="mb-2 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/80">
                      {chip.label}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-xs leading-relaxed text-white/50">
                    {chip.preview}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/generate"
            className="group inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/10 px-8 py-3.5 text-sm font-semibold text-blue-300 transition-all hover:border-blue-500/50 hover:bg-blue-600/20 hover:text-white"
          >
            Start free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
