import OpenAI from 'openai'
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

// Everything the Simplify feed actually gives us that carries tech signal —
// the feed has no free-text description field, so "full posting" means
// title + category + company + locations, not just title + category.
export function fullPostingText(j: SimplifyListing): string {
  return [j.title, j.category, j.company_name, ...(j.locations ?? [])].join(' ')
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
    techTags: deriveTechTags(fullPostingText(j)),
    postedAt: j.date_posted ? new Date(j.date_posted * 1000).toISOString() : null,
    isActive: true,
  }
}

export async function fetchCuratedJobPostings(): Promise<JobPosting[]> {
  const listings = await fetchSimplifyFeed(INTERNSHIP_FEED)

  const relevant = listings.filter((j) => j.active && j.is_visible !== false && RELEVANT_CATEGORIES.has(j.category))

  return relevant.map((j) => normalizeListing('simplify:internship', j))
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_BATCH_SIZE = 100

let _client: OpenAI | null = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

// Uniquely identifies a posting the same way the DB does (unique on
// source + external_id), so callers can key embeddings back onto postings.
export function postingKey(p: Pick<JobPosting, 'source' | 'externalId'>): string {
  return `${p.source}:${p.externalId}`
}

function embeddingInput(p: JobPosting): string {
  return `${p.title} at ${p.company}${p.location ? ` (${p.location})` : ''} — ${p.techTags.join(', ')}`
}

// The subset of a stored job_postings row that embeddingInput() is derived
// from — enough to tell whether an existing embedding is still fresh.
export interface EmbeddedPostingSnapshot {
  title: string
  company: string
  location: string | null
  techTags: string[]
}

function sameTags(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((t, i) => t === sortedB[i])
}

// True when `posting`'s embedding-relevant fields (the ones embeddingInput()
// reads) differ from what's already stored — meaning the stored embedding is
// stale even though it exists, e.g. because the title or category changed
// upstream at the source for the same source+external_id. Order of techTags
// doesn't matter, only membership.
export function postingContentChanged(posting: JobPosting, stored: EmbeddedPostingSnapshot): boolean {
  return (
    posting.title !== stored.title ||
    posting.company !== stored.company ||
    posting.location !== stored.location ||
    !sameTags(posting.techTags, stored.techTags)
  )
}

// Embeds postings in batches (one OpenAI call per batch, not per posting).
// Keyed by postingKey() so callers can merge results back onto postings that
// need one. If a batch call fails, it's logged and skipped rather than
// aborting the run — those postings simply stay unembedded (or stale) and
// are picked up on a future ingest run (see the caller's new-or-changed
// check, which uses postingContentChanged()).
export async function embedJobPostings(postings: JobPosting[]): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>()

  for (let i = 0; i < postings.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = postings.slice(i, i + EMBEDDING_BATCH_SIZE)
    try {
      const res = await getClient().embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch.map(embeddingInput),
      })
      for (const e of res.data) {
        embeddings.set(postingKey(batch[e.index]), e.embedding)
      }
    } catch (err) {
      console.error('[RepoMax] job posting embedding batch failed:', err)
    }
  }

  return embeddings
}
