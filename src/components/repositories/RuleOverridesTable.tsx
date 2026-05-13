'use client'

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select } from '@/components/ui'
import type { Rule } from '@/types'

interface RuleOverrideRowProps {
  rule: Rule
  onSeverityChange: (id: string, severity: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

const SEVERITY_OPTIONS = [
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'ERROR', label: 'Error' },
  { value: 'CRITICAL', label: 'Critical' },
]

function RuleOverrideRow({ rule, onSeverityChange, onToggle }: RuleOverrideRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{rule.name}</TableCell>
      <TableCell>
        <Select
          value={rule.severity}
          onChange={(v) => onSeverityChange(rule.id, v)}
          options={SEVERITY_OPTIONS}
        />
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
    </TableRow>
  )
}

interface RuleOverridesTableProps {
  rules: Rule[]
  onSeverityChange: (id: string, severity: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

export function RuleOverridesTable({ rules, onSeverityChange, onToggle }: RuleOverridesTableProps) {
  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead>Rule</TableHead>
          <TableHead>Severity Override</TableHead>
          <TableHead>Enabled</TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <RuleOverrideRow
            key={rule.id}
            rule={rule}
            onSeverityChange={onSeverityChange}
            onToggle={onToggle}
          />
        ))}
      </TableBody>
    </Table>
  )
}
