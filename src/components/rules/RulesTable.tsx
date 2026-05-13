'use client'

import { Table, TableHeader, TableBody, TableHead } from '@/components/ui/Table'
import { RuleRow } from './RuleRow'
import type { Rule } from '@/types'

interface RulesTableProps {
  rules: Rule[]
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (rule: Rule) => void
}

export function RulesTable({ rules, onToggle, onEdit }: RulesTableProps) {
  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Scope</TableHead>
          <TableHead>Enabled</TableHead>
          <TableHead></TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} onToggle={onToggle} onEdit={onEdit} />
        ))}
      </TableBody>
    </Table>
  )
}
