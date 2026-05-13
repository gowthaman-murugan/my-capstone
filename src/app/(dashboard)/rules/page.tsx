'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { RulesTable } from '@/components/rules/RulesTable'
import { CreateRuleModal } from '@/components/rules/CreateRuleModal'
import { EmptyState, Button, Pagination, Spinner } from '@/components/ui'
import { useRules } from '@/hooks/useRules'
import { useRepositories } from '@/hooks/useRepositories'
import type { Rule } from '@/types'

export default function RuleListPage() {
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const { rules, meta, isLoading, error, createRule, updateRule } = useRules({ page })
  const { repositories } = useRepositories()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rules"
        description="Analysis rules for security, performance, and style checks"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Rule
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load rules: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          title="No rules configured"
          description="Create your first rule to start detecting issues in pull requests."
          action={<Button onClick={() => setModalOpen(true)}>Create Rule</Button>}
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      ) : (
        <>
          <RulesTable
            rules={rules}
            onToggle={(id, isEnabled) => updateRule(id, { isEnabled })}
            onEdit={(rule) => setEditingRule(rule)}
          />
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

      <CreateRuleModal
        open={modalOpen || editingRule !== null}
        onClose={() => { setModalOpen(false); setEditingRule(null) }}
        repositories={repositories}
        onCreate={createRule}
      />
    </div>
  )
}
