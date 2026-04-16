'use client'

import { useState, useMemo } from 'react'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'

const STATUS_OPTIONS = ['COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'NOT_ASSESSED']
const STATUS_LABELS: Record<string, string> = {
  COMPLIANT: 'Compliant',
  PARTIALLY_COMPLIANT: 'Partially Compliant',
  NON_COMPLIANT: 'Non-Compliant',
  NOT_ASSESSED: 'Not Assessed',
}

export function ControlsClient({ controls, categories, principles }: { controls: any[]; categories: any[]; principles: any[] }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [localControls, setLocalControls] = useState(controls)

  const filtered = useMemo(() => {
    return localControls.filter(c => {
      if (filterCat && c.categoryId !== filterCat) return false
      if (filterStatus && c.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        return c.name.toLowerCase().includes(q) || c.controlRef.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [localControls, filterCat, filterStatus, search])

  const byCategory = useMemo(() => {
    const map: Record<string, { category: any; controls: any[] }> = {}
    for (const c of filtered) {
      if (!map[c.categoryId]) map[c.categoryId] = { category: c.category, controls: [] }
      map[c.categoryId].controls.push(c)
    }
    return Object.values(map)
  }, [filtered])

  const stats = useMemo(() => ({
    total: localControls.length,
    compliant: localControls.filter(c => c.status === 'COMPLIANT').length,
    partial: localControls.filter(c => c.status === 'PARTIALLY_COMPLIANT').length,
    nonCompliant: localControls.filter(c => c.status === 'NON_COMPLIANT').length,
    notAssessed: localControls.filter(c => c.status === 'NOT_ASSESSED').length,
  }), [localControls])

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      await fetch('/api/controls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      setLocalControls(prev => prev.map(c => c.id === id ? { ...c, status, lastReviewed: new Date().toISOString() } : c))
      if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status }))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="flex h-full">
      {/* Main panel */}
      <div className={`flex-1 flex flex-col overflow-hidden ${selected ? 'border-r border-gray-200' : ''}`}>
        <div className="p-6 border-b border-gray-100 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Controls</h1>
              <p className="text-gray-500 text-sm mt-0.5">{stats.total} controls across {categories.length} domains</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4">
            {[
              { label: 'Compliant', count: stats.compliant, color: 'bg-green-500' },
              { label: 'Partial', count: stats.partial, color: 'bg-amber-500' },
              { label: 'Non-Compliant', count: stats.nonCompliant, color: 'bg-red-500' },
              { label: 'Not Assessed', count: stats.notAssessed, color: 'bg-gray-400' },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setFilterStatus(filterStatus === s.label.toUpperCase().replace('-', '_') ? '' : STATUS_OPTIONS.find(o => STATUS_LABELS[o] === s.label) ?? '')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${s.color}`}></span>
                <span>{s.label}</span>
                <span className="font-semibold text-gray-900">{s.count}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search controls..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {byCategory.map(({ category, controls: catControls }) => (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-gray-700">{category.name}</h2>
                <span className="text-xs text-gray-400">{catControls.length} controls</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 table-header">Ref</th>
                      <th className="text-left px-4 py-3 table-header">Control</th>
                      <th className="text-left px-4 py-3 table-header">FCA Principle</th>
                      <th className="text-left px-4 py-3 table-header">Status</th>
                      <th className="text-left px-4 py-3 table-header">Owner</th>
                      <th className="text-left px-4 py-3 table-header">Next Review</th>
                      <th className="text-left px-4 py-3 table-header">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {catControls.map(ctrl => (
                      <tr
                        key={ctrl.id}
                        onClick={() => setSelected(ctrl)}
                        className={`cursor-pointer transition-colors hover:bg-blue-50/50 ${selected?.id === ctrl.id ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{ctrl.controlRef}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{ctrl.name}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {ctrl.fcaPrinciple ? `P${ctrl.fcaPrinciple.number}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusSelect
                            status={ctrl.status}
                            disabled={updatingId === ctrl.id}
                            onChange={s => updateStatus(ctrl.id, s)}
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{ctrl.owner?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          <span className={ctrl.nextReviewDate && new Date(ctrl.nextReviewDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                            {formatDate(ctrl.nextReviewDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{ctrl.evidence?.length ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-96 flex flex-col overflow-hidden bg-white">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-gray-400">{selected.controlRef}</div>
              <h3 className="text-base font-semibold text-gray-900 mt-0.5">{selected.name}</h3>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</div>
              <StatusSelect
                status={selected.status}
                disabled={updatingId === selected.id}
                onChange={s => updateStatus(selected.id, s)}
                large
              />
            </div>
            <DetailRow label="Category" value={selected.category?.name} />
            <DetailRow label="FCA Principle" value={selected.fcaPrinciple ? `Principle ${selected.fcaPrinciple.number}: ${selected.fcaPrinciple.name}` : '—'} />
            <DetailRow label="Owner" value={selected.owner?.name ?? '—'} />
            <DetailRow label="Last Reviewed" value={formatDate(selected.lastReviewed)} />
            <DetailRow label="Next Review" value={formatDate(selected.nextReviewDate)} />
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</div>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
            </div>
            {selected.guidance && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Guidance</div>
                <p className="text-sm text-gray-600 leading-relaxed">{selected.guidance}</p>
              </div>
            )}
            {selected.notes && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</div>
                <p className="text-sm text-gray-600 leading-relaxed">{selected.notes}</p>
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Evidence ({selected.evidence?.length ?? 0})</div>
              {selected.evidence?.length > 0 ? (
                <div className="space-y-1">
                  {selected.evidence.map((ev: any) => (
                    <div key={ev.id} className="text-xs text-gray-600 flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {ev.description ?? 'Evidence document'}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No evidence attached</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusSelect({ status, onChange, disabled, large }: { status: string; onChange: (s: string) => void; disabled?: boolean; large?: boolean }) {
  const colors: Record<string, string> = {
    COMPLIANT: 'bg-green-50 text-green-700 border-green-200',
    PARTIALLY_COMPLIANT: 'bg-amber-50 text-amber-700 border-amber-200',
    NON_COMPLIANT: 'bg-red-50 text-red-700 border-red-200',
    NOT_ASSESSED: 'bg-gray-50 text-gray-600 border-gray-200',
  }
  return (
    <select
      value={status}
      onChange={e => { e.stopPropagation(); onChange(e.target.value) }}
      disabled={disabled}
      onClick={e => e.stopPropagation()}
      className={`border rounded font-medium cursor-pointer ${large ? 'text-sm px-3 py-1.5 w-full' : 'text-xs px-2 py-1'} ${colors[status] ?? colors.NOT_ASSESSED} disabled:opacity-50`}
    >
      <option value="COMPLIANT">Compliant</option>
      <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
      <option value="NON_COMPLIANT">Non-Compliant</option>
      <option value="NOT_ASSESSED">Not Assessed</option>
    </select>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  )
}
