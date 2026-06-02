import type { RepoScore, RepoScoreCategories, CategoryScore } from '@/types'

export const CATEGORY_MAX: Record<keyof RepoScoreCategories, number> = {
  first_impression_clarity: 15,
  runnable_setup_dx: 15,
  technical_depth_system_design: 25,
  proof_of_shipping: 15,
  testing_reliability_quality: 15,
  documentation_depth: 15,
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
  const incoming = raw.categories as unknown as Record<string, CategoryScore>
  const normalized: RepoScoreCategories = {
    first_impression_clarity: incoming.first_impression_clarity,
    runnable_setup_dx: incoming.runnable_setup_dx,
    technical_depth_system_design: incoming.technical_depth_system_design,
    proof_of_shipping: incoming.proof_of_shipping,
    testing_reliability_quality: incoming.testing_reliability_quality,
    documentation_depth: incoming.documentation_depth,
  }

  let total = 0
  for (const key of Object.keys(CATEGORY_MAX) as (keyof RepoScoreCategories)[]) {
    const max = CATEGORY_MAX[key]
    const cat = normalized[key]
    if (!cat) continue
    const score = Math.max(0, Math.min(Math.round(cat.score), max))
    normalized[key] = { ...cat, score, max }
    total += score
  }

  const { resume_positioning_tips: _removed, ...rest } = raw as RepoScore & {
    resume_positioning_tips?: string[]
  }

  return {
    ...rest,
    categories: normalized,
    total,
    label: labelForTotal(total),
  }
}

interface FilterContext {
  hasCI: boolean
  readmeClaimsShipped: boolean
}

function matchesBannedAdvice(text: string, ctx: FilterContext): boolean {
  const lower = text.toLowerCase()

  if (/resume bullet|resume section|readme bullet/.test(lower)) return true
  if (/screenshot|gif\b|\.gif/.test(lower)) return true

  if (!ctx.hasCI && /integrate ci|github actions|add ci|set up ci/.test(lower)) return true

  if (
    !ctx.readmeClaimsShipped &&
    /deploy to production|live demo url|production deployment|deploy(ed)? to vercel|host(ed)? live/.test(lower)
  ) {
    return true
  }

  return false
}

function filterAdviceList(items: string[], ctx: FilterContext): string[] {
  return items.filter((item) => !matchesBannedAdvice(item, ctx))
}

/** Remove portfolio-unrealistic fixes and resume-meta advice from model output. */
export function filterRepoAdvice(score: RepoScore, ctx: FilterContext): RepoScore {
  const weaknesses = filterAdviceList(score.weaknesses, ctx)
  const fixes = filterAdviceList(score.fixes, ctx)

  const pairedFixes = fixes.slice(0, weaknesses.length)
  while (pairedFixes.length < weaknesses.length) {
    pairedFixes.push('')
  }

  return {
    ...score,
    weaknesses,
    fixes: pairedFixes,
  }
}

export function readmeClaimsShippedProduct(readme: string | null): boolean {
  if (!readme) return false
  const lower = readme.toLowerCase()
  return (
    /live (at|demo|url|site)|deployed (at|to)|in production|try it (at|live)|\.vercel\.app|\.netlify\.app/.test(
      lower
    ) || /https?:\/\/[^\s)]+\.(app|io|dev|com)/.test(lower)
  )
}
