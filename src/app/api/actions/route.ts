import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = (session.user as any).organisationId

  const actions = await prisma.actionItem.findMany({
    where: { organisationId: orgId },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })
  return NextResponse.json(actions)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = (session.user as any).organisationId
  const { id, status } = await req.json()
  const result = await prisma.actionItem.updateMany({
    where: { id, organisationId: orgId },
    data: { status, ...(status === 'COMPLETE' && { completedAt: new Date() }) },
  })
  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id, status, count: result.count })
}
