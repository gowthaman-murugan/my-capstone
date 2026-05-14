import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'

/**
 * Returns the authenticated user's DB id, or a 401 NextResponse.
 * Usage: const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
 */
export async function requireAuth(): Promise<string | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session.user.id
}
