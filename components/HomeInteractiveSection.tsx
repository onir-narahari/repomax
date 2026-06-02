import Link from 'next/link'
import { ArrowRight, FileText, ListChecks, Gauge } from 'lucide-react'
import { MOCK_SCORE } from '@/lib/score-mock'

const CATEGORIES = MOCK_SCORE.categories

const OUTPUTS = [
  {
    icon: Gauge,
    title: 'Repo Score',
    body: 'One number out of 100, plus a label that tells you if your repo reads strong or weak on first pass.',
  },
  {
    icon: ListChecks,
    title: 'Fix list',
    body: 'Specific gaps ranked by impact: missing screenshots, setup steps, README structure, and more.',
  },
  {
    icon: FileText,
    title: 'Resume bullets',
    body: 'Three bullets grounded in your actual stack and features, ready to paste into an application.',
  },
] as const

export default function HomeInteractiveSection() {
  return (
    <section
      id="demo"
      className="relative flex min-h-screen flex-col border-t border-white/6 bg-[#070a12]"
    >
      <div className="mx-auto flex w-full max-w-[82rem] flex-1 flex-col px-6 pb-16 pt-14 sm:px-10 sm:pb-20 sm:pt-16 lg:px-12 lg:pb-20 lg:pt-16 xl:px-14">
        <div>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold leading-snug text-white/85 sm:text-2xl">
              Score, gaps, and bullets in one pass
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#8B9DC3] sm:text-[0.9375rem]">
              No dashboard. No account. Paste a public repo and copy what you need.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5">
            {OUTPUTS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-white/8 bg-[#0A0F1E]/60 px-5 py-5 sm:px-6"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/15 bg-blue-500/8">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-white/90">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#8B9DC3]">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-12">
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">
              Scored across 6 categories
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.label}
                  className="rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2.5 text-center"
                >
                  <p className="text-[11px] font-medium leading-snug text-white/65">{cat.label}</p>
                  <p className="mt-0.5 text-[10px] tabular-nums text-white/30">max {cat.max} pts</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex justify-center sm:mt-14">
            <Link
              href="/#top"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-blue-500 hover:shadow-[0_0_36px_rgba(59,130,246,0.42)]"
            >
              Try it on your repo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
