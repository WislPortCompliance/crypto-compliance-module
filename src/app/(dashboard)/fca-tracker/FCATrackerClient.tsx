'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate, getStageStatusColor, getStatusLabel } from '@/lib/utils'

const stageIcons: Record<string, string> = {
  PRE_APPLICATION: '🔍',
  BUSINESS_PLAN: '📋',
  FINANCIAL_RESOURCES: '💰',
  SYSTEMS_CONTROLS: '⚙️',
  AML_CTF: '🛡️',
  CONSUMER_PROTECTION: '👥',
  SUBMISSION: '📤',
  POST_APPROVAL: '✅',
}

const stageDescriptions: Record<string, string> = {
  PRE_APPLICATION: 'Initial scoping, regulatory perimeter analysis, and FCA engagement',
  BUSINESS_PLAN: 'Business plan, governance framework, SM&CR implementation',
  FINANCIAL_RESOURCES: 'Capital adequacy, liquidity, and financial projections',
  SYSTEMS_CONTROLS: 'Compliance systems, technology infrastructure, operational controls',
  AML_CTF: 'AML/CTF framework, policies, procedures, and technology',
  CONSUMER_PROTECTION: 'Consumer Duty, risk warnings, client categorisation',
  SUBMISSION: 'Application assembly and FCA Connect portal submission',
  POST_APPROVAL: 'Ongoing compliance obligations post-authorisation',
}

