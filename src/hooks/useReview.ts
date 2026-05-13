'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { ReviewDetail } from '@/types'

export function useReview(id: string) {
  const { data, error, isLoading } = useSWR<{ data: ReviewDetail }>(
    id ? `/api/reviews/${id}` : null,
    fetcher
  )

  return {
    review: data?.data,
    isLoading,
    error,
  }
}
