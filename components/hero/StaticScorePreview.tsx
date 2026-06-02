import { BarChart2 } from 'lucide-react'
import { MOCK_SCORE, mockBarColor, mockPreviewCategories } from '@/lib/score-mock'

const CARD =
  'rounded-2xl border border-[#1E3A5F] bg-[#0A0F1E] p-4 shadow-[0_0_32px_rgba(59,130,246,0.06)]'

export default function StaticScorePreview() {
  const previewCats = mockPreviewCategories(4)

  return (
    <div className="w-full max-w-md xl:max-w-lg">
      <div className={CARD}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/80">
              Repo Score
            </span>
          </div>
          <span className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
            {MOCK_SCORE.label}
          </span>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className="text-4xl font-bold tabular-nums text-blue-400">{MOCK_SCORE.total}</span>
            <span className="text-base font-light text-white/30">/100</span>
          </div>
          <p className="mb-0.5 text-[11px] leading-snug text-white/45">{MOCK_SCORE.summary}</p>
        </div>

        <ul className="mt-3 space-y-1">
          {MOCK_SCORE.strengths.map((s) => (
            <li key={s} className="flex gap-2 text-[11px] leading-snug text-emerald-400/90">
              <span aria-hidden="true">✓</span>
              <span className="text-white/55">{s}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-white/8 pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-400/70">
            Lowest scores
          </p>
          <div className="space-y-2">
            {previewCats.map((cat) => (
              <div key={cat.label} className="space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[10px] text-white/50">{cat.label}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-white/55">
                    {cat.score}/{cat.max}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full ${mockBarColor(cat.pct)}`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
