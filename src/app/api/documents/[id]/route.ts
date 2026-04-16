import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = (session.user as any).organisationId

  const doc = await prisma.document.findFirst({
    where: { id: params.id, organisationId: orgId },
  })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(doc)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = (session.user as any).organisationId

  const body = await req.json()
  const doc = await prisma.document.updateMany({
    where: { id: params.id, organisationId: orgId },
    data: body,
  })
  return NextResponse.json(doc)
}
