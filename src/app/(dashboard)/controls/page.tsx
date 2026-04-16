export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ControlsClient } from './ControlsClient'

export default async function ControlsPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const [controls, categories, principles] = await Promise.all([
    prisma.complianceControl.findMany({
      where: { organisationId: orgId },
      include: {
        category: true,
        fcaPrinciple: true,
        owner: { select: { id: true, name: true } },
        evidence: true,
      },
      orderBy: [{ category: { code: 'asc' } }, { controlRef: 'asc' }],
    }),
    prisma.controlCategory.findMany({ orderBy: { name: 'asc' } }),
    prisma.fCAPrinciple.findMany({ orderBy: { number: 'asc' } }),
  ])

  return (
    <ControlsClient
      controls={JSON.parse(JSON.stringify(controls))}
      categories={JSON.parse(JSON.stringify(categories))}
      principles={JSON.parse(JSON.stringify(principles))}
    />
  )
}
