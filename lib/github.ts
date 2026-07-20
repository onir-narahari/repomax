import type { RepoContext, StructuredFacts, CategorizedTechStack, GitHubUserRepo } from '@/types'

const BASE = 'https://api.github.com'

const SIGNAL_PATTERNS = [
  'Dockerfile',
  'docker-compose.yml',
  '.github/workflows',
  'prisma',
  'supabase',
  'tests',
  '__tests__',
  'jest.config',
  'vitest.config',
  'cypress',
  'playwright',
]

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

export function parseRepoUrl(url: string): { owner: string; repo: string } {
  const match = url.match(
    /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)\/?$/
  )
  if (!match) throw new Error('INVALID_URL')
  return { owner: match[1], repo: match[2] }
}

async function ghFetch(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    headers: githubHeaders(),
    next: { revalidate: 0 },
  })
}

async function fetchMetadata(owner: string, repo: string) {
  const res = await ghFetch(`/repos/${owner}/${repo}`)
  if (res.status === 404) throw new Error('NOT_FOUND')
  if (res.status === 403) throw new Error('GITHUB_RATE_LIMITED')
  if (res.status === 451) throw new Error('REPO_BLOCKED')
  if (!res.ok) throw new Error('GITHUB_ERROR')
  const data = await res.json()
  if (data.private) throw new Error('PRIVATE_REPO')
  if (data.size === 0) throw new Error('EMPTY_REPO')
  return data
}

