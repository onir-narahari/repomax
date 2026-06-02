/** Shared marketing mock — category scores must sum to `total`. */

export const MOCK_SCORE = {
  total: 82,
  label: 'Strong Signal',
  summary: 'Solid LLM routing and API design — quality signals and setup docs could be sharper.',
  strengths: [
    'LLM routing architecture with structured query dispatch',
    'FastAPI backend with clear financial data pipeline',
  ],
  categories: [
    { label: 'First impression', score: 14, max: 15 },
    { label: 'Setup & DX', score: 12, max: 15 },
    { label: 'Technical depth', score: 22, max: 25 },
    { label: 'Proof of shipping', score: 12, max: 15 },
    { label: 'Quality signals', score: 8, max: 15 },
    { label: 'Documentation', score: 14, max: 15 },
  ],
} as const

export const MOCK_BULLET_PREVIEW =
  'Built a FastAPI stock analysis platform with LLM query routing and structured financial data pipelines.'

export const MOCK_BULLET_COUNT = 3

export function categoryPct(score: number, max: number) {
  return Math.min(100, Math.round((score / max) * 100))
}

export function mockBarColor(pct: number) {
  if (pct >= 88) return 'bg-emerald-400'
  if (pct >= 72) return 'bg-blue-400'
  if (pct >= 55) return 'bg-amber-400'
  return 'bg-orange-400'
}

/** Lowest-scoring categories first — for compact breakdown previews */
export function mockPreviewCategories(limit = 4) {
  return [...MOCK_SCORE.categories]
    .sort((a, b) => categoryPct(a.score, a.max) - categoryPct(b.score, b.max))
    .slice(0, limit)
    .map((c) => ({ ...c, pct: categoryPct(c.score, c.max) }))
}
