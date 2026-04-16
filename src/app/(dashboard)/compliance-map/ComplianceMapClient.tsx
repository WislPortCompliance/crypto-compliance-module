'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getStatusColor, getStatusLabel } from '@/lib/utils'

const jurisdictionColors: Record<string, string> = {
  'UK': 'bg-blue-100 text-blue-800',
  'EU': 'bg-purple-100 text-purple-800',
  'US': 'bg-red-100 text-red-800',
  'Global': 'bg-green-100 text-green-800',
  'US/Global': 'bg-orange-100 text-orange-800',
  'Japan': 'bg-pink-100 text-pink-800',
  'Australia': 'bg-yellow-100 text-yellow-800',
  'Canada': 'bg-teal-100 text-teal-800',
  'Singapore': 'bg-cyan-100 text-cyan-800',
  'South Korea': 'bg-violet-100 text-violet-800',
  'Brazil': 'bg-lime-100 text-lime-800',
  'India': 'bg-amber-100 text-amber-800',
  'Saudi Arabia': 'bg-emerald-100 text-emerald-800',
}

const jurisdictionOrder = ['UK', 'EU', 'US', 'Singapore', 'Japan', 'Australia', 'Canada', 'South Korea', 'Brazil', 'India', 'Saudi Arabia', 'Global', 'US/Global']

function getApplicabilityReason(entry: any, profile: any): string {
  const reg = entry.regulation
  const j = reg.jurisdiction
  const locations: string[] = profile?.operatingLocations?.map((l: any) => l.countryCode) ?? []
  const assets: string[] = profile?.assetTypes?.map((a: any) => a.code) ?? []
  const services: string[] = profile?.serviceTypes?.map((s: any) => s.code) ?? []
  const hasUK = locations.includes('GB')
  const hasEU = locations.some((l: string) => ['DE', 'FR', 'IT', 'ES', 'NL', 'EU'].includes(l))
  const hasSG = locations.includes('SG')
  const hasUS = locations.includes('US')

  if (!entry.applicable) {
    return `Not currently applicable — ${reg.code.includes('JAPAN') ? 'no Japan operations' : reg.code.includes('ASIC') ? 'no Australia operations' : reg.code.includes('CSA') ? 'no Canada operations' : reg.code.includes('VAUPA') ? 'no South Korea operations' : reg.code.includes('BRAZIL') ? 'no Brazil operations' : reg.code.includes('INDIA') ? 'no India operations' : reg.code.includes('SAMA') ? 'no Saudi Arabia operations' : 'outside current operational scope'}. Assessment required if operations expand.`
  }

  if (j === 'UK') {
    if (reg.code === 'FCA_CRYPTO_2026') return 'Applicable as a UK-headquartered cryptoasset exchange provider seeking FCA authorisation under FSMA 2000.'
    if (reg.code === 'FSMA_2000') return 'Applicable as a firm conducting regulated financial activities in the UK under FSMA.'
    if (reg.code === 'MLR_2017') return 'Applicable as a UK cryptoasset exchange registered under Money Laundering Regulations as a CASP.'
    if (reg.code === 'SMCR') return 'Applicable as an FCA-authorised firm subject to the Senior Managers and Certification Regime.'
    if (reg.code === 'UK_GDPR') return 'Applicable as a UK data controller processing personal data of customers and staff.'
    if (reg.code === 'OFSI') return 'Applicable as a UK firm subject to UK financial sanctions administered by OFSI.'
    if (reg.code === 'CONSUMER_DUTY') return 'Applicable as an FCA-regulated firm providing services to retail customers.'
  }
  if (j === 'EU') {
    if (reg.code === 'MICA') return `Applicable because your organisation operates in Germany (EU jurisdiction). MiCA authorisation as a Crypto-Asset Service Provider (CASP) is required for EU services.`
    if (reg.code === 'AMLD6') return `Applicable via your Germany operations, which are subject to EU AML directives transposed into German law.`
  }
  if (j === 'US') {
    if (reg.code === 'GENIUS_ACT') return 'Applicable because your organisation issues or handles stablecoins and may have US customer exposure. UK firms must comply if stablecoins are used by US persons.'
    if (reg.code === 'SEC_EXCHANGE_ACT') return 'Not currently applicable — no US-listed security tokens. Review required if tokenised securities are offered to US investors.'
    if (reg.code === 'BSA_FINCEN') return 'Not directly applicable — no US money transmitter licence. Required if onboarding US retail clients directly.'
    if (reg.code === 'FATCA') return 'Applicable as a foreign financial institution with US person account holders or investors requiring IRS reporting.'
  }
  if (j === 'Singapore') {
    return `Applicable because your organisation has operations in Singapore. A Major Payment Institution (MPI) licence from MAS is required for Digital Payment Token services.`
  }
  if (j === 'Global') {
    if (reg.code === 'FATF_TRAVEL_RULE') return 'Applicable as an international VASP operating across multiple jurisdictions. Travel Rule obligations apply to transfers above £1,000 threshold.'
    if (reg.code === 'FATF_40') return 'Applicable as a VASP subject to FATF standards. Recommendations 10, 15, and 16 specifically apply to your virtual asset activities.'
    if (reg.code === 'CRS_CARF') return 'Applicable under the Crypto-Asset Reporting Framework (CARF) for reporting crypto asset transactions to tax authorities. CARF implementation due 2027.'
    if (reg.code === 'WOLFSBURG') return 'Applicable for your correspondent banking and institutional client relationships in the cryptoasset sector.'
    if (reg.code === 'BASEL_CRYPTO') return 'Not directly applicable — Basel standards apply to banks with crypto exposures. Monitor as prudential frameworks may extend to CASPs.'
  }

  return `Applicable based on your operating locations (${locations.join(', ')}), asset classes, and services.`
}

