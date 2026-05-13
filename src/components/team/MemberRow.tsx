'use client'

import { TableRow, TableCell } from '@/components/ui/Table'
import { Avatar, Button, Select } from '@/components/ui'
import type { TeamMember, TeamRole } from '@/types'

interface MemberRowProps {
  member: TeamMember
  isAdmin: boolean
  onRoleChange: (userId: string, role: TeamRole) => void
  onRemove: (userId: string) => void
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
]

export function MemberRow({ member, isAdmin, onRoleChange, onRemove }: MemberRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar
            src={member.user.avatarUrl}
            alt={member.user.name}
            size="sm"
          />
          <div>
            <p className="font-medium text-gray-900">{member.user.name}</p>
            {member.user.githubLogin && (
              <p className="text-xs text-gray-500">@{member.user.githubLogin}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {isAdmin ? (
          <Select
            value={member.role}
            onChange={(v) => onRoleChange(member.user.id, v as TeamRole)}
            options={ROLE_OPTIONS}
          />
        ) : (
          <span className="text-sm capitalize text-gray-700">{member.role.toLowerCase()}</span>
        )}
      </TableCell>
      {isAdmin && (
        <TableCell>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRemove(member.user.id)}
          >
            Remove
          </Button>
        </TableCell>
      )}
    </TableRow>
  )
}
