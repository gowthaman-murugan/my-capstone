export type ReviewStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
export type FindingCategory = 'SECURITY' | 'PERFORMANCE' | 'STYLE' | 'CORRECTNESS'
export type TeamRole = 'ADMIN' | 'MEMBER' | 'VIEWER'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Repository {
  id: string
  githubRepoId: number
  fullName: string
  owner: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { reviews: number }
}

export interface Finding {
  id: string
  filePath: string
  lineStart: number
  lineEnd?: number
  severity: Severity
  category: FindingCategory
  message: string
  suggestion?: string
  rule?: { id: string; name: string }
}

export interface Review {
  id: string
  prNumber: number
  prTitle: string
  prUrl: string
  headSha: string
  baseSha: string
  status: ReviewStatus
  summary?: string
  repository: { id: string; fullName: string }
  author?: { id: string; name: string; githubLogin?: string }
  _count: { findings: number }
  createdAt: string
  updatedAt: string
}

export interface ReviewDetail extends Review {
  findings: Finding[]
}

export interface Rule {
  id: string
  name: string
  description?: string
  category: FindingCategory
  severity: Severity
  isEnabled: boolean
  pattern?: string
  repositoryId?: string
  repository?: { id: string; fullName: string }
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  role: TeamRole
  user: {
    id: string
    name: string
    githubLogin?: string
    avatarUrl?: string
  }
}

export interface ListResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface SingleResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  issues?: Record<string, string[]>
}
