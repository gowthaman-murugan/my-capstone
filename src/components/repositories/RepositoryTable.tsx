'use client'

import { useRouter } from 'next/navigation'
import { Table, TableHeader, TableBody, TableHead } from '@/components/ui/Table'
import { RepositoryRow } from './RepositoryRow'
import type { Repository } from '@/types'

interface RepositoryTableProps {
  repositories: Repository[]
}

export function RepositoryTable({ repositories }: RepositoryTableProps) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead>Repository</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead></TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {repositories.map((repo) => (
          <RepositoryRow
            key={repo.id}
            repository={repo}
            onSettings={(id) => router.push(`/repositories/${id}/settings`)}
          />
        ))}
      </TableBody>
    </Table>
  )
}
