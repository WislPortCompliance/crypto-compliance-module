'use client'

import Link from 'next/link'
import { formatDate } from '@/lib/utils'

const typeColors: Record<string, string> = {
  POLICY: 'bg-blue-100 text-blue-700',
  PROCEDURE: 'bg-purple-100 text-purple-700',
  EVIDENCE: 'bg-green-100 text-green-700',
  CERTIFICATE: 'bg-amber-100 text-amber-700',
  REPORT: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

const typeIcons: Record<string, string> = {
  POLICY: '📋',
  PROCEDURE: '📝',
  EVIDENCE: '🔍',
  CERTIFICATE: '🏆',
  REPORT: '📊',
  OTHER: '📄',
}

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} className="text-2xl font-bold text-gray-900 mt-2 mb-1 border-b-2 border-gray-200 pb-2">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="text-lg font-bold text-gray-800 mt-6 mb-2">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="text-base font-semibold text-gray-700 mt-4 mb-1">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('---')) {
      elements.push(<hr key={key++} className="border-gray-200 my-4" />)
    } else if (line.startsWith('| ')) {
      // Table — collect all table rows
      const tableLines: string[] = []
      let j = i
      while (j < lines.length && lines[j].startsWith('|')) {
        tableLines.push(lines[j])
        j++
      }
      i = j - 1

      const rows = tableLines.filter(r => !r.match(/^\|[-| ]+\|$/))
      elements.push(
        <div key={key++} className="overflow-x-auto my-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <tbody>
              {rows.map((row, ri) => {
                const cells = row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1)
                const isHeader = ri === 0
                return (
                  <tr key={ri} className={isHeader ? 'bg-gray-50 font-semibold' : ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    {cells.map((cell, ci) => (
                      isHeader
                        ? <th key={ci} className="px-3 py-2 text-left text-xs text-gray-600 uppercase tracking-wide border-b border-gray-200">{cell.trim()}</th>
                        : <td key={ci} className="px-3 py-2 text-gray-700 border-b border-gray-100">{cell.trim()}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Collect consecutive bullet lines
      const bullets: string[] = []
      let j = i
      while (j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('* '))) {
        bullets.push(lines[j].slice(2))
        j++
      }
      i = j - 1
      elements.push(
        <ul key={key++} className="list-disc list-outside ml-5 space-y-1 my-2">
          {bullets.map((b, bi) => (
            <li key={bi} className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: formatInline(b) }} />
          ))}
        </ul>
      )
    } else if (line.match(/^\d+\. /)) {
      // Numbered list
      const items: string[] = []
      let j = i
      while (j < lines.length && lines[j].match(/^\d+\. /)) {
        items.push(lines[j].replace(/^\d+\. /, ''))
        j++
      }
      i = j - 1
      elements.push(
        <ol key={key++} className="list-decimal list-outside ml-5 space-y-1 my-2">
          {items.map((item, ii) => (
            <li key={ii} className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ol>
      )
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key++} className="border-l-4 border-blue-400 pl-4 py-1 my-3 bg-blue-50 rounded-r-lg">
          <p className="text-sm text-blue-800 italic">{line.slice(2)}</p>
        </blockquote>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />)
    } else {
      elements.push(
        <p key={key++} className="text-sm text-gray-700 leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }
  }

  return elements
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs font-mono">$1</code>')
}

export function DocumentViewerClient({ document }: { document: any }) {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/documents" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Documents
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">{document.name}</span>
      </div>

      {/* Document metadata bar */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
              {typeIcons[document.type] ?? '📄'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{document.name}</h1>
              {document.description && (
                <p className="text-sm text-gray-500 mt-0.5">{document.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColors[document.type] ?? typeColors.OTHER}`}>
                  {document.type}
                </span>
                {document.version && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">v{document.version}</span>
                )}
                <span className="text-xs text-gray-400">{formatDate(document.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => window.print()}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Document content */}
      {document.content ? (
        <div className="card">
          {/* Document paper */}
          <div className="bg-white rounded-xl p-10 shadow-inner border border-gray-100 min-h-96">
            <div className="max-w-3xl mx-auto font-[Georgia,serif] print:block">
              {renderContent(document.content)}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-4">📄</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No content available</h2>
          <p className="text-sm text-gray-400 max-w-sm">
            This document was uploaded as a file reference. Use the template builder to create documents with viewable content.
          </p>
        </div>
      )}
    </div>
  )
}
