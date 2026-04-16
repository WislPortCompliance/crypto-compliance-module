export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ComplianceMapClient } from './ComplianceMapClient'

export default async function ComplianceMapPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const orgId = (session?.user as any)?.organisationId

  const [entries, profile] = await Promise.all([
    prisma.complianceMapEntry.findMany({
      where: { organisationId: orgId },
      include: {
        regulation: {
          include: {
            controlMappings: {
              include: {
                control: {
                  select: { id: true, controlRef: true, name: true, status: true },
                },
              },
            },
          },
        },
      },
      orderBy: { regulation: { jurisdiction: 'asc' } },
    }),
    prisma.organisationProfile.findUnique({
      where: { organisationId: orgId },
      include: {
        operatingLocations: true,
        assetTypes: true,
        serviceTypes: true,
      },
    }),
  ])

  return (
    <ComplianceMapClient
      entries={JSON.parse(JSON.stringify(entries))}
      profile={JSON.parse(JSON.stringify(profile))}
    />
  )
}
