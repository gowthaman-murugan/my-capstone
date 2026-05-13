'use client'

import { TableRow, TableCell } from '@/components/ui/Table'
import { SeverityBadge, CategoryBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Rule } from '@/types'

interface RuleRowProps {
  rule: Rule
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (rule: Rule) => void
}

export function RuleRow({ rule, onToggle, onEdit }: RuleRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{rule.name}</TableCell>
      <TableCell>
        <CategoryBadge category={rule.category} />
      </TableCell>
      <TableCell>
        <SeverityBadge severity={rule.severity} />
      </TableCell>
      <TableCell className="text-gray-500">
        {rule.repository ? rule.repository.fullName : 'Global'}
      </TableCell>
      <TableCell>
        <button
          onClick={() => onToggle(rule.id, !rule.isEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            rule.isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              rule.isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
          Edit
        </Button>
      </TableCell>
    </TableRow>
  )
}
