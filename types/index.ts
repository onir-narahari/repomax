export interface CategorizedTechStack {
  frontend: string[]
  backend: string[]
  database: string[]
  ai: string[]
  infra: string[]
  testing: string[]
}

export interface StructuredFacts {
  oneSentenceSummary: string
  projectType: string
  coreFeatures: string[]
  notableImplementationDetails: string[]
  confirmedMetrics: string[]
  categorizedTechStack: CategorizedTechStack
}

export interface RepoContext {
  name: string
  description: string | null
  primaryLanguage: string | null
  topics: string[]
  stars: number
  readme: string | null
  fileTree: string[]
  dependencies: string[]
  recentCommits: string[]
  warnings: string[]
  languages: Record<string, number>
  createdAt: string | null
  forksCount: number
  hasCI: boolean
  architectureSignals: string[]
  structuredFacts: StructuredFacts
}

export interface AnalyzeRequest {
  repoUrl: string
  targetRole?: string
}

export interface CategoryScore {
  score: number
  max: number
  reason: string
}

export interface RepoScoreCategories {
  first_impression_clarity: CategoryScore
  runnable_setup_dx: CategoryScore
  technical_depth_system_design: CategoryScore
  proof_of_shipping: CategoryScore
  testing_reliability_quality: CategoryScore
  documentation_depth: CategoryScore
}

export interface ProofClaim {
  claim: string
  status: 'found' | 'missing'
  evidence: string
  interviewNote: string
}

export interface MissingProofDetection {
  claims: ProofClaim[]
  readinessNote: string
}

export interface RepoScore {
  total: number
  label: string
  summary: string
  categories: RepoScoreCategories
  strengths: string[]
  weaknesses: string[]
  fixes: string[]
  missingProof?: MissingProofDetection
}

export interface AnalyzeResponse {
  resumeBullets: [string, string, string]
  warnings: string[]
  repoScore?: RepoScore
}

export type AppErrorCode =
  | 'INVALID_URL'
  | 'NOT_GITHUB_URL'
  | 'PRIVATE_REPO'
  | 'NOT_FOUND'
  | 'EMPTY_REPO'
  | 'REPO_BLOCKED'
  | 'RATE_LIMITED'
  | 'GITHUB_RATE_LIMITED'
  | 'GITHUB_ERROR'
  | 'LLM_ERROR'
  | 'LLM_TIMEOUT'
  | 'LLM_PARSE_ERROR'
  | 'UNKNOWN'

export const ERROR_FAULT: Record<AppErrorCode, 'user' | 'system'> = {
  INVALID_URL: 'user',
  NOT_GITHUB_URL: 'user',
  PRIVATE_REPO: 'user',
  NOT_FOUND: 'user',
  EMPTY_REPO: 'user',
  REPO_BLOCKED: 'user',
  RATE_LIMITED: 'system',
  GITHUB_RATE_LIMITED: 'system',
  GITHUB_ERROR: 'system',
  LLM_ERROR: 'system',
  LLM_TIMEOUT: 'system',
  LLM_PARSE_ERROR: 'system',
  UNKNOWN: 'system',
}

export interface AppError {
  error: AppErrorCode
}

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; data: AnalyzeResponse }
  | { status: 'error'; code: AppErrorCode }

export interface GitHubUserRepo {
  name: string
  htmlUrl: string
  language: string | null
  stars: number
  updatedAt: string
  size: number
  description: string | null
  topics: string[]
}

export interface JobPosting {
  id: string
  source: string
  externalId: string
  title: string
  company: string
  location: string | null
  absoluteUrl: string
  techTags: string[]
  postedAt: string | null
  isActive: boolean
}

export interface JobMatch {
  jobPosting: JobPosting
  matchedRepoName: string
  matchReason: string
  matchRank: number
  // Optional for backward compat with matches read from user_job_matches
  // rows written before this field existed / before the API layer persists
  // it (see JM-8/JM-9 in docs/kanban-job-matching-revamp.md) — matches
  // produced by matchJobsForRepos() always set it.
  confidence?: number
}
