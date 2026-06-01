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

export interface AnalyzeResponse {
  resumeBullets: [string, string, string]
  linkedInPost: string
  twitterPost: string
  warnings: string[]
}

export type AppErrorCode =
  | 'INVALID_URL'
  | 'PRIVATE_REPO'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'GITHUB_RATE_LIMITED'
  | 'LLM_ERROR'
  | 'UNKNOWN'

export interface AppError {
  error: AppErrorCode
}

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; data: AnalyzeResponse }
  | { status: 'error'; code: AppErrorCode }
