'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { RepositoryTable } from '@/components/repositories/RepositoryTable'
import { AddRepositoryModal } from '@/components/repositories/AddRepositoryModal'
import { EmptyState, Button, Pagination, Spinner } from '@/components/ui'
import { useRepositories } from '@/hooks/useRepositories'

export default function RepositoryListPage() {
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const { repositories, meta, isLoading, error, createRepository } = useRepositories(page)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Repositories"
        description="GitHub repositories connected to CodeReview Bot"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Repository
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load repositories: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : repositories.length === 0 ? (
        <EmptyState
          title="No repositories"
          description="Add your first GitHub repository to start receiving automated PR reviews."
          action={<Button onClick={() => setModalOpen(true)}>Add Repository</Button>}
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
        />
      ) : (
        <>
          <RepositoryTable repositories={repositories} />
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

      <AddRepositoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createRepository}
      />
    </div>
  )
}
