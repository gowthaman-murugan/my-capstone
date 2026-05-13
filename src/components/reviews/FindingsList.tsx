'use client'

import { FindingCard } from './FindingCard'
import type { Finding } from '@/types'

interface FindingsListProps {
  findings: Finding[]
}

export function FindingsList({ findings }: FindingsListProps) {
  return (
    <div className="flex flex-col gap-3">
      {findings.map((f) => (
        <FindingCard key={f.id} finding={f} />
      ))}
    </div>
  )
}
