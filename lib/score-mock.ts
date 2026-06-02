/** Shared marketing mock — category scores must sum to `total`. */

export const MOCK_REPO_SLUG = 'user/ai-fitness-coach'

/** Real public repo for live “see example” demos */
export const EXAMPLE_REPO_URL = 'https://github.com/octocat/Hello-World'

export const MOCK_SCORE = {
  total: 57,
  label: 'Weak Signal',
  summary:
    'Recruiter gets no proof it runs, no setup steps, and no clear opener.',
  strengths: [] as string[],
  categories: [
    { label: 'First impression', score: 8, max: 15 },
    { label: 'Setup & DX', score: 5, max: 15 },
    { label: 'Technical depth', score: 20, max: 25 },
    { label: 'Proof of shipping', score: 7, max: 15 },
    { label: 'Quality signals', score: 4, max: 15 },
    { label: 'Documentation', score: 13, max: 15 },
  ],
} as const

export const MOCK_FIXES = [
  {
    issue: 'No screenshot or sample output showing the app actually runs.',
    fix: 'Add one UI screenshot or paste a sample API response in the README.',
  },
  {
    issue: 'No install or run steps documented anywhere in the repo.',
    fix: 'Add npm install, .env.example, and npm run dev with the local URL.',
  },
  {
    issue: 'README leads with tech stack before saying what the repo is.',
    fix: 'Add a 2 sentence summary at the top, then list the stack.',
  },
] as const

export const MOCK_BULLET_PREVIEW =
  'Built a full stack web app with React, Express, and OpenAI API integration for user auth, REST endpoints, and a client dashboard.'

export const MOCK_BULLET_COUNT = 3

export function categoryPct(score: number, max: number) {
  return Math.min(100, Math.round((score / max) * 100))
}

export function mockBarColor(pct: number) {
  if (pct >= 88) return 'bg-emerald-400'
  if (pct >= 72) return 'bg-blue-400'
  if (pct >= 55) return 'bg-amber-400'
  if (pct >= 40) return 'bg-orange-400'
  return 'bg-red-400'
}

export function mockScoreTheme(total: number) {
  if (total >= 80) {
    return {
      score: 'text-blue-400',
      badge: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
    }
  }
  if (total >= 70) {
    return {
      score: 'text-amber-400',
      badge: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    }
  }
  if (total >= 60) {
    return {
      score: 'text-orange-400',
      badge: 'border-orange-400/20 bg-orange-400/10 text-orange-300',
    }
  }
  return {
    score: 'text-red-400',
    badge: 'border-red-400/20 bg-red-400/10 text-red-300',
  }
}

export function mockPreviewCategories(limit = 4) {
  return [...MOCK_SCORE.categories]
    .sort((a, b) => categoryPct(a.score, a.max) - categoryPct(b.score, b.max))
    .slice(0, limit)
    .map((c) => ({ ...c, pct: categoryPct(c.score, c.max) }))
}
