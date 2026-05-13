'use client'

import { useState } from 'react'
import { SeverityBadge, CategoryBadge } from '@/components/ui/Badge'
import type { Finding } from '@/types'

interface FindingCardProps {
  finding: Finding
}

export function FindingCard({ finding }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false)

  const location = finding.lineEnd && finding.lineEnd !== finding.lineStart
    ? `${finding.filePath}:${finding.lineStart}–${finding.lineEnd}`
    : `${finding.filePath}:${finding.lineStart}`

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-2">
        <SeverityBadge severity={finding.severity} />
        <CategoryBadge category={finding.category} />
        <code className="ml-auto rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">
          {location}
        </code>
      </div>
      <p className="mt-2 text-sm text-gray-900">{finding.message}</p>
      {finding.suggestion && (
        <div className="mt-2">
          <button
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            onClick={() => setExpanded((v) => !v)}
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {expanded ? 'Hide suggestion' : 'Show suggestion'}
          </button>
          {expanded && (
            <p className="mt-1.5 rounded bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
              {finding.suggestion}
            </p>
          )}
        </div>
      )}
      {finding.rule && (
        <p className="mt-2 text-xs text-gray-400">Rule: {finding.rule.name}</p>
      )}
    </div>
  )
}
