'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { TeamMember, TeamRole } from '@/types'

export function useTeamMembers(repositoryId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: TeamMember[] }>(
    repositoryId ? `/api/repositories/${repositoryId}/members` : null,
    fetcher
  )

  async function inviteMember(body: { githubLogin: string; role: TeamRole }) {
    const res = await fetch(`/api/repositories/${repositoryId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error((err as { error?: string }).error ?? 'Failed to invite member')
    }
    await mutate()
    return res.json()
  }

  async function updateMemberRole(userId: string, role: TeamRole) {
    const res = await fetch(`/api/repositories/${repositoryId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error((err as { error?: string }).error ?? 'Failed to update role')
    }
    await mutate()
    return res.json()
  }

  async function removeMember(userId: string) {
    const res = await fetch(`/api/repositories/${repositoryId}/members/${userId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error((err as { error?: string }).error ?? 'Failed to remove member')
    }
    await mutate()
  }

  return {
    members: data?.data ?? [],
    isLoading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
  }
}
