export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentsClient } from './DocumentsClient'

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const [documents, auditLogs] = await Promise.all([
    prisma.document.findMany({
      where: { organisationId: orgId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.findMany({
      where: { organisationId: orgId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return <DocumentsClient documents={JSON.parse(JSON.stringify(documents))} auditLogs={JSON.parse(JSON.stringify(auditLogs))} />
}