export function FCATrackerClient({ stages }: { stages: any[] }) {
  const [view, setView] = useState<'stages' | 'matrix'>('stages')
  const [activeStage, setActiveStage] = useState<string>(stages.find(s => s.status === 'IN_PROGRESS')?.id ?? stages[0]?.id)
  const [updatingReq, setUpdatingReq] = useState<string | null>(null)
  const [localStages, setLocalStages] = useState(stages)

  const selected = localStages.find(s => s.id === activeStage)

  const totalReqs = localStages.reduce((sum, s) => sum + s.requirements.length, 0)
  const doneReqs = localStages.reduce((sum, s) => sum + s.requirements.filter((r: any) => r.status === 'COMPLETE').length, 0)
  const overallPct = totalReqs > 0 ? Math.round((doneReqs / totalReqs) * 100) : 0

  async function toggleRequirement(reqId: string, currentStatus: string) {
    const next = currentStatus === 'COMPLETE' ? 'NOT_STARTED' : 'COMPLETE'
    setUpdatingReq(reqId)
    try {
      const res = await fetch('/api/fca-stages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementId: reqId, status: next }),
      })
      if (!res.ok) return
      const updated = await res.json()
      setLocalStages(prev => prev.map(s => ({
        ...s,
        requirements: s.requirements.map((r: any) => r.id === reqId ? { ...r, ...updated } : r),
      })))
    } finally {
      setUpdatingReq(null)
    }
  }

  async function startRequirement(reqId: string) {
    setUpdatingReq(reqId)
    try {
      const res = await fetch('/api/fca-stages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementId: reqId, action: 'start' }),
      })
      if (!res.ok) return
      const updated = await res.json()
      setLocalStages(prev => prev.map(s => ({
        ...s,
        // Also flip the parent stage if this requirement's stage was NOT_STARTED
        status: s.id === updated.stageId && s.status === 'NOT_STARTED' ? 'IN_PROGRESS' : s.status,
        requirements: s.requirements.map((r: any) => r.id === reqId ? { ...r, ...updated } : r),
      })))
    } finally {
      setUpdatingReq(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FCA Application Tracker</h1>
          <p className="text-gray-500 text-sm mt-0.5">UK Cryptoasset Authorisation Journey · {overallPct}% complete</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{doneReqs}</span> of <span className="font-medium text-gray-700">{totalReqs}</span> requirements complete
        </div>
      </div>

      {/* Overall progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Application Progress</span>
          <span className="text-sm font-bold text-blue-600">{overallPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div className="h-2.5 rounded-full bg-blue-600 transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* View toggle */}
      <div className="border-b border-gray-200 flex items-center gap-1">
        <button
          onClick={() => setView('stages')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${view === 'stages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Stages & Requirements
        </button>
        <button
          onClick={() => setView('matrix')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${view === 'matrix' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          FCA Requirements Matrix
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold">{totalReqs}</span>
        </button>
      </div>

      {view === 'matrix' && (
        <RequirementsMatrix stages={localStages} />
      )}

      {view === 'stages' && (
      <div className="grid grid-cols-12 gap-6">
        {/* Stage List */}
        <div className="col-span-4 space-y-2">
          {localStages.map((stage, idx) => {
            const isActive = stage.id === activeStage
            const reqCount = stage.requirements.length
            const doneCount = stage.requirements.filter((r: any) => r.status === 'COMPLETE').length
            const pct = reqCount > 0 ? Math.round((doneCount / reqCount) * 100) : 0

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isActive ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    stage.status === 'COMPLETE' ? 'bg-green-500 text-white' :
                    stage.status === 'IN_PROGRESS' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {stage.status === 'COMPLETE' ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold leading-tight ${isActive ? 'text-blue-900' : 'text-gray-800'}`}>
                      {stage.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                        <div className={`h-1 rounded-full ${stage.status === 'COMPLETE' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{doneCount}/{reqCount}</span>
                    </div>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${getStageStatusColor(stage.status)}`}>
                      {getStatusLabel(stage.status)}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Stage Detail */}
        {selected && (
          <div className="col-span-8 card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stageIcons[selected.stage] ?? '📌'}</span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selected.title}</h2>
                  <p className="text-sm text-gray-500">{stageDescriptions[selected.stage] ?? selected.description}</p>
                </div>
                <span className={`ml-auto text-sm px-3 py-1 rounded-full font-medium ${getStageStatusColor(selected.status)}`}>
                  {getStatusLabel(selected.status)}
                </span>
              </div>

              {selected.targetDate && (
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>Target: <strong>{formatDate(selected.targetDate)}</strong></span>
                  {selected.completedAt && <span>Completed: <strong>{formatDate(selected.completedAt)}</strong></span>}
                </div>
              )}
            </div>

            <div className="card-body space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Requirements Checklist</h3>
              {selected.requirements.map((req: any) => (
                <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <button
                    onClick={() => toggleRequirement(req.id, req.status)}
                    disabled={updatingReq === req.id}
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                      req.status === 'COMPLETE' ? 'bg-green-500 border-green-500' :
                      req.status === 'IN_PROGRESS' ? 'border-blue-400' :
                      'border-gray-300'
                    }`}
                    title={req.status === 'COMPLETE' ? 'Mark not-started' : 'Mark complete'}
                  >
                    {req.status === 'COMPLETE' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    {req.status === 'IN_PROGRESS' && <span className="w-2 h-2 bg-blue-400 rounded-full"></span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${req.status === 'COMPLETE' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {req.title}
                    </div>
                    {req.fcaReference && (
                      <div className="text-[11px] font-mono text-gray-500 mt-0.5">
                        <span className="text-gray-400">Ref:</span> {req.fcaReference}
                      </div>
                    )}
                    {req.description && <p className="text-xs text-gray-400 mt-0.5">{req.description}</p>}
                    {req.notes && <p className="text-xs text-blue-600 mt-1 italic">Note: {req.notes}</p>}

                    {/* In-flight work panel */}
                    {req.status === 'IN_PROGRESS' && req.actionItem && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-3 text-xs">
                        <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-medium text-blue-800">In flight:</span>
                        {req.actionItem.owner?.name && <span className="text-blue-700">{req.actionItem.owner.name}</span>}
                        {req.actionItem.dueDate && (
                          <span className="text-blue-600">
                            · due {new Date(req.actionItem.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-blue-500">{req.actionItem.priority ?? 'MEDIUM'}</span>
                      </div>
                    )}

                    {/* Orphan IN_PROGRESS — no linked work yet */}
                    {req.status === 'IN_PROGRESS' && !req.actionItem && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-xs">
                        <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
                        <span className="text-amber-800">No linked work item yet.</span>
                        <button
                          onClick={() => startRequirement(req.id)}
                          disabled={updatingReq === req.id}
                          className="ml-auto text-xs text-amber-900 font-semibold underline hover:text-amber-950 disabled:opacity-50"
                        >
                          {updatingReq === req.id ? 'Linking…' : 'Link work →'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* NOT_STARTED: Start button + View Template */}
                    {req.status === 'NOT_STARTED' && (
                      <>
                        {req.templateId && (
                          <Link
                            href={`/documents/${req.templateId}`}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                            onClick={e => e.stopPropagation()}
                            title="Preview the template for this requirement"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Template
                          </Link>
                        )}
                        <button
                          onClick={() => startRequirement(req.id)}
                          disabled={updatingReq === req.id}
                          className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-semibold flex items-center gap-1 px-3 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {updatingReq === req.id ? 'Starting…' : 'Start'}
                        </button>
                      </>
                    )}

                    {/* IN_PROGRESS: View draft doc */}
                    {req.status === 'IN_PROGRESS' && req.documentId && (
                      <Link
                        href={`/documents/${req.documentId}`}
                        className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 px-2 py-1 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        View Draft
                      </Link>
                    )}

                    {/* COMPLETE: View Evidence */}
                    {req.status === 'COMPLETE' && req.documentId && (
                      <Link
                        href={`/documents/${req.documentId}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        View Evidence
                      </Link>
                    )}
                    <StatusChip status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  )
}

function RequirementsMatrix({ stages }: { stages: any[] }) {
  const allReqs = stages.flatMap((s: any) => s.requirements.map((r: any) => ({ ...r, stageTitle: s.title, stageOrder: s.order })))

  const countByStatus = (status: string) => allReqs.filter((r: any) => r.status === status).length
  const totalsByRef = allReqs.reduce((acc: Record<string, any>, r: any) => {
    const ref = r.fcaReference?.split(';')[0]?.trim() || 'Unclassified'
    if (!acc[ref]) acc[ref] = { total: 0, complete: 0, inProgress: 0, notStarted: 0 }
    acc[ref].total++
    if (r.status === 'COMPLETE') acc[ref].complete++
    else if (r.status === 'IN_PROGRESS') acc[ref].inProgress++
    else acc[ref].notStarted++
    return acc
  }, {})

  const statusBadge = (status: string) => {
    const cfg: Record<string, string> = {
      COMPLETE: 'bg-green-100 text-green-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      NOT_STARTED: 'bg-gray-100 text-gray-500',
      NA: 'bg-gray-100 text-gray-400',
    }
    return cfg[status] ?? cfg.NOT_STARTED
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900">{allReqs.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total requirements</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-green-600">{countByStatus('COMPLETE')}</div>
          <div className="text-xs text-gray-500 mt-0.5">Complete</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-blue-600">{countByStatus('IN_PROGRESS')}</div>
          <div className="text-xs text-gray-500 mt-0.5">In progress</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-500">{countByStatus('NOT_STARTED')}</div>
          <div className="text-xs text-gray-500 mt-0.5">Not started</div>
        </div>
      </div>

      {/* Full matrix table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">FCA Reference</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Requirement</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Stage</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allReqs
              .sort((a: any, b: any) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0))
              .map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{r.fcaReference ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-900">{r.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.stageTitle}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.actionItem?.owner?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge(r.status)}`}>
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.documentId ? (
                      <Link href={`/documents/${r.documentId}`} className="text-xs text-blue-600 hover:underline">
                        View
                      </Link>
                    ) : r.templateId ? (
                      <Link href={`/documents/${r.templateId}`} className="text-xs text-gray-500 hover:text-gray-700 hover:underline">
                        Template
                      </Link>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    COMPLETE: 'bg-green-50 text-green-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    NOT_STARTED: 'bg-gray-50 text-gray-500',
    NA: 'bg-gray-50 text-gray-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg[status] ?? cfg.NOT_STARTED}`}>
      {getStatusLabel(status)}
    </span>
  )
}
