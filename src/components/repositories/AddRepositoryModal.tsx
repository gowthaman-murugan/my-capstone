'use client'

import { useState } from 'react'
import { Modal, Input, Button } from '@/components/ui'

interface AddRepositoryModalProps {
  open: boolean
  onClose: () => void
  onCreate: (data: {
    githubRepoId: number
    fullName: string
    installationId: number
    webhookSecret: string
  }) => Promise<void>
}

export function AddRepositoryModal({ open, onClose, onCreate }: AddRepositoryModalProps) {
  const [fullName, setFullName] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.includes('/')) {
      setError('fullName must be in "owner/repo" format')
      return
    }
    if (webhookSecret.length < 16) {
      setError('Webhook secret must be at least 16 characters')
      return
    }

    setLoading(true)
    try {
      await onCreate({
        githubRepoId: Math.floor(Math.random() * 1_000_000),
        fullName,
        installationId: 0,
        webhookSecret,
      })
      setFullName('')
      setWebhookSecret('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Repository">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="GitHub Repository"
          placeholder="owner/repo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Webhook Secret"
          type="password"
          placeholder="At least 16 characters"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add Repository
          </Button>
        </div>
      </form>
    </Modal>
  )
}