async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  try {
    const res = await ghFetch(`/repos/${owner}/${repo}/readme`)
    if (!res.ok) return null
    const data = await res.json()
    return Buffer.from(data.content, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

async function fetchFileTree(owner: string, repo: string): Promise<string[]> {
  try {
    const res = await ghFetch(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`)
    if (!res.ok) return []
    const data = await res.json()
    const allPaths = (data.tree as Array<{ path: string; type: string }>).map((item) => item.path)

    const topLevel = allPaths.filter((p) => !p.includes('/'))

    const signalMatches = allPaths.filter((p) => {
      if (topLevel.includes(p)) return false // already included
      return SIGNAL_PATTERNS.some((pattern) => p.startsWith(pattern) || p === pattern)
    })

    const combined = [...topLevel, ...signalMatches]
    // Deduplicate and cap at 40
    return [...new Set(combined)].slice(0, 40)
  } catch {
    return []
  }
}

async function fetchLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  try {
    const res = await ghFetch(`/repos/${owner}/${repo}/languages`)
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

const NOISE_PACKAGES = new Set([
  'eslint',
  'prettier',
  'postcss',
  'autoprefixer',
  'tailwindcss',
  'rimraf',
  'husky',
  'lint-staged',
  'turbo',
  'concurrently',
  'nodemon',
  'cross-env',
  'dotenv-cli',
])

const NOISE_PREFIXES = ['@types/', '@eslint', '@tailwind']

function isNoiseDependency(name: string): boolean {
  if (NOISE_PACKAGES.has(name)) return true
  if (name === 'typescript') return true // standalone tooling, not ts-node
  for (const prefix of NOISE_PREFIXES) {
    if (name.startsWith(prefix)) return true
  }
  return false
}

async function fetchDependencies(owner: string, repo: string, lang: string | null): Promise<string[]> {
  const candidates =
    lang === 'Python'
      ? ['requirements.txt', 'pyproject.toml', 'setup.py']
      : lang === 'Go'
      ? ['go.mod']
      : lang === 'Ruby'
      ? ['Gemfile']
      : lang === 'Rust'
      ? ['Cargo.toml']
      : ['package.json']

  for (const file of candidates) {
    try {
      const res = await ghFetch(`/repos/${owner}/${repo}/contents/${file}`)
      if (!res.ok) continue
      const data = await res.json()
      const content = Buffer.from(data.content, 'base64').toString('utf-8')

      if (file === 'package.json') {
        const pkg = JSON.parse(content)
        const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
        return deps.filter((d) => !isNoiseDependency(d)).slice(0, 30)
      }
      if (file === 'requirements.txt') {
        return content
          .split('\n')
          .map((l) => l.split(/[=<>!]/)[0].trim())
          .filter(Boolean)
          .filter((d) => !isNoiseDependency(d))
          .slice(0, 30)
      }
      if (file === 'go.mod') {
        return content
          .split('\n')
          .filter((l) => l.trim().startsWith('require') === false && l.includes('/'))
          .map((l) => l.trim().split(/\s+/)[0])
          .filter(Boolean)
          .filter((d) => !isNoiseDependency(d))
          .slice(0, 30)
      }
      return []
    } catch {
      continue
    }
  }
  return []
}

async function fetchCommits(owner: string, repo: string): Promise<string[]> {
  try {
    const res = await ghFetch(`/repos/${owner}/${repo}/commits?per_page=10`)
    if (!res.ok) return []
    const data = await res.json()
    return (data as Array<{ commit: { message: string } }>)
      .map((c) => c.commit.message.split('\n')[0].slice(0, 100))
  } catch {
    return []
  }
}

function deriveStructuredFacts(
  dependencies: string[],
  primaryLanguage: string | null,
  topics: string[],
  readme: string | null
): StructuredFacts {
  const lower = (s: string) => s.toLowerCase()

  const categorized: CategorizedTechStack = {
    frontend: [],
    backend: [],
    database: [],
    ai: [],
    infra: [],
    testing: [],
  }

  const AI_KEYWORDS = ['openai', 'anthropic', 'langchain', 'transformers', 'torch', 'tensorflow', 'huggingface', 'sentence-transformers', 'ollama', 'cohere', 'replicate', 'groq', 'gemini', 'llama']
  const BACKEND_KEYWORDS = ['express', 'fastapi', 'django', 'flask', 'hono', 'elysia', 'koa', 'fastify', 'rails', 'sinatra', 'gin', 'echo', 'fiber', 'axum', 'actix', 'spring']
  const FRONTEND_KEYWORDS = ['react', 'vue', 'svelte', 'next', 'nuxt', 'solid', 'angular', 'remix', 'astro', 'gatsby', 'vite']
  const DATABASE_KEYWORDS = ['prisma', 'mongoose', 'pg', 'mysql2', 'mysql', 'sqlite3', 'sqlite', 'sequelize', 'typeorm', 'drizzle', 'redis', 'mongodb', 'supabase', 'planetscale', 'neon', 'turso', 'qdrant', 'pinecone', 'weaviate', 'chroma', 'psycopg', 'sqlalchemy', 'peewee']
  const INFRA_KEYWORDS = ['docker', 'nginx', 'aws', 'vercel', 'cloudflare', 'railway', 'fly', 'kubernetes', 'terraform', 'pulumi', 'celery', 'bull', 'bullmq', 'rq', 'worker']
  const TESTING_KEYWORDS = ['jest', 'vitest', 'pytest', 'cypress', 'playwright', 'mocha', 'chai', 'supertest', 'testing-library', 'unittest']

  for (const dep of dependencies) {
    const d = lower(dep)
    if (AI_KEYWORDS.some((k) => d.includes(k))) { categorized.ai.push(dep); continue }
    if (DATABASE_KEYWORDS.some((k) => d.includes(k))) { categorized.database.push(dep); continue }
    if (TESTING_KEYWORDS.some((k) => d.includes(k))) { categorized.testing.push(dep); continue }
    if (INFRA_KEYWORDS.some((k) => d.includes(k))) { categorized.infra.push(dep); continue }
    if (BACKEND_KEYWORDS.some((k) => d.includes(k))) { categorized.backend.push(dep); continue }
    if (FRONTEND_KEYWORDS.some((k) => d.includes(k))) { categorized.frontend.push(dep); continue }
  }

  // Determine projectType from language + framework signals
  const hasAI = categorized.ai.length > 0
  const hasFrontend = categorized.frontend.length > 0
  const hasBackend = categorized.backend.length > 0
  const hasDatabase = categorized.database.length > 0
  const lang = primaryLanguage ? lower(primaryLanguage) : ''
  const topicStr = topics.map(lower).join(' ')

  let projectType = 'software project'
  if (topicStr.includes('cli') || topicStr.includes('command-line') || topicStr.includes('terminal')) {
    projectType = 'CLI tool'
  } else if (hasAI && (hasBackend || hasFrontend)) {
    projectType = 'AI-powered web application'
  } else if (hasAI) {
    projectType = 'AI/ML project'
  } else if (hasFrontend && hasBackend && hasDatabase) {
    projectType = 'full-stack web application'
  } else if (hasFrontend && hasBackend) {
    projectType = 'full-stack web application'
  } else if (hasFrontend) {
    projectType = 'frontend web application'
  } else if (hasBackend) {
    projectType = 'backend API'
  } else if (lang === 'python' && !hasFrontend) {
    projectType = 'Python script or data pipeline'
  } else if (lang === 'go' || lang === 'rust') {
    projectType = 'systems/CLI tool'
  } else if (topicStr.includes('plugin') || topicStr.includes('extension')) {
    projectType = 'plugin or extension'
  } else if (topicStr.includes('library') || topicStr.includes('sdk') || topicStr.includes('package')) {
    projectType = 'library or SDK'
  }

  // Extract confirmed metrics from README via regex
  const confirmedMetrics: string[] = []
  if (readme) {
    const metricPattern = /\b\d[\d,.]*\s*(%|x|X|ms|s\b|users?|requests?|downloads?|seconds?|minutes?|hours?|MB|GB|TB|K\b|M\b|B\b|stars?|rating)/g
    const matches = readme.match(metricPattern) ?? []
    // Deduplicate and keep up to 6
    const seen = new Set<string>()
    for (const m of matches) {
      const norm = m.trim()
      if (!seen.has(norm)) {
        seen.add(norm)
        confirmedMetrics.push(norm)
      }
      if (confirmedMetrics.length >= 6) break
    }
  }

  return {
    oneSentenceSummary: '', // populated by LLM analysis step
    projectType,
    coreFeatures: [],       // populated by LLM analysis step
    notableImplementationDetails: [], // populated by LLM analysis step
    confirmedMetrics,
    categorizedTechStack: categorized,
  }
}

export async function fetchRepoContext(owner: string, repo: string): Promise<RepoContext> {
  const metadata = await fetchMetadata(owner, repo)

  const lang: string | null = metadata.language ?? null

  const [readme, fileTree, dependencies, recentCommits, languages] = await Promise.all([
    fetchReadme(owner, repo),
    fetchFileTree(owner, repo),
    fetchDependencies(owner, repo, lang),
    fetchCommits(owner, repo),
    fetchLanguages(owner, repo),
  ])

  const createdAt: string | null = metadata.created_at ?? null
  const forksCount: number = metadata.forks_count ?? 0

  const CI_INDICATORS = ['.github/workflows', 'Jenkinsfile', '.circleci/config.yml', '.travis.yml']
  const hasCI = fileTree.some((p) =>
    CI_INDICATORS.some((indicator) => p.startsWith(indicator) || p === indicator)
  )

  const architectureSignals = fileTree.filter((p) =>
    SIGNAL_PATTERNS.some((pattern) => p.startsWith(pattern) || p === pattern)
  )

  const warnings: string[] = []
  if (!readme) warnings.push('No README found — content based on code structure and metadata only')
  if (fileTree.length === 0) warnings.push('Could not read file tree')

  const structuredFacts = deriveStructuredFacts(
    dependencies,
    lang,
    metadata.topics ?? [],
    readme
  )

  return {
    name: metadata.name,
    description: metadata.description ?? null,
    primaryLanguage: lang,
    topics: metadata.topics ?? [],
    stars: metadata.stargazers_count ?? 0,
    readme,
    fileTree,
    dependencies,
    recentCommits,
    warnings,
    languages,
    createdAt,
    forksCount,
    hasCI,
    architectureSignals,
    structuredFacts,
  }
}

export async function fetchUserRepos(username: string): Promise<GitHubUserRepo[]> {
  const res = await ghFetch(`/users/${username}/repos?type=owner&sort=updated&per_page=100`)
  if (res.status === 404) throw new Error('NOT_FOUND')
  if (res.status === 403) throw new Error('GITHUB_RATE_LIMITED')
  if (!res.ok) throw new Error('GITHUB_ERROR')

  const data = await res.json()
  return (data as Array<{
    name: string
    html_url: string
    fork: boolean
    private: boolean
    language: string | null
    stargazers_count: number
    updated_at: string
    size: number
    description: string | null
    topics: string[] | null
  }>)
    // Exclude forks, private repos, and empty repos (size === 0, same signal
    // fetchMetadata uses for EMPTY_REPO) — a fork or a repo with no pushed
    // content shouldn't be eligible as a job-matching candidate.
    .filter((r) => !r.fork && !r.private && (r.size ?? 0) > 0)
    .map((r) => ({
      name: r.name,
      htmlUrl: r.html_url,
      language: r.language,
      stars: r.stargazers_count ?? 0,
      updatedAt: r.updated_at,
      size: r.size ?? 0,
      description: r.description ?? null,
      topics: r.topics ?? [],
    }))
}

interface PinnedRepoNode {
  name: string
  owner: { login: string }
}

// GitHub's pinned repos are only exposed via GraphQL (no REST equivalent).
// Returns repo names in pin order, filtered to ones actually owned by
// `username` (pinnedItems can include repos the user contributed to but
// doesn't own). Best-effort: no token, rate limit, or query failure just
// yields no pins rather than surfacing an error — pins are a selection
// nicety, not a hard requirement.
export async function fetchPinnedRepoNames(username: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/graphql`, {
      method: 'POST',
      headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($login: String!) {
          user(login: $login) {
            pinnedItems(first: 6, types: REPOSITORY) {
              nodes {
                ... on Repository {
                  name
                  owner { login }
                }
              }
            }
          }
        }`,
        variables: { login: username },
      }),
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const json = await res.json()
    const nodes = json?.data?.user?.pinnedItems?.nodes as PinnedRepoNode[] | undefined
    if (!nodes) return []
    return nodes
      .filter((n) => n.owner?.login?.toLowerCase() === username.toLowerCase())
      .map((n) => n.name)
  } catch {
    return []
  }
}
