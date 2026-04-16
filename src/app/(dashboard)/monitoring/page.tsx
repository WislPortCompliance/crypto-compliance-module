export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MonitoringClient } from './MonitoringClient'

export default async function MonitoringPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const [alerts, actions, risks] = await Promise.all([
    prisma.alert.findMany({ where: { organisationId: orgId }, orderBy: [{ read: 'asc' }, { createdAt: 'desc' }] }),
    prisma.actionItem.findMany({ where: { organisationId: orgId }, include: { owner: { select: { name: true } } }, orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }] }),
    prisma.riskRegister.findMany({ where: { organisationId: orgId }, orderBy: { riskScore: 'desc' } }),
  ])

  return <MonitoringClient
    alerts={JSON.parse(JSON.stringify(alerts))}
    actions={JSON.parse(JSON.stringify(actions))}
    risks={JSON.parse(JSON.stringify(risks))}
  />
}
