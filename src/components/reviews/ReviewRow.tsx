'use client'

import Link from 'next/link'
import { TableRow, TableCell } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import type { Review } from '@/types'

interface ReviewRowProps {
  review: Review
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ReviewRow({ review }: ReviewRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/reviews/${review.id}`}
            className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            #{review.prNumber} {review.prTitle}
          </Link>
          <a
            href={review.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            View on GitHub ↗
          </a>
        </div>
      </TableCell>
      <TableCell className="text-gray-500">{review.repository.fullName}</TableCell>
      <TableCell>
        <StatusBadge status={review.status} />
      </TableCell>
      <TableCell>
        <span className="font-medium">{review._count.findings}</span>
        <span className="ml-1 text-gray-400">findings</span>
      </TableCell>
      <TableCell className="text-gray-500">{formatDate(review.createdAt)}</TableCell>
    </TableRow>
  )
}
