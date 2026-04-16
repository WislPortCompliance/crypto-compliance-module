import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = (session.user as any).organisationId

  const docs = await prisma.document.findMany({
    where: { organisationId: orgId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = (session.user as any).organisationId
  const userId = (session.user as any).id

  const body = await req.json()
  const doc = await prisma.document.create({
    data: { ...body, organisationId: orgId, uploadedBy: userId },
  })
  return NextResponse.json(doc)
}
