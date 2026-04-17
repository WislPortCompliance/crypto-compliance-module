export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FCATrackerClient } from '../fca-tracker/FCATrackerClient'

export default async function MiCATrackerPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const stages = await prisma.fCAApplicationStage.findMany({
    where: { organisationId: orgId, framework: 'MICA' },
    include: { requirements: { orderBy: { createdAt: 'asc' } } },
    orderBy: { order: 'asc' },
  })

  return <FCATrackerClient stages={JSON.parse(JSON.stringify(stages))} framework="MICA" />
}
