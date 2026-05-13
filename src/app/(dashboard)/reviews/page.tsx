'use client'

import { Suspense } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { ReviewFilters } from '@/components/reviews/ReviewFilters'
import { ReviewTable } from '@/components/reviews/ReviewTable'
import { EmptyState, Pagination, Spinner } from '@/components/ui'
import { useReviewFilters } from '@/hooks/useReviewFilters'
import { useReviews } from '@/hooks/useReviews'
import { useRepositories } from '@/hooks/useRepositories'

function ReviewListContent() {
  const [filters, { setStatus, setRepositoryId, setPage }] = useReviewFilters()
  const { reviews, meta, isLoading, error } = useReviews(filters)
  const { repositories } = useRepositories()

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load reviews: {error.message}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reviews" description="All pull request reviews across your repositories" />

      <ReviewFilters
        filters={filters}
        repositories={repositories}
        onStatusChange={setStatus}
        onRepositoryChange={setRepositoryId}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews found"
          description="Try adjusting your filters, or wait for a PR webhook to trigger a review."
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      ) : (
        <>
          <ReviewTable reviews={reviews} />
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}

export default function ReviewListPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
      <ReviewListContent />
    </Suspense>
  )
}
