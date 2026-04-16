export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const typeLabels: Record<string, string> = {
  POLICY: 'Policy',
  PROCEDURE: 'Procedure',
  EVIDENCE: 'Evidence',
  CERTIFICATE: 'Certificate',
  REPORT: 'Report',
  OTHER: 'Document',
}

const typeColors: Record<string, string> = {
  POLICY: 'bg-blue-100 text-blue-700 border-blue-200',
  PROCEDURE: 'bg-purple-100 text-purple-700 border-purple-200',
  EVIDENCE: 'bg-green-100 text-green-700 border-green-200',
  CERTIFICATE: 'bg-amber-100 text-amber-700 border-amber-200',
  REPORT: 'bg-orange-100 text-orange-700 border-orange-200',
  OTHER: 'bg-gray-100 text-gray-600 border-gray-200',
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let inList = false

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-6 space-y-1 my-3">
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-700 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={i} className="text-2xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-200">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={i} className="text-lg font-bold text-gray-900 mt-5 mb-2">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={i} className="text-base font-semibold text-gray-800 mt-4 mb-1.5">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('> ')) {
      flushList()
      elements.push(
        <blockquote key={i} className="border-l-4 border-blue-400 pl-4 py-2 my-3 bg-blue-50 rounded-r-lg">
          <p className="text-sm text-blue-800 italic leading-relaxed">{line.slice(2)}</p>
        </blockquote>
      )
    } else if (line.startsWith('| ') || line.startsWith('|---')) {
      // table - collect consecutive table lines
      flushList()
      const tableLines: string[] = [line]
      while (i + 1 < lines.length && (lines[i + 1].startsWith('| ') || lines[i + 1].startsWith('|---'))) {
        i++
        tableLines.push(lines[i])
      }
      const rows = tableLines.filter(l => !l.startsWith('|---') && !l.startsWith('| ---') && !l.match(/^\|[-| ]+\|$/))
      if (rows.length > 0) {
        const header = rows[0].split('|').filter(c => c.trim()).map(c => c.trim())
        const body = rows.slice(1).map(r => r.split('|').filter(c => c.trim()).map(c => c.trim()))
        elements.push(
          <div key={i} className="overflow-x-auto my-4">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {header.map((h, hi) => (
                    <th key={hi} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {body.map((row, ri) => (
                  <tr key={ri} className="hover:bg-gray-50/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-gray-700" dangerouslySetInnerHTML={{ __html: renderInline(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    } else if (line.match(/^[-*] /)) {
      inList = true
      listItems.push(line.slice(2))
    } else if (line.match(/^\d+\. /)) {
      flushList()
      const num = line.match(/^(\d+)\. (.*)/)
      if (num) {
        elements.push(
          <div key={i} className="flex gap-3 my-1.5">
            <span className="text-xs font-bold text-blue-600 mt-0.5 flex-shrink-0 w-5 text-right">{num[1]}.</span>
            <span className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderInline(num[2]) }} />
          </div>
        )
      }
    } else if (line.trim() === '---' || line.trim() === '***') {
      flushList()
      elements.push(<hr key={i} className="my-5 border-gray-200" />)
    } else if (line.trim() === '') {
      flushList()
      if (i > 0) elements.push(<div key={i} className="h-2" />)
    } else {
      flushList()
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed my-1"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      )
    }
  }
  flushList()
  return elements
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-blue-700">$1</code>')
}

export default async function DocumentViewerPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.organisationId

  const document = await prisma.document.findFirst({
    where: { id: params.id, organisationId: orgId },
  })

  if (!document) notFound()

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Toolbar */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
        <Link href="/documents" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Documents
        </Link>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded border font-medium ${typeColors[document.type] ?? typeColors.OTHER}`}>
            {typeLabels[document.type] ?? document.type}
          </span>
        </div>
      </div>

      {/* Paper */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-sm" style={{ minHeight: '1123px' }}>
        {/* Document header */}
        <div className="border-b border-gray-200 px-12 py-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CryptoComply · BlockChain Securities Ltd</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{document.name}</h1>
              {document.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{document.description}</p>
              )}
            </div>
            <div className="flex-shrink-0 text-right space-y-1">
              <div className="text-xs text-gray-400">Document Type</div>
              <span className={`inline-block text-xs px-2.5 py-1 rounded border font-medium ${typeColors[document.type] ?? typeColors.OTHER}`}>
                {typeLabels[document.type] ?? document.type}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-8 text-xs text-gray-500">
            <div>
              <span className="font-medium text-gray-400 uppercase tracking-wide">Created</span>
              <div className="text-gray-700 font-medium mt-0.5">{formatDate(document.createdAt)}</div>
            </div>
            <div>
              <span className="font-medium text-gray-400 uppercase tracking-wide">Last Updated</span>
              <div className="text-gray-700 font-medium mt-0.5">{formatDate(document.updatedAt)}</div>
            </div>
            <div>
              <span className="font-medium text-gray-400 uppercase tracking-wide">Document ID</span>
              <div className="font-mono text-gray-500 mt-0.5">{document.id.slice(0, 12).toUpperCase()}</div>
            </div>
            <div>
              <span className="font-medium text-gray-400 uppercase tracking-wide">Status</span>
              <div className="text-green-700 font-medium mt-0.5">Active</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-12 py-8">
          {document.content ? (
            <div className="prose-document max-w-none">
              {renderContent(document.content)}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No content available for this document.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-12 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            BlockChain Securities Ltd · CryptoComply Compliance Platform
          </div>
          <div className="text-xs text-gray-400">
            {typeLabels[document.type] ?? 'Document'} · {formatDate(document.updatedAt)}
          </div>
        </div>
      </div>
    </div>
  )
}
