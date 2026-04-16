export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DocumentViewerClient } from './DocumentViewerClient'

export default async function DocumentViewerPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const document = await prisma.document.findFirst({
    where: { id: params.id, organisationId: orgId },
  })

  if (!document) notFound()

  return <DocumentViewerClient document={JSON.parse(JSON.stringify(document))} />
}
