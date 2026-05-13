'use client'

import { signOut, useSession } from 'next-auth/react'
import { Avatar, Button } from '@/components/ui'

export function UserMenu() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3">
      <Avatar
        src={session.user.image}
        alt={session.user.name ?? 'User'}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{session.user.name}</p>
        <p className="truncate text-xs text-gray-500">{session.user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: '/login' })}
        title="Sign out"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 000-2H4V5h6a1 1 0 000-2H3zm11.293 3.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L15.586 11H9a1 1 0 010-2h6.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </Button>
    </div>
  )
}
