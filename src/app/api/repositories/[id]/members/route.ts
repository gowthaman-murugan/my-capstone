import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/session'

const inviteSchema = z.object({
  githubLogin: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
})

async function verifyAccess(repoId: string, userId: string, requireAdmin = false) {
  const repo = await prisma.repository.findUnique({ where: { id: repoId } })
  if (!repo) return { allowed: false, notFound: true }
  if (repo.ownerId === userId) return { allowed: true, notFound: false }
  const membership = await prisma.teamMember.findUnique({
    where: { userId_repositoryId: { userId, repositoryId: repoId } },
  })
  if (!membership) return { allowed: false, notFound: false }
  if (requireAdmin && membership.role !== 'ADMIN') return { allowed: false, notFound: false }
  return { allowed: true, notFound: false }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { id: repoId } = await params

  const { allowed, notFound } = await verifyAccess(repoId, auth)
  if (notFound) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const members = await prisma.teamMember.findMany({
      where: { repositoryId: repoId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, githubId: true } },
      },
    })
    return NextResponse.json({ data: members }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { id: repoId } = await params

  const { allowed, notFound } = await verifyAccess(repoId, auth, true)
  if (notFound) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
  if (!allowed) return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })

  try {
    const body = await req.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { githubLogin, role } = parsed.data

    // Lookup the user by githubId (they must have signed in at least once)
    const invitee = await prisma.user.findFirst({ where: { githubId: githubLogin } })
    if (!invitee) {
      return NextResponse.json(
        { error: 'User not found. They must sign in to CodeReview Bot before being invited.' },
        { status: 404 }
      )
    }

    const member = await prisma.teamMember.upsert({
      where: { userId_repositoryId: { userId: invitee.id, repositoryId: repoId } },
      update: { role },
      create: { userId: invitee.id, repositoryId: repoId, role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, githubId: true } },
      },
    })

    return NextResponse.json({ data: member }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
  }
}
