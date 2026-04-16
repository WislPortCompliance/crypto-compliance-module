import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SetupWizardClient } from './SetupWizardClient'

export const dynamic = 'force-dynamic'

export default async function SetupWizardPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    include: {
      profile: {
        include: {
          assetTypes: true,
          operatingLocations: true,
          serviceTypes: true,
        },
      },
    },
  })

  return <SetupWizardClient org={JSON.parse(JSON.stringify(org))} />
}
