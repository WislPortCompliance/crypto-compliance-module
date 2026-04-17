export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ControlsClient } from './ControlsClient'

export default async function ControlsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const orgId = (session?.user as any)?.organisationId

  const [controls, categories, principles, regulations, users] = await Promise.all([
    prisma.complianceControl.findMany({
      where: { organisationId: orgId },
      include: {
        category: true,
        fcaPrinciple: true,
        owner: { select: { id: true, name: true, email: true } },
        evidence: {
          include: { document: { select: { id: true, name: true, type: true, mimeType: true } } },
          orderBy: { addedAt: 'desc' },
        },
        regulationMappings: {
          include: {
            regulation: { select: { id: true, code: true, name: true, jurisdiction: true } },
          },
        },
      },
      orderBy: [{ category: { code: 'asc' } }, { controlRef: 'asc' }],
    }),
    prisma.controlCategory.findMany({ orderBy: { name: 'asc' } }),
    prisma.fCAPrinciple.findMany({ orderBy: { number: 'asc' } }),
    prisma.regulation.findMany({ orderBy: { jurisdiction: 'asc' } }),
    prisma.user.findMany({
      where: { organisationId: orgId, active: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <ControlsClient
      controls={JSON.parse(JSON.stringify(controls))}
      categories={JSON.parse(JSON.stringify(categories))}
      principles={JSON.parse(JSON.stringify(principles))}
      regulations={JSON.parse(JSON.stringify(regulations))}
      users={JSON.parse(JSON.stringify(users))}
    />
  )
}
