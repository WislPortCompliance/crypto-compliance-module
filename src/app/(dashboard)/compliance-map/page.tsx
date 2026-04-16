export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ComplianceMapClient } from './ComplianceMapClient'

export default async function ComplianceMapPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const entries = await prisma.complianceMapEntry.findMany({
    where: { organisationId: orgId },
    include: { regulation: true },
    orderBy: { regulation: { jurisdiction: 'asc' } },
  })

  return <ComplianceMapClient entries={JSON.parse(JSON.stringify(entries))} />
}
