export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReportsClient } from './ReportsClient'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const [controls, stages, regulations, risks, org] = await Promise.all([
    prisma.complianceControl.findMany({
      where: { organisationId: orgId },
      include: { category: true, fcaPrinciple: true, owner: { select: { name: true } } },
      orderBy: [{ category: { code: 'asc' } }, { controlRef: 'asc' }],
    }),
    prisma.fCAApplicationStage.findMany({ where: { organisationId: orgId }, include: { requirements: true }, orderBy: { order: 'asc' } }),
    prisma.complianceMapEntry.findMany({ where: { organisationId: orgId, applicable: true }, include: { regulation: true } }),
    prisma.riskRegister.findMany({ where: { organisationId: orgId }, orderBy: { riskScore: 'desc' } }),
    prisma.organisation.findUnique({ where: { id: orgId } }),
  ])

  return (
    <ReportsClient
      controls={JSON.parse(JSON.stringify(controls))}
      stages={JSON.parse(JSON.stringify(stages))}
      regulations={JSON.parse(JSON.stringify(regulations))}
      risks={JSON.parse(JSON.stringify(risks))}
      org={JSON.parse(JSON.stringify(org))}
    />
  )
}
