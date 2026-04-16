export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const [org, users] = await Promise.all([
    prisma.organisation.findUnique({ where: { id: orgId } }),
    prisma.user.findMany({ where: { organisationId: orgId }, orderBy: { name: 'asc' } }),
  ])

  return <SettingsClient org={JSON.parse(JSON.stringify(org))} users={JSON.parse(JSON.stringify(users))} currentUser={session?.user as any} />
}
