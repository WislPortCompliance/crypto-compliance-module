export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const [controls, stages, alerts, actions, auditLogs] = await Promise.all([
    prisma.complianceControl.findMany({ where: { organisationId: orgId }, select: { status: true, nextReviewDate: true } }),
    prisma.fCAApplicationStage.findMany({ where: { organisationId: orgId }, orderBy: { order: 'asc' } }),
    prisma.alert.findMany({ where: { organisationId: orgId }, orderBy: [{ read: 'asc' }, { createdAt: 'desc' }], take: 7 }),
    prisma.actionItem.findMany({ where: { organisationId: orgId }, include: { owner: { select: { name: true } } }, orderBy: { dueDate: 'asc' }, take: 6 }),
    prisma.auditLog.findMany({ where: { organisationId: orgId }, include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ])

  const total = controls.length
  const compliant = controls.filter(c => c.status === 'COMPLIANT').length
  const partial = controls.filter(c => c.status === 'PARTIALLY_COMPLIANT').length
  const nonCompliant = controls.filter(c => c.status === 'NON_COMPLIANT').length
  const notAssessed = controls.filter(c => c.status === 'NOT_ASSESSED').length
  const score = total > 0 ? Math.round(((compliant + partial * 0.5) / total) * 100) : 0

  const now = new Date()
  const overdue = actions.filter(a => a.dueDate && new Date(a.dueDate) < now && a.status !== 'COMPLETE').length
  const upcomingReviews = controls.filter(c => c.nextReviewDate && new Date(c.nextReviewDate) <= new Date(now.getTime() + 30 * 86400000)).length
  const completedStages = stages.filter(s => s.status === 'COMPLETE').length
  const applicationProgress = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0

  return (
    <DashboardClient
      score={score}
      totalControls={total}
      compliantControls={compliant}
      partialControls={partial}
      nonCompliantControls={nonCompliant}
      notAssessedControls={notAssessed}
      overdueActions={overdue}
      upcomingReviews={upcomingReviews}
      applicationProgress={applicationProgress}
      stages={JSON.parse(JSON.stringify(stages))}
      alerts={JSON.parse(JSON.stringify(alerts))}
      actions={JSON.parse(JSON.stringify(actions))}
      recentActivity={JSON.parse(JSON.stringify(auditLogs))}
      userName={session?.user?.name ?? 'User'}
      orgName={(session?.user as any)?.organisationName ?? 'Your Organisation'}
    />
  )
}
