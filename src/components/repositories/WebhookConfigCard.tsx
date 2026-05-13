'use client'

import { useState } from 'react'
import { Card, Input, Button } from '@/components/ui'
import type { Repository } from '@/types'

interface WebhookConfigCardProps {
  repository: Repository
  onUpdate: (data: { webhookSecret?: string; isActive?: boolean }) => Promise<void>
}

export function WebhookConfigCard({ repository, onUpdate }: WebhookConfigCardProps) {
  const [secret, setSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSecretUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onUpdate({ webhookSecret: secret })
      setSecret('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive() {
    setSaving(true)
    try {
      await onUpdate({ isActive: !repository.isActive })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Webhook Configuration">
      <div className="space-y-6">
        <form onSubmit={handleSecretUpdate} className="flex flex-col gap-3">
          <div className="relative">
            <Input
              label="Webhook Secret"
              type={showSecret ? 'text' : 'password'}
              placeholder="Update webhook secret…"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-3 top-7 text-xs text-gray-500 hover:text-gray-700"
            >
              {showSecret ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" loading={saving} disabled={!secret}>
            Update Secret
          </Button>
        </form>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Webhook Active</p>
            <p className="text-xs text-gray-500">
              {repository.isActive ? 'Receiving and processing webhooks' : 'Not processing webhooks'}
            </p>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
              repository.isActive ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                repository.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </Card>
  )
}
