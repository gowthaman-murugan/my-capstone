'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { Repository, ListResponse } from '@/types'

export function useRepositories(page = 1) {
  const { data, error, isLoading, mutate } = useSWR<ListResponse<Repository>>(
    `/api/repositories?page=${page}&limit=20`,
    fetcher
  )

  async function createRepository(body: {
    githubRepoId: number
    fullName: string
    installationId: number
    webhookSecret: string
  }) {
    const res = await fetch('/api/repositories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error((err as { error?: string }).error ?? 'Failed to create repository')
    }
    await mutate()
    return res.json()
  }

  async function updateRepository(id: string, body: { webhookSecret?: string; isActive?: boolean }) {
    const res = await fetch(`/api/repositories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error((err as { error?: string }).error ?? 'Failed to update repository')
    }
    await mutate()
    return res.json()
  }

  return {
    repositories: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    createRepository,
    updateRepository,
    mutate,
  }
}
