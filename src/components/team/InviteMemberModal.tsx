'use client'

import { useState } from 'react'
import { Modal, Input, Select, Button } from '@/components/ui'
import type { TeamRole } from '@/types'

interface InviteMemberModalProps {
  open: boolean
  onClose: () => void
  onInvite: (data: { githubLogin: string; role: TeamRole }) => Promise<void>
}

const ROLE_OPTIONS = [
  { value: 'VIEWER', label: 'Viewer — read-only access' },
  { value: 'MEMBER', label: 'Member — view and filter' },
  { value: 'ADMIN', label: 'Admin — full access' },
]

export function InviteMemberModal({ open, onClose, onInvite }: InviteMemberModalProps) {
  const [githubLogin, setGithubLogin] = useState('')
  const [role, setRole] = useState<TeamRole>('MEMBER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onInvite({ githubLogin, role })
      setGithubLogin('')
      setRole('MEMBER')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="GitHub Username"
          placeholder="e.g. octocat"
          value={githubLogin}
          onChange={(e) => setGithubLogin(e.target.value)}
          required
        />
        <Select
          label="Role"
          value={role}
          onChange={(v) => setRole(v as TeamRole)}
          options={ROLE_OPTIONS}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Send Invite
          </Button>
        </div>
      </form>
    </Modal>
  )
}
