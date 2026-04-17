'use client'

import Link from 'next/link'
import { formatDate, formatRelativeDate, getRiskColor, getStatusColor, getStatusLabel } from '@/lib/utils'

interface Props {
  score: number
  totalControls: number
  compliantControls: number
  partialControls: number
  nonCompliantControls: number
  notAssessedControls: number
  overdueActions: number
  upcomingReviews: number
  fcaProgress: number
  fcaStages: any[]
  micaProgress: number
  micaStages: any[]
  alerts: any[]
  actions: any[]
  recentActivity: any[]
  userName: string
  orgName: string
}

const stageLabels: Record<string, string> = {
  PRE_APPLICATION: 'Pre-Application',
  BUSINESS_PLAN: 'Business Plan',
  FINANCIAL_RESOURCES: 'Financial Resources',
  SYSTEMS_CONTROLS: 'Systems & Controls',
  AML_CTF: 'AML/CTF',
  CONSUMER_PROTECTION: 'Consumer Protection',
  SUBMISSION: 'Submission',
  POST_APPROVAL: 'Post-Approval',
}

const alertTypeLabel: Record<string, string> = {
  REGULATORY_CHANGE: 'Reg Change',
  OVERDUE_ACTION: 'Overdue',
  UPCOMING_REVIEW: 'Upcoming',
  APPLICATION_UPDATE: 'App Update',
  SYSTEM: 'System',
}

const alertTypeColor: Record<string, string> = {
  REGULATORY_CHANGE: 'bg-purple-100 text-purple-700',
  OVERDUE_ACTION: 'bg-red-100 text-red-700',
  UPCOMING_REVIEW: 'bg-amber-100 text-amber-700',
  APPLICATION_UPDATE: 'bg-blue-100 text-blue-700',
  SYSTEM: 'bg-gray-100 text-gray-700',
}

function ScoreGauge({ score }: { score: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} stroke="#e5e7eb" strokeWidth="12" fill="none" />
        <circle
          cx="64" cy="64" r={r}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-gray-900">{score}%</div>
        <div className="text-xs text-gray-500">Readiness</div>
      </div>
    </div>
  )
}

