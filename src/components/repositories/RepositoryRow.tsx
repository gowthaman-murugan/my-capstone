'use client'

import Link from 'next/link'
import { TableRow, TableCell } from '@/components/ui/Table'
import { ActiveBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Repository } from '@/types'

interface RepositoryRowProps {
  repository: Repository
  onSettings: (id: string) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function RepositoryRow({ repository, onSettings }: RepositoryRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/repositories/${repository.id}`}
          className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {repository.fullName}
        </Link>
      </TableCell>
      <TableCell>
        <ActiveBadge isActive={repository.isActive} />
      </TableCell>
      <TableCell className="text-gray-500">{formatDate(repository.updatedAt)}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSettings(repository.id)}
        >
          Settings
        </Button>
      </TableCell>
    </TableRow>
  )
}
