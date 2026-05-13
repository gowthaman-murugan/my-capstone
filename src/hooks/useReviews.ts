'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { Review, ListResponse } from '@/types'
import type { ReviewFilters } from './useReviewFilters'

export function useReviews(filters: ReviewFilters) {
  const params = new URLSearchParams()
  params.set('page', String(filters.page))
  if (filters.status) params.set('status', filters.status)
  if (filters.repositoryId) params.set('repositoryId', filters.repositoryId)

  const { data, error, isLoading } = useSWR<ListResponse<Review>>(
    `/api/reviews?${params.toString()}`,
    fetcher
  )

  return {
    reviews: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
  }
}
