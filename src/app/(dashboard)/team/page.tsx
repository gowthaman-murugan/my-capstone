'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { MembersTable } from '@/components/team/MembersTable'
import { InviteMemberModal } from '@/components/team/InviteMemberModal'
import { EmptyState, Button, Select, Spinner } from '@/components/ui'
import { useRepositories } from '@/hooks/useRepositories'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import type { TeamRole } from '@/types'

export default function TeamManagementPage() {
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { repositories, isLoading: reposLoading } = useRepositories()
  const { members, isLoading, error, inviteMember, updateMemberRole, removeMember } = useTeamMembers(
    selectedRepoId ?? (repositories[0]?.id ?? null)
  )

  const effectiveRepoId = selectedRepoId ?? repositories[0]?.id ?? null

  const repoOptions = repositories.map((r) => ({ value: r.id, label: r.fullName }))

  if (reposLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team"
        description="Manage team members and their access roles"
        action={
          effectiveRepoId ? (
            <Button onClick={() => setModalOpen(true)}>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Invite Member
            </Button>
          ) : undefined
        }
      />

      {repositories.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Repository:</span>
          <Select
            value={effectiveRepoId ?? ''}
            onChange={(v) => setSelectedRepoId(v)}
            options={repoOptions}
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load team members: {error.message}
        </div>
      )}

      {repositories.length === 0 ? (
        <EmptyState
          title="No repositories"
          description="Add a repository first before managing team members."
        />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          title="No team members"
          description="Invite team members to give them access to this repository's reviews."
          action={<Button onClick={() => setModalOpen(true)}>Invite Member</Button>}
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      ) : (
        <MembersTable
          members={members}
          isAdmin={true}
          onRoleChange={(userId, role: TeamRole) =>
            updateMemberRole(userId, role)
          }
          onRemove={(userId) => removeMember(userId)}
        />
      )}

      {effectiveRepoId && (
        <InviteMemberModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onInvite={inviteMember}
        />
      )}
    </div>
  )
}
