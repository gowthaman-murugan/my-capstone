'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { ActiveBadge } from '@/components/ui/Badge'
import { Card, Spinner, Button } from '@/components/ui'
import type { Repository } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function RepositoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, error, isLoading } = useSWR<{ data: Repository }>(
    id ? `/api/repositories/${id}` : null,
    fetcher
  )
  const repository = data?.data

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  if (error || !repository) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error?.message ?? 'Repository not found'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{repository.fullName}</h1>
          <ActiveBadge isActive={repository.isActive} />
        </div>
        <Link href={`/repositories/${id}/settings`}>
          <Button variant="secondary" size="sm">Settings</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Repository Info">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Owner</dt>
              <dd className="font-medium text-gray-900">{repository.owner}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Repository</dt>
              <dd className="font-medium text-gray-900">{repository.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Added</dt>
              <dd className="font-medium text-gray-900">{formatDate(repository.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd><ActiveBadge isActive={repository.isActive} /></dd>
            </div>
          </dl>
        </Card>

        <Card title="Quick Links">
          <div className="flex flex-col gap-2">
            <Link
              href={`/reviews?repositoryId=${repository.id}`}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              View all reviews for this repository →
            </Link>
            <Link
              href={`/rules?repositoryId=${repository.id}`}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              View rules for this repository →
            </Link>
            <Link
              href={`/repositories/${id}/settings`}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Configure webhook settings →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
