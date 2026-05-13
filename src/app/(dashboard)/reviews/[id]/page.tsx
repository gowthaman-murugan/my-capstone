'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState, Spinner, Card } from '@/components/ui'
import { FindingFilters } from '@/components/reviews/FindingFilters'
import { FindingsList } from '@/components/reviews/FindingsList'
import { useReview } from '@/hooks/useReview'
import type { Severity, FindingCategory } from '@/types'

interface FindingFilterState {
  severity: string
  category: string
  filePath: string
}

function truncateSha(sha: string) {
  return sha.slice(0, 7)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { review, isLoading, error } = useReview(id)
  const [findingFilters, setFindingFilters] = useState<FindingFilterState>({
    severity: '',
    category: '',
    filePath: '',
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error?.message ?? 'Review not found'}
      </div>
    )
  }

  const filteredFindings = review.findings.filter((f) => {
    if (findingFilters.severity && f.severity !== (findingFilters.severity as Severity)) return false
    if (findingFilters.category && f.category !== (findingFilters.category as FindingCategory)) return false
    if (findingFilters.filePath && !f.filePath.toLowerCase().includes(findingFilters.filePath.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              #{review.prNumber} {review.prTitle}
            </h1>
            <StatusBadge status={review.status} />
          </div>
          <a
            href={review.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            View on GitHub ↗
          </a>
        </div>
        <Link href="/reviews" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Reviews
        </Link>
      </div>

      {review.summary && (
        <Card>
          <p className="text-sm leading-relaxed text-gray-700">{review.summary}</p>
        </Card>
      )}

      <Card title="Details">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-gray-500">Repository</dt>
            <dd className="font-medium text-gray-900">
              <Link href={`/repositories/${review.repository.id}`} className="text-indigo-600 hover:underline">
                {review.repository.fullName}
              </Link>
            </dd>
          </div>
          {review.author && (
            <div>
              <dt className="text-gray-500">Author</dt>
              <dd className="font-medium text-gray-900">{review.author.name}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">Head SHA</dt>
            <dd className="font-mono font-medium text-gray-900">{truncateSha(review.headSha)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd className="font-medium text-gray-900">{formatDate(review.createdAt)}</dd>
          </div>
        </dl>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Findings <span className="ml-1 text-base font-normal text-gray-500">({review.findings.length})</span>
          </h2>
        </div>

        <FindingFilters
          filters={findingFilters}
          onSeverityChange={(v) => setFindingFilters((f) => ({ ...f, severity: v }))}
          onCategoryChange={(v) => setFindingFilters((f) => ({ ...f, category: v }))}
          onFilePathChange={(v) => setFindingFilters((f) => ({ ...f, filePath: v }))}
        />

        {filteredFindings.length === 0 ? (
          <EmptyState
            title="No findings"
            description={
              review.findings.length > 0
                ? 'No findings match your current filters.'
                : 'This review has no findings — great job!'
            }
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        ) : (
          <FindingsList findings={filteredFindings} />
        )}
      </div>
    </div>
  )
}
