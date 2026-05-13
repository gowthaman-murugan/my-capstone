'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export interface ReviewFilters {
  status: string
  repositoryId: string
  page: number
}

export function useReviewFilters(): [ReviewFilters, {
  setStatus: (v: string) => void
  setRepositoryId: (v: string) => void
  setPage: (v: number) => void
  reset: () => void
}] {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const filters: ReviewFilters = {
    status: params.get('status') ?? '',
    repositoryId: params.get('repositoryId') ?? '',
    page: Number(params.get('page') ?? '1'),
  }

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      if (key !== 'page') next.set('page', '1')
      router.push(`${pathname}?${next.toString()}`)
    },
    [params, pathname, router]
  )

  const setStatus = useCallback((v: string) => update('status', v), [update])
  const setRepositoryId = useCallback((v: string) => update('repositoryId', v), [update])
  const setPage = useCallback((v: number) => update('page', String(v)), [update])
  const reset = useCallback(() => router.push(pathname), [router, pathname])

  return [filters, { setStatus, setRepositoryId, setPage, reset }]
}
