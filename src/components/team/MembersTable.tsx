'use client'

import { Table, TableHeader, TableBody, TableHead } from '@/components/ui/Table'
import { MemberRow } from './MemberRow'
import type { TeamMember, TeamRole } from '@/types'

interface MembersTableProps {
  members: TeamMember[]
  isAdmin: boolean
  onRoleChange: (userId: string, role: TeamRole) => void
  onRemove: (userId: string) => void
}

export function MembersTable({ members, isAdmin, onRoleChange, onRemove }: MembersTableProps) {
  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          {isAdmin && <TableHead></TableHead>}
        </tr>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isAdmin={isAdmin}
            onRoleChange={onRoleChange}
            onRemove={onRemove}
          />
        ))}
      </TableBody>
    </Table>
  )
}
