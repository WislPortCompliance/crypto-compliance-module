import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = (session.user as any).organisationId

  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    include: {
      profile: { include: { assetTypes: true, operatingLocations: true, serviceTypes: true } },
      entities: true,
      users: { select: { id: true, name: true, email: true, role: true, active: true } },
    },
  })
  return NextResponse.json(org)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = (session.user as any).organisationId

  const body = await req.json()
  const updated = await prisma.organisation.update({
    where: { id: orgId },
    data: body,
  })
  return NextResponse.json(updated)
}
