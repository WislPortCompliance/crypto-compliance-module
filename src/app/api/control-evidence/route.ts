import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── Create evidence ────────────────────────────────────────────────────────
// Body shape (one of three modes):
//   { controlId, description }                                  → note-only
//   { controlId, documentId, description? }                     → link existing doc
//   { controlId, newDocument: { name, content, type?, mimeType?, fileSize? }, description? }
//                                                               → attach new doc (content inline)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  const userId = (session.user as any).id
  const body = await req.json()
  const { controlId, description, documentId, newDocument } = body

  if (!controlId) {
    return NextResponse.json({ error: 'controlId required' }, { status: 400 })
  }
  if (!description && !documentId && !newDocument) {
    return NextResponse.json({ error: 'Provide description, documentId, or newDocument' }, { status: 400 })
  }

  // Verify the control belongs to this org (guards against cross-org evidence attach)
  const control = await prisma.complianceControl.findFirst({
    where: { id: controlId, organisationId: orgId },
  })
  if (!control) return NextResponse.json({ error: 'Control not found' }, { status: 404 })

  // If newDocument payload provided, create the Document first
  let finalDocId: string | null = documentId ?? null
  if (newDocument) {
    const doc = await prisma.document.create({
      data: {
        name: newDocument.name ?? 'Evidence document',
        description: newDocument.description ?? `Evidence attached to control ${control.controlRef}`,
        content: newDocument.content ?? null,
        type: newDocument.type ?? 'EVIDENCE',
        mimeType: newDocument.mimeType ?? 'text/markdown',
        fileSize: newDocument.fileSize ?? (typeof newDocument.content === 'string' ? newDocument.content.length : null),
        organisationId: orgId,
        uploadedBy: userId,
        isTemplate: false,
      },
    })
    finalDocId = doc.id
  } else if (documentId) {
    // Verify linked doc belongs to this org
    const doc = await prisma.document.findFirst({ where: { id: documentId, organisationId: orgId } })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const evidence = await prisma.controlEvidence.create({
    data: {
      controlId,
      documentId: finalDocId,
      description: description?.trim() || null,
    },
    include: { document: true },
  })

  // Bump lastReviewed on the control so the "evidence supporting current status" has a fresh timestamp
  await prisma.complianceControl.update({
    where: { id: controlId },
    data: { lastReviewed: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      action: 'CONTROL_EVIDENCE_ADDED',
      entityType: 'ComplianceControl',
      entityId: controlId,
      newValues: {
        evidenceId: evidence.id,
        mode: newDocument ? 'upload' : documentId ? 'link' : 'note',
        documentId: finalDocId,
        hasText: !!description,
      },
      userId,
      organisationId: orgId,
    },
  })

  return NextResponse.json(evidence, { status: 201 })
}

// ─── Delete evidence ────────────────────────────────────────────────────────
// Accepts { id } via JSON body. Org-scoped via the parent control.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  const userId = (session.user as any).id
  const body = await req.json().catch(() => ({}))
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const evidence = await prisma.controlEvidence.findFirst({
    where: { id, control: { organisationId: orgId } },
  })
  if (!evidence) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.controlEvidence.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      action: 'CONTROL_EVIDENCE_REMOVED',
      entityType: 'ComplianceControl',
      entityId: evidence.controlId,
      oldValues: { evidenceId: id, documentId: evidence.documentId, description: evidence.description },
      userId,
      organisationId: orgId,
    },
  })

  return NextResponse.json({ success: true })
}
