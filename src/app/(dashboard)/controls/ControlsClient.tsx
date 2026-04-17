'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'

const STATUS_OPTIONS = ['COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'NOT_ASSESSED']
const STATUS_LABELS: Record<string, string> = {
  COMPLIANT: 'Compliant',
  PARTIALLY_COMPLIANT: 'Partially Compliant',
  NON_COMPLIANT: 'Non-Compliant',
  NOT_ASSESSED: 'Not Assessed',
}

const STATUS_DOT: Record<string, string> = {
  COMPLIANT: 'bg-green-500',
  PARTIALLY_COMPLIANT: 'bg-amber-500',
  NON_COMPLIANT: 'bg-red-500',
  NOT_ASSESSED: 'bg-gray-400',
}

const jurisdictionColors: Record<string, string> = {
  UK: 'bg-blue-100 text-blue-700',
  EU: 'bg-purple-100 text-purple-700',
  US: 'bg-red-100 text-red-700',
  Global: 'bg-green-100 text-green-700',
}

interface ControlForm {
  controlRef: string
  name: string
  description: string
  categoryId: string
  fcaPrincipleId: string
  status: string
  notes: string
  ownerId: string
  reminderEmail: string
}

const BLANK_FORM: ControlForm = {
  controlRef: '', name: '', description: '', categoryId: '', fcaPrincipleId: '', status: 'NOT_ASSESSED', notes: '',
  ownerId: '', reminderEmail: '',
}

export function ControlsClient({ controls, categories, principles, regulations, users = [] }: { controls: any[]; categories: any[]; principles: any[]; regulations: any[]; users?: any[] }) {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterOther, setFilterOther] = useState<'' | 'reviewsDue' | 'controlRef'>('')
  const [filterControlRef, setFilterControlRef] = useState('')

  // ─── Apply URL query params on mount (drill-in from dashboard/monitoring) ─
  useEffect(() => {
    const status = searchParams?.get('filterStatus')
    const filter = searchParams?.get('filter')
    const controlRef = searchParams?.get('controlRef')
    if (status) setFilterStatus(status)
    if (filter === 'reviewsDue') setFilterOther('reviewsDue')
    if (controlRef) { setFilterControlRef(controlRef); setFilterOther('controlRef'); setSearch(controlRef) }
  }, [searchParams])
  const [selected, setSelected] = useState<any | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [localControls, setLocalControls] = useState(controls)

  // Add modal
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<ControlForm>(BLANK_FORM)
  const [addSaving, setAddSaving] = useState(false)

  // Edit modal
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<ControlForm>(BLANK_FORM)
  const [editSaving, setEditSaving] = useState(false)

  // Delete confirmation
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)

  // Audit log for selected control
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)

  // Evidence management
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [evidenceMode, setEvidenceMode] = useState<'note' | 'link' | 'upload'>('note')
  const [evidenceDescription, setEvidenceDescription] = useState('')
  const [evidenceDocId, setEvidenceDocId] = useState('')
  const [evidenceNewDocName, setEvidenceNewDocName] = useState('')
  const [evidenceNewDocContent, setEvidenceNewDocContent] = useState('')
  const [evidenceNewDocType, setEvidenceNewDocType] = useState<'EVIDENCE' | 'POLICY' | 'PROCEDURE' | 'REPORT' | 'CERTIFICATE' | 'OTHER'>('EVIDENCE')
  const [evidenceSaving, setEvidenceSaving] = useState(false)
  const [orgDocs, setOrgDocs] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  const filtered = useMemo(() => {
    const now = new Date()
    const in30 = new Date(now.getTime() + 30 * 86400000)
    return localControls.filter(c => {
      if (filterCat && c.categoryId !== filterCat) return false
      if (filterStatus && c.status !== filterStatus) return false
      if (filterOther === 'reviewsDue') {
        if (!c.nextReviewDate) return false
        const d = new Date(c.nextReviewDate)
        if (d > in30) return false
      }
      if (filterOther === 'controlRef' && filterControlRef && c.controlRef !== filterControlRef) return false
      if (search) {
        const q = search.toLowerCase()
        return c.name.toLowerCase().includes(q) || c.controlRef.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [localControls, filterCat, filterStatus, filterOther, filterControlRef, search])

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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddSaving(true)
    try {
      const res = await fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const ctrl = await res.json()
      if (ctrl.id) {
        const fullCtrl = {
          ...ctrl,
          category: categories.find(c => c.id === ctrl.categoryId),
          fcaPrinciple: principles.find(p => p.id === ctrl.fcaPrincipleId) ?? null,
          owner: users.find((u: any) => u.id === ctrl.ownerId) ?? null,
          evidence: [],
          regulationMappings: [],
        }
        setLocalControls(prev => [...prev, fullCtrl])
        setShowAdd(false)
        setAddForm(BLANK_FORM)
      }
    } finally {
      setAddSaving(false)
    }
  }

  function openEdit(ctrl: any) {
    setEditForm({
      controlRef: ctrl.controlRef,
      name: ctrl.name,
      description: ctrl.description,
      categoryId: ctrl.categoryId,
      fcaPrincipleId: ctrl.fcaPrincipleId ?? '',
      status: ctrl.status,
      notes: ctrl.notes ?? '',
      ownerId: ctrl.ownerId ?? '',
      reminderEmail: ctrl.reminderEmail ?? '',
    })
    setShowEdit(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setEditSaving(true)
    try {
      await fetch('/api/controls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, ...editForm }),
      })
      const updatedCtrl = {
        ...selected,
        ...editForm,
        category: categories.find(c => c.id === editForm.categoryId) ?? selected.category,
        fcaPrinciple: principles.find(p => p.id === editForm.fcaPrincipleId) ?? null,
        owner: editForm.ownerId ? (users.find((u: any) => u.id === editForm.ownerId) ?? null) : null,
        lastReviewed: new Date().toISOString(),
      }
      setLocalControls(prev => prev.map(c => c.id === selected.id ? updatedCtrl : c))
      setSelected(updatedCtrl)
      setShowEdit(false)
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleteSaving(true)
    try {
      await fetch(`/api/controls/${id}`, { method: 'DELETE' })
      setLocalControls(prev => prev.filter(c => c.id !== id))
      setSelected(null)
      setShowDelete(null)
    } finally {
      setDeleteSaving(false)
    }
  }

  async function loadAuditLog(controlId: string) {
    setLoadingAudit(true)
    try {
      const res = await fetch(`/api/audit-logs?entityType=ComplianceControl&entityId=${controlId}`)
      const data = await res.json()
      setAuditLogs(Array.isArray(data) ? data : [])
    } finally {
      setLoadingAudit(false)
    }
  }

  function selectControl(ctrl: any) {
    setSelected(ctrl)
    loadAuditLog(ctrl.id)
  }

  // ─── Evidence management ─────────────────────────────────────────────────
  function resetEvidenceForm() {
    setEvidenceMode('note')
    setEvidenceDescription('')
    setEvidenceDocId('')
    setEvidenceNewDocName('')
    setEvidenceNewDocContent('')
    setEvidenceNewDocType('EVIDENCE')
  }

  async function openEvidenceModal() {
    resetEvidenceForm()
    setShowEvidenceModal(true)
    setLoadingDocs(true)
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      setOrgDocs(Array.isArray(data) ? data : [])
    } finally {
      setLoadingDocs(false)
    }
  }

  function onEvidenceFileChosen(file: File) {
    setEvidenceNewDocName(file.name)
    if (file.size > 2_000_000) {
      setEvidenceNewDocContent('[File exceeds 2MB inline limit. Paste content or use a link to an external store.]')
      return
    }
    // Read text-based formats as plain text. For binary, show a placeholder.
    const textTypes = /\.(md|txt|csv|json|xml|yaml|yml|html|sql|log)$/i
    if (textTypes.test(file.name) || file.type.startsWith('text/')) {
      const reader = new FileReader()
      reader.onload = e => setEvidenceNewDocContent(String(e.target?.result ?? ''))
      reader.readAsText(file)
    } else {
      setEvidenceNewDocContent(`[${file.type || 'binary'} file — ${(file.size / 1024).toFixed(1)}KB. Content is not rendered inline. The file metadata is stored.]`)
    }
  }

  async function saveEvidence() {
    if (!selected) return
    const payload: any = { controlId: selected.id }

    if (evidenceMode === 'note') {
      if (!evidenceDescription.trim()) return
      payload.description = evidenceDescription.trim()
    } else if (evidenceMode === 'link') {
      if (!evidenceDocId) return
      payload.documentId = evidenceDocId
      if (evidenceDescription.trim()) payload.description = evidenceDescription.trim()
    } else if (evidenceMode === 'upload') {
      if (!evidenceNewDocName.trim() || !evidenceNewDocContent) return
      payload.newDocument = {
        name: evidenceNewDocName.trim(),
        content: evidenceNewDocContent,
        type: evidenceNewDocType,
        mimeType: 'text/markdown',
      }
      if (evidenceDescription.trim()) payload.description = evidenceDescription.trim()
    }

    setEvidenceSaving(true)
    try {
      const res = await fetch('/api/control-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return
      const evidence = await res.json()
      const updated = { ...selected, evidence: [evidence, ...(selected.evidence ?? [])] }
      setSelected(updated)
      setLocalControls(prev => prev.map(c => c.id === selected.id ? updated : c))
      setShowEvidenceModal(false)
      resetEvidenceForm()
    } finally {
      setEvidenceSaving(false)
    }
  }

  async function deleteEvidence(evidenceId: string) {
    if (!selected) return
    const res = await fetch('/api/control-evidence', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: evidenceId }),
    })
    if (!res.ok) return
    const updated = { ...selected, evidence: (selected.evidence ?? []).filter((ev: any) => ev.id !== evidenceId) }
    setSelected(updated)
    setLocalControls(prev => prev.map(c => c.id === selected.id ? updated : c))
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
            <button onClick={() => setShowAdd(true)} className="btn-primary">+ Add Control</button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4">
            {[
              { label: 'Compliant', count: stats.compliant, color: 'bg-green-500', val: 'COMPLIANT' },
              { label: 'Partial', count: stats.partial, color: 'bg-amber-500', val: 'PARTIALLY_COMPLIANT' },
              { label: 'Non-Compliant', count: stats.nonCompliant, color: 'bg-red-500', val: 'NON_COMPLIANT' },
              { label: 'Not Assessed', count: stats.notAssessed, color: 'bg-gray-400', val: 'NOT_ASSESSED' },
            ].map(s => (
              <button key={s.val} onClick={() => setFilterStatus(filterStatus === s.val ? '' : s.val)}
                className={`flex items-center gap-2 text-sm transition-colors ${filterStatus === s.val ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${s.color}`}></span>
                <span>{s.label}</span>
                <span className="font-semibold text-gray-900">{s.count}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search controls..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(filterOther === 'reviewsDue' || (filterOther === 'controlRef' && filterControlRef)) && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm">
              <div className="flex items-center gap-2 text-blue-800">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                <span className="font-medium">
                  {filterOther === 'reviewsDue' && 'Showing controls with a review due within 30 days'}
                  {filterOther === 'controlRef' && `Showing control: ${filterControlRef}`}
                </span>
              </div>
              <button
                onClick={() => { setFilterOther(''); setFilterControlRef(''); if (filterOther === 'controlRef') setSearch('') }}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
              >
                Clear filter
              </button>
            </div>
          )}
          {byCategory.map(({ category, controls: catControls }) => (
            <div key={category?.id ?? 'unknown'}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-gray-700">{category?.name ?? 'Unknown'}</h2>
                <span className="text-xs text-gray-400">{catControls.length} controls</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 table-header">Ref</th>
                      <th className="text-left px-4 py-3 table-header">Control</th>
                      <th className="text-left px-4 py-3 table-header">Status</th>
                      <th className="text-left px-4 py-3 table-header">Owner</th>
                      <th className="text-left px-4 py-3 table-header">Next Review</th>
                      <th className="text-left px-4 py-3 table-header">Regulations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {catControls.map(ctrl => (
                      <tr key={ctrl.id} onClick={() => selectControl(ctrl)}
                        className={`cursor-pointer transition-colors hover:bg-blue-50/50 ${selected?.id === ctrl.id ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{ctrl.controlRef}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{ctrl.name}</div>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <StatusSelect status={ctrl.status} disabled={updatingId === ctrl.id} onChange={s => updateStatus(ctrl.id, s)} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{ctrl.owner?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          <span className={ctrl.nextReviewDate && new Date(ctrl.nextReviewDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                            {formatDate(ctrl.nextReviewDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {ctrl.regulationMappings?.length > 0 ? `${ctrl.regulationMappings.length} reg${ctrl.regulationMappings.length !== 1 ? 's' : ''}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {byCategory.length === 0 && (
            <div className="text-center py-12 text-gray-400">No controls match the current filters.</div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-[400px] flex flex-col overflow-hidden bg-white flex-shrink-0">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs font-mono text-gray-400">{selected.controlRef}</div>
              <h3 className="text-base font-semibold text-gray-900 mt-0.5 truncate">{selected.name}</h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <button onClick={() => openEdit(selected)} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-50">Edit</button>
              <button onClick={() => setShowDelete(selected.id)} className="text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1 rounded border border-red-200 hover:bg-red-50">Delete</button>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 ml-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</div>
              <StatusSelect status={selected.status} disabled={updatingId === selected.id} onChange={s => updateStatus(selected.id, s)} large />
            </div>
            <DetailRow label="Category" value={selected.category?.name} />
            <DetailRow label="FCA Principle" value={selected.fcaPrinciple ? `Principle ${selected.fcaPrinciple.number}: ${selected.fcaPrinciple.name}` : '—'} />
            <DetailRow label="Owner" value={selected.owner?.name ?? '—'} />
            {selected.reminderEmail && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Reminder Email</div>
                <div className="text-sm text-gray-800 break-all">{selected.reminderEmail}</div>
              </div>
            )}
            <DetailRow label="Last Reviewed" value={formatDate(selected.lastReviewed)} />
            <DetailRow label="Next Review" value={formatDate(selected.nextReviewDate)} />
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</div>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
            </div>
            {selected.notes && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</div>
                <p className="text-sm text-gray-600 leading-relaxed">{selected.notes}</p>
              </div>
            )}

            {/* Mapped Regulations */}
            {selected.regulationMappings?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Mapped Regulations ({selected.regulationMappings.length})</div>
                <div className="space-y-1.5">
                  {selected.regulationMappings.map((rm: any) => (
                    <Link key={rm.id} href="/compliance-map"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${jurisdictionColors[rm.regulation.jurisdiction] ?? 'bg-gray-100 text-gray-600'}`}>
                        {rm.regulation.jurisdiction}
                      </span>
                      <span className="text-xs font-medium text-gray-700 truncate">{rm.regulation.name}</span>
                      <svg className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence — supports the current status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">
                  Evidence ({selected.evidence?.length ?? 0})
                </div>
                <button
                  onClick={openEvidenceModal}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Add
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mb-2 leading-snug">
                Attach text, link an existing document, or upload new content that supports the current status.
              </p>
              {selected.evidence?.length > 0 ? (
                <div className="space-y-1.5">
                  {selected.evidence.map((ev: any) => (
                    <EvidenceRow key={ev.id} ev={ev} onDelete={() => deleteEvidence(ev.id)} />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic py-2 px-3 border border-dashed border-gray-200 rounded-lg text-center">
                  No evidence attached yet. Click <strong>Add</strong> to attach the first item.
                </div>
              )}
            </div>

            {/* Audit Trail */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Audit Trail</div>
              {loadingAudit ? (
                <div className="text-xs text-gray-400">Loading...</div>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {auditLogs.slice(0, 10).map((log: any) => (
                    <div key={log.id} className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5"></div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-700">{log.action?.replace(/_/g, ' ').toLowerCase()}</div>
                        <div className="text-gray-400">{formatDate(log.createdAt)} · {log.user?.name ?? 'System'}</div>
                        {log.newValues && (
                          <div className="text-gray-500 font-mono">{JSON.stringify(log.newValues).slice(0, 50)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No audit entries yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Control Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Control</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Control Reference *</label>
                  <input required type="text" placeholder="e.g. AML-012" value={addForm.controlRef} onChange={e => setAddForm(f => ({ ...f, controlRef: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select required value={addForm.categoryId} onChange={e => setAddForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Control Name *</label>
                <input required type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea required rows={3} value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FCA Principle</label>
                  <select value={addForm.fcaPrincipleId} onChange={e => setAddForm(f => ({ ...f, fcaPrincipleId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">None</option>
                    {principles.map(p => <option key={p.id} value={p.id}>P{p.number}: {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                  <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <select
                    value={addForm.ownerId}
                    onChange={e => {
                      const uid = e.target.value
                      const user = users.find((u: any) => u.id === uid)
                      setAddForm(f => ({ ...f, ownerId: uid, reminderEmail: f.reminderEmail || user?.email || '' }))
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">— Unassigned —</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role?.replace(/_/g, ' ').toLowerCase()})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Email</label>
                  <input
                    type="email"
                    placeholder="e.g. compliance@firm.com"
                    value={addForm.reminderEmail}
                    onChange={e => setAddForm(f => ({ ...f, reminderEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">Auto-fills from owner. Override for external reviewers.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setAddForm(BLANK_FORM) }} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={addSaving} className="flex-1 btn-primary disabled:opacity-50">{addSaving ? 'Adding...' : 'Add Control'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Control Modal */}
      {showEdit && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Control — {selected.controlRef}</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Control Name *</label>
                <input required type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea required rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={editForm.categoryId} onChange={e => setEditForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <select
                    value={editForm.ownerId}
                    onChange={e => {
                      const uid = e.target.value
                      const user = users.find((u: any) => u.id === uid)
                      setEditForm(f => ({ ...f, ownerId: uid, reminderEmail: f.reminderEmail || user?.email || '' }))
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">— Unassigned —</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role?.replace(/_/g, ' ').toLowerCase()})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Email</label>
                  <input
                    type="email"
                    placeholder="e.g. compliance@firm.com"
                    value={editForm.reminderEmail}
                    onChange={e => setEditForm(f => ({ ...f, reminderEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={editSaving} className="flex-1 btn-primary disabled:opacity-50">{editSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {showEvidenceModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Evidence</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Attach evidence to <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{selected.controlRef}</span> — {selected.name}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
              {([
                { id: 'note', label: 'Text Note', desc: 'Add a commentary or finding' },
                { id: 'link', label: 'Link Document', desc: 'Point to an existing file' },
                { id: 'upload', label: 'New Document', desc: 'Upload or paste new content' },
              ] as const).map(m => (
                <button
                  key={m.id}
                  onClick={() => setEvidenceMode(m.id)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    evidenceMode === m.id ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mode: Note */}
            {evidenceMode === 'note' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note / Finding *</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="e.g. Reviewed transaction monitoring rules on 14 April 2026 with MLRO. All 12 rules active and thresholds within policy. Two false-positive cases closed under review number FP-2026-04-12."
                    value={evidenceDescription}
                    onChange={e => setEvidenceDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Plain text. No file or link — use this to capture narrative evidence, meeting outcomes, or review findings.</p>
                </div>
              </div>
            )}

            {/* Mode: Link */}
            {evidenceMode === 'link' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select an existing document *</label>
                  {loadingDocs ? (
                    <div className="text-sm text-gray-400 py-2">Loading documents…</div>
                  ) : (
                    <select
                      required
                      value={evidenceDocId}
                      onChange={e => setEvidenceDocId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Choose a document…</option>
                      {orgDocs.filter(d => !d.isTemplate).map(d => (
                        <option key={d.id} value={d.id}>{d.name} · {d.type}</option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Only live documents are listed (templates are excluded).</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Why this document supports the status"
                    value={evidenceDescription}
                    onChange={e => setEvidenceDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Mode: Upload */}
            {evidenceMode === 'upload' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Q1 2026 TM Review"
                      value={evidenceNewDocName}
                      onChange={e => setEvidenceNewDocName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={evidenceNewDocType}
                      onChange={e => setEvidenceNewDocType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="EVIDENCE">Evidence</option>
                      <option value="POLICY">Policy</option>
                      <option value="PROCEDURE">Procedure</option>
                      <option value="REPORT">Report</option>
                      <option value="CERTIFICATE">Certificate</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload file (optional)</label>
                  <input
                    type="file"
                    accept=".md,.txt,.csv,.json,.xml,.yaml,.yml,.html,.sql,.log,.pdf,.doc,.docx"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) onEvidenceFileChosen(f)
                    }}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">Text files (.md .txt .csv .json .xml .yaml .html) are read inline. Max 2MB.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Paste markdown or plain-text content here. Sections, tables, and checklists are supported."
                    value={evidenceNewDocContent}
                    onChange={e => setEvidenceNewDocContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short description (optional)</label>
                  <input
                    type="text"
                    placeholder="One-line summary of why this supports the status"
                    value={evidenceDescription}
                    onChange={e => setEvidenceDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-5">
              <button
                type="button"
                onClick={() => { setShowEvidenceModal(false); resetEvidenceForm() }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEvidence}
                disabled={evidenceSaving || (
                  evidenceMode === 'note' ? !evidenceDescription.trim() :
                  evidenceMode === 'link' ? !evidenceDocId :
                  !evidenceNewDocName.trim() || !evidenceNewDocContent
                )}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {evidenceSaving ? 'Saving…' : 'Add Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Control</h3>
                <p className="text-sm text-gray-500">{localControls.find(c => c.id === showDelete)?.name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              This will permanently remove the control and all associated audit history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowDelete(null)} className="flex-1 btn-secondary">Cancel</button>
              <button type="button" onClick={() => handleDelete(showDelete)} disabled={deleteSaving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleteSaving ? 'Deleting...' : 'Delete Control'}
              </button>
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
    <select value={status} onChange={e => { e.stopPropagation(); onChange(e.target.value) }} disabled={disabled}
      onClick={e => e.stopPropagation()}
      className={`border rounded font-medium cursor-pointer ${large ? 'text-sm px-3 py-1.5 w-full' : 'text-xs px-2 py-1'} ${colors[status] ?? colors.NOT_ASSESSED} disabled:opacity-50`}>
      <option value="COMPLIANT">Compliant</option>
      <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
      <option value="NON_COMPLIANT">Non-Compliant</option>
      <option value="NOT_ASSESSED">Not Assessed</option>
    </select>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value ?? '—'}</div>
    </div>
  )
}

function EvidenceRow({ ev, onDelete }: { ev: any; onDelete: () => void }) {
  const hasDoc = !!ev.document
  const hasText = !!ev.description
  const icon = hasDoc ? (
    <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ) : (
    <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
  )
  const added = ev.addedAt ? new Date(ev.addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  return (
    <div className="group relative p-2.5 rounded-md border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200 transition-colors">
      <div className="flex items-start gap-2">
        {icon}
        <div className="flex-1 min-w-0">
          {hasDoc && (
            <Link href={`/documents/${ev.document.id}`} className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline truncate block">
              {ev.document.name}
            </Link>
          )}
          {hasText && (
            <div className={`text-xs ${hasDoc ? 'text-gray-500 mt-0.5' : 'text-gray-700'} leading-snug whitespace-pre-wrap`}>
              {ev.description}
            </div>
          )}
          <div className="text-[10px] text-gray-400 mt-1">
            {hasDoc && hasText ? 'Linked document + note' : hasDoc ? 'Linked document' : 'Text note'}
            {added && <> · added {added}</>}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          title="Remove evidence"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}
