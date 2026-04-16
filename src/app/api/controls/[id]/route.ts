import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  const { id } = params

  const control = await prisma.complianceControl.findFirst({ where: { id, organisationId: orgId } })
  if (!control) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Log before deleting
  await prisma.auditLog.create({
    data: {
      action: 'CONTROL_DELETED',
      entityType: 'ComplianceControl',
      entityId: id,
      oldValues: { controlRef: control.controlRef, name: control.name, status: control.status },
      userId: (session.user as any).id,
      organisationId: orgId,
    },
  })

  // Delete evidence links first
  await prisma.controlEvidence.deleteMany({ where: { controlId: id } })
  // Delete regulation mappings
  await prisma.regulationControl.deleteMany({ where: { controlId: id } })
  // Delete the control
  await prisma.complianceControl.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
