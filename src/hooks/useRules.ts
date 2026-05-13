'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { Rule, ListResponse, FindingCategory } from '@/types'

interface RuleFilters {
  repositoryId?: string
  category?: FindingCategory | ''
  page?: number
}

export function useRules(filters: RuleFilters = {}) {
  const params = new URLSearchParams()
  params.set('page', String(filters.page ?? 1))
  if (filters.repositoryId) params.set('repositoryId', filters.repositoryId)
  if (filters.category) params.set('category', filters.category)

  const { data, error, isLoading, mutate } = useSWR<ListResponse<Rule>>(
    `/api/rules?${params.toString()}`,
    fetcher
  )

  async function createRule(body: {
    name: string
    description?: string
    category: string
    severity: string
    pattern?: string
    repositoryId?: string
  }) {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error((err as { error?: string }).error ?? 'Failed to create rule')
    }
    await mutate()
    return res.json()
  }

  async function updateRule(id: string, body: { severity?: string; isEnabled?: boolean; pattern?: string }) {
    const res = await fetch(`/api/rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error((err as { error?: string }).error ?? 'Failed to update rule')
    }
    await mutate()
    return res.json()
  }

  return {
    rules: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    createRule,
    updateRule,
    mutate,
  }
}
