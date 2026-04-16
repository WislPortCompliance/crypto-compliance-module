export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrganisationClient } from './OrganisationClient'

export default async function OrganisationPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    include: {
      profile: { include: { assetTypes: true, operatingLocations: true, serviceTypes: true } },
      entities: true,
      users: { select: { id: true, name: true, email: true, role: true, active: true }, orderBy: { name: 'asc' } },
    },
  })

  return <OrganisationClient org={JSON.parse(JSON.stringify(org))} />
}
