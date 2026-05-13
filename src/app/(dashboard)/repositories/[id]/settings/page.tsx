'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { WebhookConfigCard } from '@/components/repositories/WebhookConfigCard'
import { RuleOverridesTable } from '@/components/repositories/RuleOverridesTable'
import { EmptyState, Spinner } from '@/components/ui'
import { useRepositories } from '@/hooks/useRepositories'
import { useRules } from '@/hooks/useRules'
import type { Repository } from '@/types'

export default function RepositorySettingsPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useSWR<{ data: Repository }>(
    id ? `/api/repositories/${id}` : null,
    fetcher
  )
  const repository = data?.data
  const { updateRepository } = useRepositories()
  const { rules, updateRule } = useRules({ repositoryId: id ?? '' })

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">{repository.fullName}</p>
        </div>
        <Link href={`/repositories/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </Link>
      </div>

      <WebhookConfigCard
        repository={repository}
        onUpdate={(body) => updateRepository(id!, body)}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Rule Overrides</h2>
        {rules.length === 0 ? (
          <EmptyState
            title="No rules configured"
            description="Create rules on the Rules page to override severity for this repository."
          />
        ) : (
          <RuleOverridesTable
            rules={rules}
            onSeverityChange={(ruleId, severity) => updateRule(ruleId, { severity })}
            onToggle={(ruleId, isEnabled) => updateRule(ruleId, { isEnabled })}
          />
        )}
      </div>
    </div>
  )
}
