export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FCATrackerClient } from './FCATrackerClient'

export default async function FCATrackerPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const stages = await prisma.fCAApplicationStage.findMany({
    where: { organisationId: orgId },
    include: { requirements: { orderBy: { createdAt: 'asc' } } },
    orderBy: { order: 'asc' },
  })

  return <FCATrackerClient stages={JSON.parse(JSON.stringify(stages))} />
}
