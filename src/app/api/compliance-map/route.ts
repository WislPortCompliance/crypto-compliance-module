import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId

  const entries = await prisma.complianceMapEntry.findMany({
    where: { organisationId: orgId },
    include: { regulation: true },
    orderBy: { regulation: { jurisdiction: 'asc' } },
  })

  return NextResponse.json(entries)
}
