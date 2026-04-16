import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = (session.user as any).organisationId

  const alerts = await prisma.alert.findMany({
    where: { organisationId: orgId },
    orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(alerts)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const updated = await prisma.alert.update({ where: { id }, data: { read: true } })
  return NextResponse.json(updated)
}