export function DashboardClient({
  score, totalControls, compliantControls, partialControls, nonCompliantControls, notAssessedControls,
  overdueActions, upcomingReviews, fcaProgress, fcaStages, micaProgress, micaStages, alerts, actions, recentActivity, userName, orgName,
}: Props) {
  const now = new Date()
  const showFca = fcaStages.length > 0
  const showMica = micaStages.length > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {userName} · {orgName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/controls" className="btn-secondary">Review Controls</Link>
          <Link href="/fca-tracker" className="btn-primary">FCA Application</Link>
        </div>
      </div>

      {/* Top Row: Score + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Compliance Score — col-span-2 */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-6">
            <ScoreGauge score={score} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-700 mb-3">Control Breakdown <span className="text-xs font-normal text-gray-400">(click a row to drill in)</span></div>
              <div className="space-y-2.5">
                {[
                  { label: 'Compliant', count: compliantControls, color: 'bg-green-500', total: totalControls, filter: 'COMPLIANT' },
                  { label: 'Partial', count: partialControls, color: 'bg-amber-500', total: totalControls, filter: 'PARTIALLY_COMPLIANT' },
                  { label: 'Non-Compliant', count: nonCompliantControls, color: 'bg-red-500', total: totalControls, filter: 'NON_COMPLIANT' },
                  { label: 'Not Assessed', count: notAssessedControls, color: 'bg-gray-400', total: totalControls, filter: 'NOT_ASSESSED' },
                ].map(item => {
                  const pct = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0
                  return (
                    <Link
                      key={item.label}
                      href={`/controls?filterStatus=${item.filter}`}
                      className="block group -mx-2 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`}></span>
                          <span className="text-gray-600 group-hover:text-gray-900">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 tabular-nums">{pct}%</span>
                          <span className="text-xs font-semibold text-gray-900 tabular-nums w-6 text-right">{item.count}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards — col-span-2 */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <MetricCard label="Total Controls" value={totalControls} sub="across all categories" color="blue" icon="shield" href="/controls" />
          <MetricCard label="Compliant" value={`${Math.round((compliantControls / Math.max(totalControls, 1)) * 100)}%`} sub={`${compliantControls} of ${totalControls}`} color="green" icon="check" href="/controls?filterStatus=COMPLIANT" />
          <MetricCard label="Overdue Actions" value={overdueActions} sub="require immediate attention" color={overdueActions > 0 ? 'red' : 'green'} icon="warning" href="/monitoring?filter=overdue" />
          <MetricCard label="Reviews Due (30d)" value={upcomingReviews} sub="controls need review" color={upcomingReviews > 5 ? 'amber' : 'gray'} icon="calendar" href="/controls?filter=reviewsDue" />
        </div>
      </div>

      {/* Authorisation pipelines — each rendered only if the client is in that process */}
      {showFca && (
        <AuthorisationPipeline
          title="FCA Application Progress"
          subtitle={`${fcaProgress}% complete · ${fcaStages.filter(s => s.status === 'COMPLETE').length} of ${fcaStages.length} stages done`}
          href="/fca-tracker"
          stages={fcaStages}
        />
      )}
      {showMica && (
        <AuthorisationPipeline
          title="MiCA CASP Application Progress"
          subtitle={`${micaProgress}% complete · ${micaStages.filter(s => s.status === 'COMPLETE').length} of ${micaStages.length} stages done`}
          href="/mica-tracker"
          stages={micaStages}
        />
      )}
      {!showFca && !showMica && (
        <div className="card p-5 text-center">
          <p className="text-sm text-gray-500">
            No authorisation tracker active.{' '}
            <Link href="/setup-wizard" className="text-blue-600 font-medium hover:underline">
              Run the setup wizard
            </Link>{' '}
            to generate an FCA or MiCA application tracker for your organisation.
          </p>
        </div>
      )}

      {/* Other authorisations (GFSC, MAS, VARA, FINMA, SFC, ASIC, CSA, BSA) */}
      {(showFca || showMica) && (
        <div className="flex items-center justify-end">
          <Link href="/authorisation" className="text-sm text-blue-600 font-medium hover:underline">
            View all authorisation trackers →
          </Link>
        </div>
      )}

      {/* Bottom Row: Alerts + Actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Alerts</h2>
            <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
              {alerts.filter(a => !a.read).length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`px-4 py-3 ${!alert.read ? 'bg-blue-50/30' : ''}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${alertTypeColor[alert.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {alertTypeLabel[alert.type] ?? alert.type}
                  </span>
                  <div className={`text-xs font-medium leading-tight ${getRiskDotColor(alert.severity)}`}>
                    {!alert.read && <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 mb-0.5 align-middle"></span>}
                    {alert.title}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 ml-14">{alert.message}</p>
              </div>
            ))}
          </div>
          <div className="card-header border-t border-gray-50">
            <Link href="/monitoring" className="text-blue-600 text-xs font-medium hover:underline">View all alerts →</Link>
          </div>
        </div>

        {/* Action Items */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Action Items</h2>
            <Link href="/monitoring" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {actions.slice(0, 5).map(action => {
              const isOverdue = action.dueDate && new Date(action.dueDate) < now && action.status !== 'COMPLETE'
              return (
                <div key={action.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium text-gray-800 leading-tight">{action.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {action.owner && <span className="text-xs text-gray-400">{action.owner.name}</span>}
                        {action.dueDate && (
                          <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                            {isOverdue ? 'OVERDUE · ' : ''}{formatDate(action.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 border ${getPriorityColor(action.priority)}`}>
                      {action.priority}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.slice(0, 6).map((log: any) => (
              <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                  {log.user?.name?.charAt(0) ?? 'S'}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-700 leading-tight">{formatAction(log.action)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {log.user?.name ?? 'System'} · {formatRelativeDate(log.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthorisationPipeline({ title, subtitle, href, stages }: { title: string; subtitle: string; href: string; stages: any[] }) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <Link href={href} className="text-blue-600 text-sm font-medium hover:underline">View tracker →</Link>
      </div>
      <div className="card-body">
        <div className="flex items-center gap-0 overflow-x-auto">
          {stages.map((stage: any, i: number) => {
            const isComplete = stage.status === 'COMPLETE'
            const isActive = stage.status === 'IN_PROGRESS'
            const isLast = i === stages.length - 1
            return (
              <div key={stage.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    isComplete ? 'bg-green-500 border-green-500 text-white' :
                    isActive ? 'bg-blue-500 border-blue-500 text-white animate-pulse' :
                    'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isComplete ? '✓' : i + 1}
                  </div>
                  <div className="text-center w-20">
                    <div className={`text-xs font-medium leading-tight ${isComplete ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-400'}`}>
                      {stageLabels[stage.stage] ?? stage.title}
                    </div>
                    <div className={`text-xs mt-0.5 ${isComplete ? 'text-green-500' : isActive ? 'text-blue-500' : 'text-gray-300'}`}>
                      {isComplete ? 'Complete' : isActive ? 'In Progress' : 'Pending'}
                    </div>
                  </div>
                </div>
                {!isLast && (
                  <div className={`h-0.5 w-6 flex-shrink-0 mx-1 ${isComplete ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, color, icon, href }: { label: string; value: string | number; sub: string; color: string; icon: string; href?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-50 text-gray-600',
  }
  const inner = (
    <>
      <div className={`inline-flex w-9 h-9 items-center justify-center rounded-lg mb-3 ${colors[color] ?? colors.gray}`}>
        <MetricIcon name={icon} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </>
  )
  if (href) {
    return (
      <Link href={href} className="card p-5 block hover:shadow-md hover:border-blue-200 transition-all group">
        {inner}
        <div className="text-[10px] text-blue-500 font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          View →
        </div>
      </Link>
    )
  }
  return <div className="card p-5">{inner}</div>
}

function MetricIcon({ name }: { name: string }) {
  if (name === 'shield') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  if (name === 'check') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
  if (name === 'warning') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  if (name === 'calendar') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  return null
}

function getRiskDotColor(severity: string) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'text-red-800'
  if (severity === 'MEDIUM') return 'text-amber-800'
  return 'text-gray-700'
}

function getPriorityColor(priority: string) {
  if (priority === 'CRITICAL') return 'bg-red-100 text-red-700 border-red-200'
  if (priority === 'HIGH') return 'bg-red-50 text-red-600 border-red-100'
  if (priority === 'MEDIUM') return 'bg-amber-50 text-amber-600 border-amber-100'
  return 'bg-gray-50 text-gray-500 border-gray-100'
}

function formatAction(action: string) {
  const map: Record<string, string> = {
    CONTROL_STATUS_UPDATE: 'Control status updated',
    STAGE_STATUS_UPDATE: 'Application stage updated',
    DOCUMENT_UPLOAD: 'Document uploaded',
    ALERT_CREATED: 'New alert created',
    ACTION_CREATED: 'Action item created',
    USER_LOGIN: 'User logged in',
  }
  return map[action] ?? action.replace(/_/g, ' ').toLowerCase()
}
