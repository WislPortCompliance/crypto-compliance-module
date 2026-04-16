export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLIANT':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'PARTIALLY_COMPLIANT':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'NON_COMPLIANT':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'NOT_ASSESSED':
      return 'text-gray-500 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200'
  }
}

export function getStatusDot(status: string) {
  switch (status) {
    case 'COMPLIANT': return 'bg-green-500'
    case 'PARTIALLY_COMPLIANT': return 'bg-amber-500'
    case 'NON_COMPLIANT': return 'bg-red-500'
    default: return 'bg-gray-400'
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'COMPLIANT': return 'Compliant'
    case 'PARTIALLY_COMPLIANT': return 'Partially Compliant'
    case 'NON_COMPLIANT': return 'Non-Compliant'
    case 'NOT_ASSESSED': return 'Not Assessed'
    case 'NOT_STARTED': return 'Not Started'
    case 'IN_PROGRESS': return 'In Progress'
    case 'COMPLETE': return 'Complete'
    case 'NA': return 'N/A'
    default: return status
  }
}

export function getRiskColor(level: string) {
  switch (level) {
    case 'CRITICAL': return 'text-red-700 bg-red-100 border-red-200'
    case 'HIGH': return 'text-red-600 bg-red-50 border-red-200'
    case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'LOW': return 'text-green-600 bg-green-50 border-green-200'
    case 'INFO': return 'text-blue-600 bg-blue-50 border-blue-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function getStageStatusColor(status: string) {
  switch (status) {
    case 'COMPLETE': return 'text-green-600 bg-green-50'
    case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50'
    case 'NOT_STARTED': return 'text-gray-500 bg-gray-50'
    case 'NA': return 'text-gray-400 bg-gray-50'
    default: return 'text-gray-500 bg-gray-50'
  }
}

export function formatDate(date: Date | string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelativeDate(date: Date | string | null) {
  if (!date) return '—'
  const d = new Date(date)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.round(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 0) return `In ${days} days`
  return `${Math.abs(days)} days ago`
}

export function calculateComplianceScore(controls: { status: string }[]) {
  if (controls.length === 0) return 0
  const weights: Record<string, number> = { COMPLIANT: 1, PARTIALLY_COMPLIANT: 0.5, NON_COMPLIANT: 0, NOT_ASSESSED: 0 }
  const total = controls.reduce((sum, c) => sum + (weights[c.status] ?? 0), 0)
  return Math.round((total / controls.length) * 100)
}
