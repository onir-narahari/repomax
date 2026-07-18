import type { JobPosting } from '@/types'

// Source: Pitt CSC + Simplify's community-maintained internship board
// (github.com/SimplifyJobs/Summer2026-Internships — 45k+ stars, refreshed
// continuously via community submissions + automated career-page scraping).
// Already aggregates postings across Greenhouse, Lever, Workday, and
// everything else into one feed — far broader than hand-curating individual
// company ATS boards (~1000+ active listings vs. ~35 companies a manual
// Greenhouse-only list could realistically cover). MVP scope: internships
// only, per product decision — new-grad roles (a separate Simplify feed,
// github.com/SimplifyJobs/New-Grad-Positions) are a fast-follow, not v1.
const INTERNSHIP_FEED = 'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json'

// Matches the resume-bullet prompt's target audience (SWE, AI/ML, systems,
// quant/dev) — excludes Hardware/Product/etc, which don't fit repo-based CS
// project matching.
const RELEVANT_CATEGORIES = new Set([
  'Software',
  'Software Engineering',
  'AI/ML/Data',
  'Data Science, AI & Machine Learning',
  'Quant',
  'Quantitative Finance',
])

interface SimplifyListing {
  id: string
  category: string
  company_name: string
  title: string
  active: boolean
  is_visible?: boolean
  url: string
  locations?: string[]
  date_posted?: number
}

// Shared vocabulary — also used by lib/job-matching.ts to tag repos, so job
// tags and repo tags are directly comparable.
const TAG_KEYWORDS: Record<string, string[]> = {
  python: ['python', 'django', 'flask', 'fastapi'],
  javascript: ['javascript', 'node.js', 'nodejs'],
  typescript: ['typescript'],
  java: ['java '],
  go: [' golang', ' go ', 'go developer'],
  rust: ['rust'],
  'c++': ['c++'],
  react: ['react', 'react.js', 'reactjs'],
  vue: ['vue.js', 'vuejs'],
  nextjs: ['next.js', 'nextjs'],
  aws: ['aws', 'amazon web services'],
  gcp: ['google cloud', 'gcp'],
  azure: ['azure'],
  kubernetes: ['kubernetes', 'k8s'],
  docker: ['docker'],
  sql: ['sql', 'postgres', 'mysql'],
  nosql: ['mongodb', 'dynamodb', 'nosql', 'redis'],
  'machine-learning': ['machine learning', 'ml pipeline', 'pytorch', 'tensorflow', 'ai/ml/data'],
  ai: ['artificial intelligence', ' ai ', 'llm', 'genai'],
  ios: ['ios', 'swift'],
  android: ['android', 'kotlin'],
  distributed: ['distributed systems', 'microservices'],
  security: ['security', 'cryptograph'],
  data: ['data pipeline', 'etl', 'data warehouse', 'data science'],
  quant: ['quant', 'trading', 'quantitative'],
}

export function deriveTechTags(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `
  const tags: string[] = []
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) tags.push(tag)
  }
  return tags
}

async function fetchSimplifyFeed(url: string): Promise<SimplifyListing[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return []
    return (await res.json()) as SimplifyListing[]
  } catch {
    return []
  }
}

function normalizeListing(source: string, j: SimplifyListing): JobPosting {
  return {
    id: '', // assigned by the DB on upsert
    source,
    externalId: j.id,
    title: j.title,
    company: j.company_name,
    location: j.locations && j.locations.length > 0 ? j.locations.slice(0, 3).join(', ') : null,
    absoluteUrl: j.url,
    techTags: deriveTechTags(`${j.title} ${j.category}`),
    postedAt: j.date_posted ? new Date(j.date_posted * 1000).toISOString() : null,
    isActive: true,
  }
}

export async function fetchCuratedJobPostings(): Promise<JobPosting[]> {
  const listings = await fetchSimplifyFeed(INTERNSHIP_FEED)

  const relevant = listings.filter((j) => j.active && j.is_visible !== false && RELEVANT_CATEGORIES.has(j.category))

  return relevant.map((j) => normalizeListing('simplify:internship', j))
}
