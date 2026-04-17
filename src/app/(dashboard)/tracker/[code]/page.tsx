export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FCATrackerClient } from '../../fca-tracker/FCATrackerClient'

// Supported codes (lower-case URL form → Framework enum value)
const CODE_TO_FRAMEWORK: Record<string, string> = {
  gfsc: 'GFSC',
  mas: 'MAS',
  vara: 'VARA',
  finma: 'FINMA',
  sfc: 'SFC',
  asic: 'ASIC',
  csa: 'CSA',
  bsa: 'BSA',
}

export default async function TrackerByCodePage({ params }: { params: { code: string } }) {
  const framework = CODE_TO_FRAMEWORK[params.code.toLowerCase()]
  if (!framework) notFound()

  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const stages = await prisma.fCAApplicationStage.findMany({
    where: { organisationId: orgId, framework: framework as any },
    include: { requirements: { orderBy: { createdAt: 'asc' } } },
    orderBy: { order: 'asc' },
  })

  return <FCATrackerClient stages={JSON.parse(JSON.stringify(stages))} framework={framework} />
}
