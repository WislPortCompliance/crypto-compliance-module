import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const where: any = { organisationId: orgId }
  if (category) where.categoryId = category
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { controlRef: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const controls = await prisma.complianceControl.findMany({
    where,
    include: {
      category: true,
      fcaPrinciple: true,
      owner: { select: { id: true, name: true, email: true } },
      evidence: { include: { document: true } },
      regulationMappings: { include: { regulation: true } },
    },
    orderBy: [{ category: { code: 'asc' } }, { controlRef: 'asc' }],
  })

  return NextResponse.json(controls)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  const body = await req.json()
  const { controlRef, name, description, categoryId, fcaPrincipleId, status, notes } = body

  if (!controlRef || !name || !description || !categoryId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const control = await prisma.complianceControl.create({
    data: {
      controlRef,
      name,
      description,
      categoryId,
      fcaPrincipleId: fcaPrincipleId || null,
      status: status || 'NOT_ASSESSED',
      notes: notes || null,
      organisationId: orgId,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'CONTROL_CREATED',
      entityType: 'ComplianceControl',
      entityId: control.id,
      newValues: { controlRef, name, status: control.status },
      userId: (session.user as any).id,
      organisationId: orgId,
    },
  })

  return NextResponse.json(control, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  const body = await req.json()
  const { id, status, notes, name, description, categoryId, fcaPrincipleId, ownerId, nextReviewDate } = body

  const control = await prisma.complianceControl.findFirst({ where: { id, organisationId: orgId } })
  if (!control) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.complianceControl.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(name && { name }),
      ...(description && { description }),
      ...(categoryId && { categoryId }),
      ...(fcaPrincipleId !== undefined && { fcaPrincipleId: fcaPrincipleId || null }),
      ...(ownerId !== undefined && { ownerId }),
      ...(nextReviewDate !== undefined && { nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null }),
      lastReviewed: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'CONTROL_STATUS_UPDATE',
      entityType: 'ComplianceControl',
      entityId: id,
      oldValues: { status: control.status, name: control.name },
      newValues: { status: updated.status, name: updated.name },
      userId: (session.user as any).id,
      organisationId: orgId,
    },
  })

  return NextResponse.json(updated)
}
