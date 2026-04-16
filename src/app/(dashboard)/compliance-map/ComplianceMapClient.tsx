'use client'

import { useState } from 'react'
import { getStatusColor, getStatusLabel } from '@/lib/utils'

const jurisdictionColors: Record<string, string> = {
  'UK': 'bg-blue-100 text-blue-800',
  'EU': 'bg-purple-100 text-purple-800',
  'US': 'bg-red-100 text-red-800',
  'Global': 'bg-green-100 text-green-800',
  'US/Global': 'bg-orange-100 text-orange-800',
}

export function ComplianceMapClient({ entries }: { entries: any[] }) {
  const [filter, setFilter] = useState<'all' | 'applicable' | 'gaps'>('applicable')
  const [selected, setSelected] = useState<any | null>(null)

  const displayed = entries.filter(e => {
    if (filter === 'applicable') return e.applicable
    if (filter === 'gaps') return e.applicable && e.status !== 'COMPLIANT'
    return true
  })

  const applicable = entries.filter(e => e.applicable)
  const compliant = applicable.filter(e => e.status === 'COMPLIANT').length
  const gaps = applicable.filter(e => e.status === 'NON_COMPLIANT' || e.status === 'PARTIALLY_COMPLIANT').length
  const notAssessed = applicable.filter(e => e.status === 'NOT_ASSESSED').length

  const byJurisdiction = displayed.reduce((acc: Record<string, any[]>, e) => {
    const j = e.regulation.jurisdiction
    if (!acc[j]) acc[j] = []
    acc[j].push(e)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Map</h1>
        <p className="text-gray-500 text-sm mt-0.5">Regulatory obligations based on your organisation profile and activities</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-2xl font-bold text-gray-900">{applicable.length}</div>
          <div className="text-sm font-medium text-gray-700">Applicable Regulations</div>
          <div className="text-xs text-gray-400 mt-0.5">out of {entries.length} total</div>
        </div>
        <div className="card p-5">
          <div className="text-2xl font-bold text-green-600">{compliant}</div>
          <div className="text-sm font-medium text-gray-700">Compliant</div>
          <div className="text-xs text-gray-400 mt-0.5">{applicable.length > 0 ? Math.round((compliant / applicable.length) * 100) : 0}% of applicable</div>
        </div>
        <div className="card p-5">
          <div className="text-2xl font-bold text-red-600">{gaps}</div>
          <div className="text-sm font-medium text-gray-700">Compliance Gaps</div>
          <div className="text-xs text-gray-400 mt-0.5">require remediation</div>
        </div>
        <div className="card p-5">
          <div className="text-2xl font-bold text-gray-500">{notAssessed}</div>
          <div className="text-sm font-medium text-gray-700">Not Assessed</div>
          <div className="text-xs text-gray-400 mt-0.5">pending assessment</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'applicable', 'gaps'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {f === 'all' ? 'All Regulations' : f === 'applicable' ? 'Applicable Only' : 'Gaps Only'}
          </button>
        ))}
      </div>

      {/* Map grid by jurisdiction */}
      <div className="space-y-6">
        {Object.entries(byJurisdiction).map(([jurisdiction, regs]) => (
          <div key={jurisdiction}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${jurisdictionColors[jurisdiction] ?? 'bg-gray-100 text-gray-700'}`}>
                {jurisdiction}
              </span>
              <span className="text-xs text-gray-400">{regs.length} regulation{regs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {regs.map((entry: any) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    selected?.id === entry.id ? 'border-blue-500 shadow-md' :
                    !entry.applicable ? 'border-gray-100 bg-gray-50 opacity-60' :
                    'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-900">{entry.regulation.code.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                    {!entry.applicable && <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">N/A</span>}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mb-1">{entry.regulation.name}</div>
                  <div className="text-xs text-gray-400 mb-3 line-clamp-2">{entry.regulation.description}</div>
                  {entry.applicable && (
                    <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusColor(entry.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        entry.status === 'COMPLIANT' ? 'bg-green-500' :
                        entry.status === 'PARTIALLY_COMPLIANT' ? 'bg-amber-500' :
                        entry.status === 'NON_COMPLIANT' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></span>
                      {getStatusLabel(entry.status)}
                    </div>
                  )}
                  {entry.regulation.regulator && (
                    <div className="text-xs text-gray-400 mt-2">Regulator: {entry.regulation.regulator}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">{selected.regulation.jurisdiction}</div>
              <h3 className="text-base font-semibold text-gray-900">{selected.regulation.name}</h3>
              {selected.regulation.fullName && (
                <div className="text-xs text-gray-500 mt-0.5">{selected.regulation.fullName}</div>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full font-medium border ${getStatusColor(selected.status)}`}>
              {getStatusLabel(selected.status)}
            </div>
            {selected.regulation.description && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Overview</div>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.regulation.description}</p>
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Regulator</div>
              <p className="text-sm text-gray-700">{selected.regulation.regulator ?? '—'}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Applicable to You</div>
              <span className={`text-sm font-medium ${selected.applicable ? 'text-green-600' : 'text-gray-400'}`}>
                {selected.applicable ? 'Yes — regulation applies to your activities' : 'No — out of scope for current profile'}
              </span>
            </div>
            {selected.notes && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</div>
                <p className="text-sm text-gray-600">{selected.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
