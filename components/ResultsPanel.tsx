import ResultCard from './ResultCard'
import type { AnalyzeResponse } from '@/types'

interface Props {
  data: AnalyzeResponse
  onReset: () => void
}

export default function ResultsPanel({ data, onReset }: Props) {
  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Success header */}
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        </span>
        <p className="text-sm font-medium text-[#F4F0E8]/60">Your project story is ready</p>
      </div>

      {/* Low-data warnings */}
      {data.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
            Heads up
          </p>
          <ul className="space-y-1">
            {data.warnings.map((w, i) => (
              <li key={i} className="text-xs leading-relaxed text-amber-200/75">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ResultCard
        title="Resume Bullets"
        helperText="Paste directly into your resume. Each bullet starts with a strong action verb."
        badge="×3"
        content={data.resumeBullets}
      />
      <ResultCard
        title="LinkedIn Post"
        helperText="Ready to post. Sounds like a real builder — not a press release."
        content={data.linkedInPost}
      />
      <ResultCard
        title="X / Twitter Post"
        helperText="Short, specific, and worth reading. Check character count before posting."
        content={data.twitterPost}
        charLimit={280}
      />

      <button
        onClick={onReset}
        className="w-full rounded-xl border border-[#F4F0E8]/10 py-3 text-sm text-[#F4F0E8]/35 transition hover:border-[#F4F0E8]/20 hover:text-[#F4F0E8]/60 focus:outline-none focus:ring-2 focus:ring-[#F4F0E8]/15"
      >
        ← Try another repo
      </button>
    </div>
  )
}
