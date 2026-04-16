'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
}

const BLANK_FORM: ControlForm = {
  controlRef: '', name: '', description: '', categoryId: '', fcaPrincipleId: '', status: 'NOT_ASSESSED', notes: '',
}

export function ControlsClient({ controls, categories, principles, regulations }: { controls: any[]; categories: any[]; principles: any[]; regulations: any[] }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
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

  const filtered = useMemo(() => localControls.filter(c => {
    if (filterCat && c.categoryId !== filterCat) return false
    if (filterStatus && c.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.controlRef.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    }
    return true
  }), [localControls, filterCat, filterStatus, search])

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
          owner: null,
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

            {/* Evidence */}
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
              ) : <p className="text-xs text-gray-400">No evidence attached</p>}
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
