'use client'

import { Select, Input } from '@/components/ui'

interface FindingFiltersState {
  severity: string
  category: string
  filePath: string
}

interface FindingFiltersProps {
  filters: FindingFiltersState
  onSeverityChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onFilePathChange: (v: string) => void
}

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'ERROR', label: 'Error' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'INFO', label: 'Info' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'PERFORMANCE', label: 'Performance' },
  { value: 'STYLE', label: 'Style' },
  { value: 'CORRECTNESS', label: 'Correctness' },
]

export function FindingFilters({ filters, onSeverityChange, onCategoryChange, onFilePathChange }: FindingFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={filters.severity} onChange={onSeverityChange} options={SEVERITY_OPTIONS} />
      <Select value={filters.category} onChange={onCategoryChange} options={CATEGORY_OPTIONS} />
      <Input
        placeholder="Filter by file path…"
        value={filters.filePath}
        onChange={(e) => onFilePathChange(e.target.value)}
        className="w-64"
      />
    </div>
  )
}
