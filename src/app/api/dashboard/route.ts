import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  if (!orgId) return NextResponse.json({ error: 'No organisation' }, { status: 400 })

  const [controls, stages, alerts, actions, auditLogs] = await Promise.all([
    prisma.complianceControl.findMany({ where: { organisationId: orgId }, select: { status: true, nextReviewDate: true } }),
    prisma.fCAApplicationStage.findMany({ where: { organisationId: orgId }, orderBy: { order: 'asc' } }),
    prisma.alert.findMany({ where: { organisationId: orgId, read: false }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.actionItem.findMany({ where: { organisationId: orgId }, orderBy: { dueDate: 'asc' }, take: 8, include: { owner: { select: { name: true } } } }),
    prisma.auditLog.findMany({ where: { organisationId: orgId }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } }),
  ])

  const total = controls.length
  const compliant = controls.filter(c => c.status === 'COMPLIANT').length
  const partial = controls.filter(c => c.status === 'PARTIALLY_COMPLIANT').length
  const nonCompliant = controls.filter(c => c.status === 'NON_COMPLIANT').length
  const notAssessed = controls.filter(c => c.status === 'NOT_ASSESSED').length

  const score = total > 0 ? Math.round(((compliant + partial * 0.5) / total) * 100) : 0

  const now = new Date()
  const overdue = actions.filter(a => a.dueDate && new Date(a.dueDate) < now && a.status !== 'COMPLETE').length
  const upcoming = controls.filter(c => c.nextReviewDate && new Date(c.nextReviewDate) <= new Date(now.getTime() + 30 * 86400000)).length

  const completedStages = stages.filter(s => s.status === 'COMPLETE').length
  const applicationProgress = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0

  return NextResponse.json({
    score,
    totalControls: total,
    compliantControls: compliant,
    partialControls: partial,
    nonCompliantControls: nonCompliant,
    notAssessedControls: notAssessed,
    overdueActions: overdue,
    upcomingReviews: upcoming,
    applicationProgress,
    stages,
    alerts,
    actions,
    recentActivity: auditLogs,
  })
}
