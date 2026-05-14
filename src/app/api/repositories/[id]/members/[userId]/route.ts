import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/session'

const updateSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
})

async function verifyAdmin(repoId: string, requesterId: string) {
  const repo = await prisma.repository.findUnique({ where: { id: repoId } })
  if (!repo) return { allowed: false, notFound: true }
  if (repo.ownerId === requesterId) return { allowed: true, notFound: false }
  const membership = await prisma.teamMember.findUnique({
    where: { userId_repositoryId: { userId: requesterId, repositoryId: repoId } },
  })
  if (membership?.role !== 'ADMIN') return { allowed: false, notFound: false }
  return { allowed: true, notFound: false }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { id: repoId, userId: targetUserId } = await params

  const { allowed, notFound } = await verifyAdmin(repoId, auth)
  if (notFound) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
  if (!allowed) return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const member = await prisma.teamMember.update({
      where: { userId_repositoryId: { userId: targetUserId, repositoryId: repoId } },
      data: { role: parsed.data.role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, githubId: true } },
      },
    })

    return NextResponse.json({ data: member }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { id: repoId, userId: targetUserId } = await params

  const { allowed, notFound } = await verifyAdmin(repoId, auth)
  if (notFound) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
  if (!allowed) return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })

  // Prevent self-removal if sole admin
  if (targetUserId === auth) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  try {
    await prisma.teamMember.delete({
      where: { userId_repositoryId: { userId: targetUserId, repositoryId: repoId } },
    })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }
}