function getComplianceReasoning(entry: any, mappedControls: any[]): string {
  if (!entry.applicable) return 'Regulation is not applicable to your current profile.'
  const total = mappedControls.length
  if (total === 0) return 'No specific controls mapped to this regulation yet.'
  const compliant = mappedControls.filter((c: any) => c.status === 'COMPLIANT').length
  const partial = mappedControls.filter((c: any) => c.status === 'PARTIALLY_COMPLIANT').length
  const nonCompliant = mappedControls.filter((c: any) => c.status === 'NON_COMPLIANT').length
  const notAssessed = mappedControls.filter((c: any) => c.status === 'NOT_ASSESSED').length

  if (entry.status === 'COMPLIANT') {
    return `All ${compliant} mapped controls are implemented and passing. Regulation is considered fully compliant.`
  }
  if (entry.status === 'NON_COMPLIANT') {
    const failing = mappedControls.filter((c: any) => c.status === 'NON_COMPLIANT')
    return `Non-compliant: ${failing.length} critical control${failing.length !== 1 ? 's' : ''} ${failing.length === 1 ? 'is' : 'are'} not yet implemented (${failing.map((c: any) => c.controlRef).join(', ')}). Immediate remediation required.`
  }
  if (entry.status === 'PARTIALLY_COMPLIANT') {
    const gaps = total - compliant
    return `Partially compliant: ${compliant} of ${total} controls passing, ${partial} partially implemented, ${nonCompliant + notAssessed} with gaps. ${gaps} control${gaps !== 1 ? 's' : ''} require remediation.`
  }
  return `Not yet assessed: ${notAssessed} of ${total} controls pending assessment. Review required to determine compliance status.`
}

const STATUS_DOT: Record<string, string> = {
  COMPLIANT: 'bg-green-500',
  PARTIALLY_COMPLIANT: 'bg-amber-500',
  NON_COMPLIANT: 'bg-red-500',
  NOT_ASSESSED: 'bg-gray-400',
}

