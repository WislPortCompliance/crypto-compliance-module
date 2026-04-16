'use client'

import { useState } from 'react'
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

const auditActionLabels: Record<string, string> = {
  CONTROL_STATUS_UPDATE: 'Control status updated',
  STAGE_STATUS_UPDATE: 'Stage status updated',
  DOCUMENT_UPLOAD: 'Document uploaded',
  ALERT_CREATED: 'Alert created',
  ACTION_CREATED: 'Action item created',
  USER_LOGIN: 'User signed in',
}

export function DocumentsClient({ documents, auditLogs }: { documents: any[]; auditLogs: any[] }) {
  const [tab, setTab] = useState<'documents' | 'audit'>('documents')
  const [filterType, setFilterType] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', type: 'POLICY' })
  const [localDocs, setLocalDocs] = useState(documents)

  const filtered = localDocs.filter(d => !filterType || d.type === filterType)

  const grouped = filtered.reduce((acc: Record<string, any[]>, doc) => {
    if (!acc[doc.type]) acc[doc.type] = []
    acc[doc.type].push(doc)
    return acc
  }, {})

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const doc = await res.json()
    setLocalDocs(prev => [doc, ...prev])
    setShowUpload(false)
    setForm({ name: '', description: '', type: 'POLICY' })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents & Evidence</h1>
          <p className="text-gray-500 text-sm mt-0.5">{localDocs.length} documents · Audit trail</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary">+ Add Document</button>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {(['documents', 'audit'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'documents' ? `Documents (${localDocs.length})` : `Audit Log (${auditLogs.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'documents' && (
        <>
          <div className="flex gap-2">
            <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${!filterType ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>All</button>
            {['POLICY', 'PROCEDURE', 'EVIDENCE', 'CERTIFICATE', 'REPORT'].map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? '' : t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filterType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {Object.entries(grouped).map(([type, docs]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{typeIcons[type] ?? '📄'}</span>
                  <h2 className="text-sm font-semibold text-gray-700">{type}</h2>
                  <span className="text-xs text-gray-400">{docs.length}</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {docs.map((doc: any) => (
                    <div key={doc.id} className="card p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{typeIcons[doc.type] ?? '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                          {doc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[doc.type] ?? typeColors.OTHER}`}>{doc.type}</span>
                            <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'audit' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 table-header">Timestamp</th>
                <th className="text-left px-5 py-3 table-header">Action</th>
                <th className="text-left px-5 py-3 table-header">Entity</th>
                <th className="text-left px-5 py-3 table-header">User</th>
                <th className="text-left px-5 py-3 table-header">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auditLogs.map((log: any) => (
                <tr key={log.id}>
                  <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium text-gray-700">{auditActionLabels[log.action] ?? log.action}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-400">{log.entityType}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{log.user?.name ?? 'System'}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {log.newValues && JSON.stringify(log.newValues).slice(0, 60)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {['POLICY', 'PROCEDURE', 'EVIDENCE', 'CERTIFICATE', 'REPORT', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Add Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
