'use client'

import { useState } from 'react'
import { formatDate, getStatusColor, getStatusLabel, getRiskColor } from '@/lib/utils'

export function ReportsClient({ controls, stages, regulations, risks, org }: { controls: any[]; stages: any[]; regulations: any[]; risks: any[]; org: any }) {
  const [activeReport, setActiveReport] = useState<string | null>(null)

  const total = controls.length
  const compliant = controls.filter(c => c.status === 'COMPLIANT').length
  const partial = controls.filter(c => c.status === 'PARTIALLY_COMPLIANT').length
  const nonCompliant = controls.filter(c => c.status === 'NON_COMPLIANT').length
  const notAssessed = controls.filter(c => c.status === 'NOT_ASSESSED').length
  const score = total > 0 ? Math.round(((compliant + partial * 0.5) / total) * 100) : 0

  const stagesDone = stages.filter(s => s.status === 'COMPLETE').length
  const appProgress = stages.length > 0 ? Math.round((stagesDone / stages.length) * 100) : 0

  const today = formatDate(new Date())

  const reports = [
    {
      id: 'summary',
      title: 'Compliance Summary Report',
      description: 'Overall compliance posture, control status breakdown, and key metrics',
      icon: '📊',
    },
    {
      id: 'gap',
      title: 'Gap Analysis Report',
      description: 'Detailed view of non-compliant and partially compliant controls requiring action',
      icon: '🔍',
    },
    {
      id: 'fca',
      title: 'FCA Application Readiness Report',
      description: 'Current application stage progress and outstanding requirements',
      icon: '🏛️',
    },
    {
      id: 'controls',
      title: 'Control Effectiveness Report',
      description: 'Per-control status with owner accountability and review schedule',
      icon: '🛡️',
    },
    {
      id: 'risk',
      title: 'Risk Register Report',
      description: 'Risk register with likelihood/impact scoring and mitigation status',
      icon: '⚠️',
    },
    {
      id: 'regulatory',
      title: 'Regulatory Landscape Report',
      description: 'Applicable regulations and compliance status per jurisdiction',
      icon: '🗺️',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-0.5">Compliance reporting and export for {org?.name}</p>
      </div>

      {!activeReport ? (
        <div className="grid grid-cols-3 gap-4">
          {reports.map(r => (
            <button key={r.id} onClick={() => setActiveReport(r.id)}
              className="card p-5 text-left hover:shadow-md hover:border-blue-200 transition-all">
              <div className="text-3xl mb-3">{r.icon}</div>
              <h2 className="text-sm font-semibold text-gray-900">{r.title}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.description}</p>
              <div className="mt-4 text-xs text-blue-600 font-medium">View Report →</div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setActiveReport(null)} className="btn-secondary">← Back to Reports</button>
            <button onClick={() => window.print()} className="btn-secondary">🖨️ Print / Save PDF</button>
          </div>

          {activeReport === 'summary' && (
            <SummaryReport org={org} today={today} score={score} total={total} compliant={compliant} partial={partial} nonCompliant={nonCompliant} notAssessed={notAssessed} appProgress={appProgress} stagesDone={stagesDone} stages={stages} />
          )}
          {activeReport === 'gap' && (
            <GapReport org={org} today={today} controls={controls.filter(c => c.status !== 'COMPLIANT')} />
          )}
          {activeReport === 'fca' && (
            <FCAReport org={org} today={today} stages={stages} appProgress={appProgress} />
          )}
          {activeReport === 'controls' && (
            <ControlsReport org={org} today={today} controls={controls} />
          )}
          {activeReport === 'risk' && (
            <RiskReport org={org} today={today} risks={risks} />
          )}
          {activeReport === 'regulatory' && (
            <RegulatoryReport org={org} today={today} regulations={regulations} />
          )}
        </div>
      )}
    </div>
  )
}

function ReportHeader({ title, org, today }: { title: string; org: any; today: string }) {
  return (
    <div className="card p-6 mb-6 flex items-start justify-between">
      <div>
        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">CryptoComply · Confidential</div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <div className="text-sm text-gray-500 mt-1">{org?.name} · {org?.fcaReferenceNumber}</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-gray-400">Generated</div>
        <div className="text-sm font-medium text-gray-700">{today}</div>
      </div>
    </div>
  )
}

function SummaryReport({ org, today, score, total, compliant, partial, nonCompliant, notAssessed, appProgress, stagesDone, stages }: any) {
  return (
    <div className="space-y-6 print:space-y-4">
      <ReportHeader title="Compliance Summary Report" org={org} today={today} />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Readiness Score', value: `${score}%`, color: score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600' },
          { label: 'Total Controls', value: total, color: 'text-gray-900' },
          { label: 'Compliant', value: compliant, color: 'text-green-600' },
          { label: 'Non-Compliant', value: nonCompliant, color: 'text-red-600' },
        ].map(m => (
          <div key={m.label} className="card p-5">
            <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-sm text-gray-600 mt-1">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Application Progress: {appProgress}%</h2>
        <div className="space-y-2">
          {stages.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${s.status === 'COMPLETE' ? 'bg-green-500' : s.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-200'}`}></span>
              <span className="text-sm text-gray-700 flex-1">{s.title}</span>
              <span className={`text-xs font-medium ${s.status === 'COMPLETE' ? 'text-green-600' : s.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-gray-400'}`}>{getStatusLabel(s.status)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GapReport({ org, today, controls }: any) {
  return (
    <div className="space-y-6">
      <ReportHeader title="Gap Analysis Report" org={org} today={today} />
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{controls.length} controls requiring attention</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 table-header">Ref</th>
              <th className="text-left px-4 py-3 table-header">Control</th>
              <th className="text-left px-4 py-3 table-header">Category</th>
              <th className="text-left px-4 py-3 table-header">Status</th>
              <th className="text-left px-4 py-3 table-header">Owner</th>
              <th className="text-left px-4 py-3 table-header">Next Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {controls.map((c: any) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.controlRef}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.category?.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.owner?.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.nextReviewDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FCAReport({ org, today, stages, appProgress }: any) {
  return (
    <div className="space-y-6">
      <ReportHeader title="FCA Application Readiness Report" org={org} today={today} />
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
          <span className="text-2xl font-bold text-blue-600">{appProgress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="h-3 rounded-full bg-blue-600" style={{ width: `${appProgress}%` }} />
        </div>
      </div>
      {stages.map((stage: any) => {
        const done = stage.requirements.filter((r: any) => r.status === 'COMPLETE').length
        const total = stage.requirements.length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        return (
          <div key={stage.id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{stage.title}</h3>
                <span className={`text-xs font-medium ${stage.status === 'COMPLETE' ? 'text-green-600' : stage.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-gray-400'}`}>
                  {getStatusLabel(stage.status)}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-700">{done}/{total}</span>
            </div>
            <div className="space-y-1">
              {stage.requirements.map((r: any) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <span className={r.status === 'COMPLETE' ? 'text-green-500' : 'text-gray-300'}>✓</span>
                  <span className={r.status === 'COMPLETE' ? 'text-gray-400 line-through' : 'text-gray-700'}>{r.title}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ControlsReport({ org, today, controls }: any) {
  return (
    <div className="space-y-6">
      <ReportHeader title="Control Effectiveness Report" org={org} today={today} />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 table-header">Ref</th>
              <th className="text-left px-4 py-3 table-header">Control</th>
              <th className="text-left px-4 py-3 table-header">Category</th>
              <th className="text-left px-4 py-3 table-header">FCA Principle</th>
              <th className="text-left px-4 py-3 table-header">Status</th>
              <th className="text-left px-4 py-3 table-header">Owner</th>
              <th className="text-left px-4 py-3 table-header">Last Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {controls.map((c: any) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{c.controlRef}</td>
                <td className="px-4 py-2.5 text-xs font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{c.category?.name}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{c.fcaPrinciple ? `P${c.fcaPrinciple.number}` : '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{c.owner?.name ?? '—'}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{formatDate(c.lastReviewed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RiskReport({ org, today, risks }: any) {
  return (
    <div className="space-y-6">
      <ReportHeader title="Risk Register Report" org={org} today={today} />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 table-header">Risk</th>
              <th className="text-left px-4 py-3 table-header">Category</th>
              <th className="text-left px-4 py-3 table-header">Level</th>
              <th className="text-left px-4 py-3 table-header">Score</th>
              <th className="text-left px-4 py-3 table-header">L×I</th>
              <th className="text-left px-4 py-3 table-header">Owner</th>
              <th className="text-left px-4 py-3 table-header">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {risks.map((r: any) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <div className="text-xs font-medium text-gray-900">{r.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.description}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.category}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium border ${getRiskColor(r.riskLevel)}`}>{r.riskLevel}</span>
                </td>
                <td className="px-4 py-3 text-xs font-bold text-gray-700">{r.riskScore}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.likelihood}×{r.impact}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.owner ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RegulatoryReport({ org, today, regulations }: any) {
  return (
    <div className="space-y-6">
      <ReportHeader title="Regulatory Landscape Report" org={org} today={today} />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 table-header">Regulation</th>
              <th className="text-left px-4 py-3 table-header">Jurisdiction</th>
              <th className="text-left px-4 py-3 table-header">Regulator</th>
              <th className="text-left px-4 py-3 table-header">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {regulations.map((e: any) => (
              <tr key={e.id}>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{e.regulation.name}</div>
                  <div className="text-xs text-gray-400">{e.regulation.fullName}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.regulation.jurisdiction}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.regulation.regulator ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusColor(e.status)}`}>{getStatusLabel(e.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
