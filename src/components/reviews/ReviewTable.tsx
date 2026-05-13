'use client'

import { Table, TableHeader, TableBody, TableHead } from '@/components/ui/Table'
import { ReviewRow } from './ReviewRow'
import type { Review } from '@/types'

interface ReviewTableProps {
  reviews: Review[]
}

export function ReviewTable({ reviews }: ReviewTableProps) {
  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead>Pull Request</TableHead>
          <TableHead>Repository</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Findings</TableHead>
          <TableHead>Date</TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
      </TableBody>
    </Table>
  )
}
