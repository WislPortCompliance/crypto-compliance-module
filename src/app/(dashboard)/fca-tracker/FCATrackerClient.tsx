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
      await fetch('/api/fca-stages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementId: reqId, status: next }),
      })
      setLocalStages(prev => prev.map(s => ({
        ...s,
        requirements: s.requirements.map((r: any) => r.id === reqId ? { ...r, status: next } : r),
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
                  >
                    {req.status === 'COMPLETE' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    {req.status === 'IN_PROGRESS' && <span className="w-2 h-2 bg-blue-400 rounded-full"></span>}
                  </button>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${req.status === 'COMPLETE' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {req.title}
                    </div>
                    {req.description && <p className="text-xs text-gray-400 mt-0.5">{req.description}</p>}
                    {req.notes && <p className="text-xs text-blue-600 mt-1 italic">Note: {req.notes}</p>}
                    {req.documentId && (
                      <Link
                        href={`/documents/${req.documentId}`}
                        className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 group/doc"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Evidence Document
                        <svg className="w-3 h-3 group-hover/doc:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusChip status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
