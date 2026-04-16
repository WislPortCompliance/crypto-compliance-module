import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId

  const stages = await prisma.fCAApplicationStage.findMany({
    where: { organisationId: orgId },
    include: { requirements: { orderBy: { createdAt: 'asc' } } },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(stages)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  const body = await req.json()
  const { stageId, requirementId, status, notes } = body

  if (requirementId) {
    const updated = await prisma.stageRequirement.update({
      where: { id: requirementId },
      data: { status, ...(notes !== undefined && { notes }) },
    })
    return NextResponse.json(updated)
  }

  if (stageId) {
    const updated = await prisma.fCAApplicationStage.update({
      where: { id: stageId, organisationId: orgId },
      data: {
        status,
        ...(notes !== undefined && { notes }),
        ...(status === 'COMPLETE' && { completedAt: new Date() }),
      },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Missing id' }, { status: 400 })
}
