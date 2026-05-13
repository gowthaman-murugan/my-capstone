'use client'

import type { ReviewStatus, Severity, FindingCategory, TeamRole } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  color?: 'gray' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'purple'
  className?: string
}

const colorMap: Record<NonNullable<BadgeProps['color']>, string> = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
}

export function Badge({ children, color = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color]} ${className}`}
    >
      {children}
    </span>
  )
}

const statusColorMap: Record<ReviewStatus, BadgeProps['color']> = {
  COMPLETED: 'green',
  IN_PROGRESS: 'blue',
  PENDING: 'yellow',
  FAILED: 'red',
}

const statusLabelMap: Record<ReviewStatus, string> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  PENDING: 'Pending',
  FAILED: 'Failed',
}

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return <Badge color={statusColorMap[status]}>{statusLabelMap[status]}</Badge>
}

const severityColorMap: Record<Severity, BadgeProps['color']> = {
  CRITICAL: 'red',
  ERROR: 'orange',
  WARNING: 'yellow',
  INFO: 'blue',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge color={severityColorMap[severity]}>
      {severity.charAt(0) + severity.slice(1).toLowerCase()}
    </Badge>
  )
}

const categoryColorMap: Record<FindingCategory, BadgeProps['color']> = {
  SECURITY: 'red',
  PERFORMANCE: 'orange',
  STYLE: 'purple',
  CORRECTNESS: 'blue',
}

export function CategoryBadge({ category }: { category: FindingCategory }) {
  return (
    <Badge color={categoryColorMap[category]}>
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </Badge>
  )
}

const roleColorMap: Record<TeamRole, BadgeProps['color']> = {
  ADMIN: 'purple',
  MEMBER: 'blue',
  VIEWER: 'gray',
}

export function RoleBadge({ role }: { role: TeamRole }) {
  return (
    <Badge color={roleColorMap[role]}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </Badge>
  )
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge color={isActive ? 'green' : 'gray'}>{isActive ? 'Active' : 'Inactive'}</Badge>
  )
}
