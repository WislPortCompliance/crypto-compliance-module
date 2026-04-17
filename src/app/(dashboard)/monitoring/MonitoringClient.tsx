'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { formatDate, getRiskColor } from '@/lib/utils'

const alertTypeLabel: Record<string, string> = {
  REGULATORY_CHANGE: 'Regulatory Change',
  OVERDUE_ACTION: 'Overdue Action',
  UPCOMING_REVIEW: 'Upcoming Review',
  APPLICATION_UPDATE: 'Application Update',
  SYSTEM: 'System',
}

const alertTypeColor: Record<string, string> = {
  REGULATORY_CHANGE: 'bg-purple-100 text-purple-700 border-purple-200',
  OVERDUE_ACTION: 'bg-red-100 text-red-700 border-red-200',
  UPCOMING_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
  APPLICATION_UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
  SYSTEM: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function MonitoringClient({ alerts, actions, risks }: { alerts: any[]; actions: any[]; risks: any[] }) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'alerts' | 'actions' | 'risks'>('alerts')
  const [localAlerts, setLocalAlerts] = useState(alerts)
  const [localActions, setLocalActions] = useState(actions)
  const [filterOverdue, setFilterOverdue] = useState(false)

  // Respond to URL params (drill-in from dashboard)
  useEffect(() => {
    const filter = searchParams?.get('filter')
    const tabParam = searchParams?.get('tab')
    if (filter === 'overdue') {
      setFilterOverdue(true)
      setTab('actions')
    }
    if (tabParam === 'alerts' || tabParam === 'actions' || tabParam === 'risks') setTab(tabParam)
  }, [searchParams])

  const unreadAlerts = localAlerts.filter(a => !a.read).length
  const openActions = localActions.filter(a => a.status !== 'COMPLETE').length
  const criticalRisks = risks.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length

  const now = new Date()
  const visibleActions = filterOverdue
    ? localActions.filter(a => a.dueDate && new Date(a.dueDate) < now && a.status !== 'COMPLETE')
    : localActions

  async function markRead(id: string) {
    await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  async function updateActionStatus(id: string, status: string) {
    await fetch('/api/actions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    setLocalActions(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoring & Alerts</h1>
        <p className="text-gray-500 text-sm mt-0.5">Regulatory changes, action items, and risk register</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Unread Alerts" value={unreadAlerts} color={unreadAlerts > 0 ? 'red' : 'green'} onClick={() => setTab('alerts')} />
        <SummaryCard label="Open Actions" value={openActions} color={openActions > 3 ? 'amber' : 'green'} onClick={() => setTab('actions')} />
        <SummaryCard label="High/Critical Risks" value={criticalRisks} color={criticalRisks > 2 ? 'red' : 'amber'} onClick={() => setTab('risks')} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {([
            { key: 'alerts', label: 'Alerts', count: unreadAlerts },
            { key: 'actions', label: 'Action Items', count: openActions },
            { key: 'risks', label: 'Risk Register', count: criticalRisks },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Tab */}
      {tab === 'alerts' && (
        <div className="space-y-3">
          {localAlerts.map(alert => (
            <div key={alert.id} className={`card p-5 ${!alert.read ? 'border-blue-200 bg-blue-50/30' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {!alert.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${alertTypeColor[alert.type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {alertTypeLabel[alert.type] ?? alert.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRiskColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      {alert.controlRef && (
                        <Link
                          href={`/controls?controlRef=${alert.controlRef}`}
                          className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          {alert.controlRef} →
                        </Link>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{alert.message}</p>
                    <div className="text-xs text-gray-400 mt-2">{formatDate(alert.createdAt)}</div>
                  </div>
                </div>
                {!alert.read && (
                  <button onClick={() => markRead(alert.id)} className="text-xs text-blue-600 hover:underline flex-shrink-0">
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions Tab */}
      {tab === 'actions' && (
        <>
          {filterOverdue && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm mb-4">
              <div className="text-red-800 font-medium">
                Showing overdue actions only ({visibleActions.length})
              </div>
              <button onClick={() => setFilterOverdue(false)} className="text-xs text-red-700 hover:text-red-900 font-semibold">
                Show all actions
              </button>
            </div>
          )}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 table-header">Action</th>
                  <th className="text-left px-5 py-3 table-header">Control</th>
                  <th className="text-left px-5 py-3 table-header">Owner</th>
                  <th className="text-left px-5 py-3 table-header">Due Date</th>
                  <th className="text-left px-5 py-3 table-header">Priority</th>
                  <th className="text-left px-5 py-3 table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibleActions.map(action => {
                  const isOverdue = action.dueDate && new Date(action.dueDate) < now && action.status !== 'COMPLETE'
                  return (
                    <tr key={action.id} className={isOverdue ? 'bg-red-50/30' : ''}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{action.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{action.description}</div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {action.controlRef ? (
                          <Link href={`/controls?controlRef=${action.controlRef}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                            {action.controlRef}
                          </Link>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">{action.owner?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {isOverdue && '⚠️ '}{formatDate(action.dueDate)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getRiskColor(action.priority)}`}>
                        {action.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={action.status}
                        onChange={e => updateActionStatus(action.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETE">Complete</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Risks Tab */}
      {tab === 'risks' && (
        <div className="space-y-3">
          {risks.map(risk => (
            <div key={risk.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRiskColor(risk.riskLevel)}`}>
                      {risk.riskLevel}
                    </span>
                    {risk.category && <span className="text-xs text-gray-400">{risk.category}</span>}
                    <span className="text-xs font-bold text-gray-700 ml-2">Score: {risk.riskScore}</span>
                    {risk.controlRef && (
                      <Link
                        href={`/controls?controlRef=${risk.controlRef}`}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors ml-1"
                      >
                        {risk.controlRef} →
                      </Link>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{risk.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{risk.description}</p>
                  {risk.mitigationPlan && (
                    <div className="mt-2">
                      <span className="text-xs font-semibold text-gray-500">Mitigation: </span>
                      <span className="text-xs text-gray-600">{risk.mitigationPlan}</span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-gray-400">L×I</div>
                  <div className="text-sm font-bold text-gray-700">{risk.likelihood}×{risk.impact}</div>
                  {risk.owner && <div className="text-xs text-gray-400 mt-1">{risk.owner}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color, onClick }: { label: string; value: number; color: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
  }
  return (
    <button onClick={onClick} className="card p-5 text-left hover:shadow-md transition-shadow w-full">
      <div className={`text-3xl font-bold ${colors[color] ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-1">{label}</div>
    </button>
  )
}
