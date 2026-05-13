'use client'

import { Select } from '@/components/ui'
import type { ReviewFilters } from '@/hooks/useReviewFilters'
import type { Repository } from '@/types'

interface ReviewFiltersProps {
  filters: ReviewFilters
  repositories: Repository[]
  onStatusChange: (v: string) => void
  onRepositoryChange: (v: string) => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
]

export function ReviewFilters({ filters, repositories, onStatusChange, onRepositoryChange }: ReviewFiltersProps) {
  const repoOptions = [
    { value: '', label: 'All Repositories' },
    ...repositories.map((r) => ({ value: r.id, label: r.fullName })),
  ]

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filters.status}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
      />
      <Select
        value={filters.repositoryId}
        onChange={onRepositoryChange}
        options={repoOptions}
      />
    </div>
  )
}
