import type { RepoScore, RepoScoreCategories } from '@/types'

export const CATEGORY_MAX: Record<keyof RepoScoreCategories, number> = {
  first_impression_clarity: 15,
  runnable_setup_dx: 15,
  technical_depth_system_design: 20,
  proof_of_shipping: 15,
  testing_reliability_quality: 15,
  documentation_depth: 10,
  recruiter_resume_extractability: 10,
}

export function labelForTotal(total: number): string {
  if (total >= 90) return 'Recruiter-Ready'
  if (total >= 80) return 'Strong Signal'
  if (total >= 70) return 'Needs Polish'
  if (total >= 60) return 'Weak Signal'
  return 'Not Ready Yet'
}

/** Clamp per-category scores to canonical max and recompute total + label. */
export function normalizeRepoScore(raw: RepoScore): RepoScore {
  const categories = { ...raw.categories }

  let total = 0
  for (const key of Object.keys(CATEGORY_MAX) as (keyof RepoScoreCategories)[]) {
    const max = CATEGORY_MAX[key]
    const cat = categories[key]
    const score = Math.max(0, Math.min(Math.round(cat.score), max))
    categories[key] = { ...cat, score, max }
    total += score
  }

  return {
    ...raw,
    categories,
    total,
    label: labelForTotal(total),
  }
}
