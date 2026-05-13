'use client'

import { useState } from 'react'
import { Modal, Input, Textarea, Select, Button } from '@/components/ui'
import type { Repository } from '@/types'

interface CreateRuleModalProps {
  open: boolean
  onClose: () => void
  repositories: Repository[]
  onCreate: (data: {
    name: string
    description?: string
    category: string
    severity: string
    pattern?: string
    repositoryId?: string
  }) => Promise<void>
}

const CATEGORY_OPTIONS = [
  { value: 'SECURITY', label: 'Security' },
  { value: 'PERFORMANCE', label: 'Performance' },
  { value: 'STYLE', label: 'Style' },
  { value: 'CORRECTNESS', label: 'Correctness' },
]

const SEVERITY_OPTIONS = [
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'ERROR', label: 'Error' },
  { value: 'CRITICAL', label: 'Critical' },
]

export function CreateRuleModal({ open, onClose, repositories, onCreate }: CreateRuleModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('SECURITY')
  const [severity, setSeverity] = useState('WARNING')
  const [pattern, setPattern] = useState('')
  const [repositoryId, setRepositoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const repoOptions = [
    { value: '', label: 'Global (all repositories)' },
    ...repositories.map((r) => ({ value: r.id, label: r.fullName })),
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onCreate({
        name,
        description: description || undefined,
        category,
        severity,
        pattern: pattern || undefined,
        repositoryId: repositoryId || undefined,
      })
      setName('')
      setDescription('')
      setCategory('SECURITY')
      setSeverity('WARNING')
      setPattern('')
      setRepositoryId('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Rule" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
          <Select label="Severity" value={severity} onChange={setSeverity} options={SEVERITY_OPTIONS} />
        </div>
        <Input
          label="Pattern (regex)"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="e.g. console\.log"
        />
        <Select
          label="Scope"
          value={repositoryId}
          onChange={setRepositoryId}
          options={repoOptions}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Rule
          </Button>
        </div>
      </form>
    </Modal>
  )
}
