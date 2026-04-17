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
    include: {
      requirements: {
        orderBy: { createdAt: 'asc' },
        include: {
          actionItem: {
            include: { owner: { select: { name: true, email: true } } },
          },
        },
      },
    },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(stages)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  const userId = (session.user as any).id
  const body = await req.json()
  const { stageId, requirementId, status, notes, action } = body

  // ─── START a requirement ────────────────────────────────────────────────
  // Creates an ActionItem, clones the template into a draft Document,
  // links both to the requirement, flips status → IN_PROGRESS.
  if (requirementId && action === 'start') {
    const reqRow = await prisma.stageRequirement.findFirst({
      where: { id: requirementId, stage: { organisationId: orgId } },
      include: { template: true, stage: true },
    })
    if (!reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (reqRow.actionItemId) {
      return NextResponse.json({ error: 'Already started' }, { status: 409 })
    }

    // Clone template into a draft working document (if template exists)
    let draftDocId: string | null = reqRow.documentId ?? null
    if (reqRow.template) {
      const draft = await prisma.document.create({
        data: {
          name: `${reqRow.title} — Draft`,
          description: `Working draft cloned from template ${reqRow.template.name}`,
          type: reqRow.template.type,
          content: reqRow.template.content,
          isTemplate: false,
          organisationId: orgId,
          uploadedBy: userId,
        },
      })
      draftDocId = draft.id
    }

    // Create action item (30-day default due date, MEDIUM priority)
    const due = new Date()
    due.setDate(due.getDate() + 30)
    const actionItem = await prisma.actionItem.create({
      data: {
        title: `Complete: ${reqRow.title}`,
        description: `FCA requirement under stage "${reqRow.stage.title}". Use the linked draft template as the starting point for evidence capture.`,
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: due,
        ownerId: userId,
        organisationId: orgId,
        controlRef: `FCA-${reqRow.stage.stage}`,
      },
    })

    // Link action item + draft doc to requirement; flip status
    const updated = await prisma.stageRequirement.update({
      where: { id: requirementId },
      data: {
        status: 'IN_PROGRESS',
        actionItemId: actionItem.id,
        documentId: draftDocId,
      },
      include: {
        actionItem: { include: { owner: { select: { name: true, email: true } } } },
      },
    })

    // Also bump parent stage to IN_PROGRESS if it's NOT_STARTED
    if (reqRow.stage.status === 'NOT_STARTED') {
      await prisma.fCAApplicationStage.update({
        where: { id: reqRow.stage.id },
        data: { status: 'IN_PROGRESS' },
      })
    }

    return NextResponse.json(updated)
  }

  // ─── Update requirement status (tick / untick) ──────────────────────────
  if (requirementId) {
    const existing = await prisma.stageRequirement.findFirst({
      where: { id: requirementId, stage: { organisationId: orgId } },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updateData: any = { status, ...(notes !== undefined && { notes }) }
    // If completing, also mark any linked action item as COMPLETE
    if (status === 'COMPLETE' && existing.actionItemId) {
      await prisma.actionItem.update({
        where: { id: existing.actionItemId },
        data: { status: 'COMPLETE', completedAt: new Date() },
      })
    }

    const updated = await prisma.stageRequirement.update({
      where: { id: requirementId },
      data: updateData,
      include: {
        actionItem: { include: { owner: { select: { name: true, email: true } } } },
      },
    })
    return NextResponse.json(updated)
  }

  // ─── Update stage status ────────────────────────────────────────────────
  if (stageId) {
    const result = await prisma.fCAApplicationStage.updateMany({
      where: { id: stageId, organisationId: orgId },
      data: {
        status,
        ...(notes !== undefined && { notes }),
        ...(status === 'COMPLETE' && { completedAt: new Date() }),
      },
    })
    if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ id: stageId, status, count: result.count })
  }

  return NextResponse.json({ error: 'Missing id' }, { status: 400 })
}