export function ComplianceMapClient({ entries, profile }: { entries: any[]; profile: any }) {
  const [filter, setFilter] = useState<'all' | 'applicable' | 'gaps'>('applicable')
  const [selected, setSelected] = useState<any | null>(null)
  const [jurisdictionFilter, setJurisdictionFilter] = useState('')

  const displayed = useMemo(() => entries.filter(e => {
    if (filter === 'applicable') return e.applicable
    if (filter === 'gaps') return e.applicable && e.status !== 'COMPLIANT'
    return true
  }).filter(e => !jurisdictionFilter || e.regulation.jurisdiction === jurisdictionFilter), [entries, filter, jurisdictionFilter])

  const applicable = entries.filter(e => e.applicable)
  const compliant = applicable.filter(e => e.status === 'COMPLIANT').length
  const gaps = applicable.filter(e => e.status === 'NON_COMPLIANT' || e.status === 'PARTIALLY_COMPLIANT').length
  const notAssessed = applicable.filter(e => e.status === 'NOT_ASSESSED').length

  const jurisdictions = useMemo(() => {
    const seen = new Set<string>()
    entries.forEach(e => seen.add(e.regulation.jurisdiction))
    const all = Array.from(seen)
    return jurisdictionOrder.filter(j => all.includes(j)).concat(all.filter(j => !jurisdictionOrder.includes(j)))
  }, [entries])

  const byJurisdiction = useMemo(() => displayed.reduce((acc: Record<string, any[]>, e) => {
    const j = e.regulation.jurisdiction
    if (!acc[j]) acc[j] = []
    acc[j].push(e)
    return acc
  }, {}), [displayed])

  const selectedControls = useMemo(() => {
    if (!selected) return []
    return selected.regulation.controlMappings?.map((m: any) => m.control) ?? []
  }, [selected])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main panel */}
      <div className={`flex-1 overflow-y-auto ${selected ? 'border-r border-gray-200' : ''}`}>
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

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {(['all', 'applicable', 'gaps'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {f === 'all' ? 'All Regulations' : f === 'applicable' ? 'Applicable Only' : 'Gaps Only'}
              </button>
            ))}
            <div className="h-5 w-px bg-gray-200" />
            <select value={jurisdictionFilter} onChange={e => setJurisdictionFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">All Jurisdictions</option>
              {jurisdictions.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
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
                  {regs.map((entry: any) => {
                    const mappedControls = entry.regulation.controlMappings?.map((m: any) => m.control) ?? []
                    const compliantCount = mappedControls.filter((c: any) => c.status === 'COMPLIANT').length
                    return (
                      <button key={entry.id} onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          selected?.id === entry.id ? 'border-blue-500 shadow-md bg-blue-50/50' :
                          !entry.applicable ? 'border-gray-100 bg-gray-50 opacity-60' :
                          'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-900">{entry.regulation.name}</span>
                          {!entry.applicable && <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded flex-shrink-0">N/A</span>}
                        </div>
                        <div className="text-xs text-gray-400 mb-3 line-clamp-2">{entry.regulation.description}</div>
                        <div className="flex items-center justify-between gap-2">
                          {entry.applicable ? (
                            <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusColor(entry.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[entry.status] ?? 'bg-gray-400'}`}></span>
                              {getStatusLabel(entry.status)}
                            </div>
                          ) : <div />}
                          {entry.applicable && mappedControls.length > 0 && (
                            <span className="text-xs text-gray-400">{compliantCount}/{mappedControls.length} ctrl</span>
                          )}
                        </div>
                        {entry.regulation.regulator && (
                          <div className="text-xs text-gray-400 mt-1.5">{entry.regulation.regulator}</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-[420px] flex flex-col overflow-hidden bg-white flex-shrink-0">
          <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${jurisdictionColors[selected.regulation.jurisdiction] ?? 'bg-gray-100 text-gray-700'}`}>
                  {selected.regulation.jurisdiction}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{selected.regulation.name}</h3>
              {selected.regulation.fullName && (
                <div className="text-xs text-gray-500 mt-0.5">{selected.regulation.fullName}</div>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Status */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Compliance Status</div>
              <div className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full font-medium border ${getStatusColor(selected.status)}`}>
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[selected.status] ?? 'bg-gray-400'}`}></span>
                {getStatusLabel(selected.status)}
              </div>
            </div>

            {/* Why applicable */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="text-xs font-semibold text-blue-700 uppercase mb-1.5">Why Applicable</div>
              <p className="text-sm text-blue-800 leading-relaxed">{getApplicabilityReason(selected, profile)}</p>
            </div>

            {/* Compliance reasoning */}
            <div className={`rounded-xl p-4 border ${
              selected.status === 'COMPLIANT' ? 'bg-green-50 border-green-100' :
              selected.status === 'NON_COMPLIANT' ? 'bg-red-50 border-red-100' :
              selected.status === 'PARTIALLY_COMPLIANT' ? 'bg-amber-50 border-amber-100' :
              'bg-gray-50 border-gray-100'
            }`}>
              <div className={`text-xs font-semibold uppercase mb-1.5 ${
                selected.status === 'COMPLIANT' ? 'text-green-700' :
                selected.status === 'NON_COMPLIANT' ? 'text-red-700' :
                selected.status === 'PARTIALLY_COMPLIANT' ? 'text-amber-700' :
                'text-gray-500'
              }`}>Status Reasoning</div>
              <p className={`text-sm leading-relaxed ${
                selected.status === 'COMPLIANT' ? 'text-green-800' :
                selected.status === 'NON_COMPLIANT' ? 'text-red-800' :
                selected.status === 'PARTIALLY_COMPLIANT' ? 'text-amber-800' :
                'text-gray-700'
              }`}>{getComplianceReasoning(selected, selectedControls)}</p>
            </div>

            {/* Overview */}
            {selected.regulation.description && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Key Requirements Summary</div>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.regulation.description}</p>
              </div>
            )}

            {/* Regulator */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Regulator</div>
                <p className="text-sm text-gray-700">{selected.regulation.regulator ?? '—'}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Applicable</div>
                <span className={`text-sm font-medium ${selected.applicable ? 'text-green-600' : 'text-gray-400'}`}>
                  {selected.applicable ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Linked Controls */}
            {selectedControls.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Linked Controls ({selectedControls.filter((c: any) => c.status === 'COMPLIANT').length}/{selectedControls.length} compliant)
                </div>
                <div className="space-y-1.5">
                  {selectedControls.map((ctrl: any) => (
                    <Link key={ctrl.id} href="/controls"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-colors hover:shadow-sm ${
                        ctrl.status === 'COMPLIANT' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                        ctrl.status === 'NON_COMPLIANT' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                        ctrl.status === 'PARTIALLY_COMPLIANT' ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' :
                        'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[ctrl.status] ?? 'bg-gray-400'}`}></span>
                      <span className="font-mono text-xs text-gray-500 flex-shrink-0">{ctrl.controlRef}</span>
                      <span className="text-xs text-gray-700 font-medium truncate">{ctrl.name}</span>
                      <svg className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
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
