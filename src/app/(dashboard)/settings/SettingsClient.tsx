'use client'

import { useState } from 'react'

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  COMPLIANCE_OFFICER: 'bg-blue-100 text-blue-700',
  RISK_MANAGER: 'bg-amber-100 text-amber-700',
  AUDITOR: 'bg-green-100 text-green-700',
  VIEWER: 'bg-gray-100 text-gray-600',
}

export function SettingsClient({ org, users, currentUser }: { org: any; users: any[]; currentUser: any }) {
  const [tab, setTab] = useState<'organisation' | 'users' | 'notifications' | 'integrations'>('organisation')
  const [orgForm, setOrgForm] = useState({ name: org?.name ?? '', fcaReferenceNumber: org?.fcaReferenceNumber ?? '', primaryEmail: org?.primaryEmail ?? '' })
  const [saved, setSaved] = useState(false)

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/organisation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orgForm),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Organisation configuration and platform settings</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {([
            { key: 'organisation', label: 'Organisation' },
            { key: 'users', label: `User Management (${users.length})` },
            { key: 'notifications', label: 'Notifications' },
            { key: 'integrations', label: 'Integrations' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'organisation' && (
        <div className="max-w-2xl">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Organisation Settings</h2>
            <form onSubmit={saveOrg} className="space-y-4">
              <FormField label="Organisation Name" value={orgForm.name} onChange={v => setOrgForm(f => ({ ...f, name: v }))} />
              <FormField label="FCA Reference Number" value={orgForm.fcaReferenceNumber} onChange={v => setOrgForm(f => ({ ...f, fcaReferenceNumber: v }))} placeholder="FRN 000000" />
              <FormField label="Primary Email" type="email" value={orgForm.primaryEmail} onChange={v => setOrgForm(f => ({ ...f, primaryEmail: v }))} />
              <div className="pt-2 flex items-center gap-3">
                <button type="submit" className="btn-primary">{saved ? '✓ Saved' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{users.length} users in your organisation</p>
            <button className="btn-primary text-sm">+ Invite User</button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 table-header">User</th>
                  <th className="text-left px-5 py-3 table-header">Role</th>
                  <th className="text-left px-5 py-3 table-header">Status</th>
                  <th className="text-left px-5 py-3 table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user: any) => (
                  <tr key={user.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">{user.name?.charAt(0) ?? 'U'}</div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {user.email !== currentUser?.email && (
                        <button className="text-xs text-gray-400 hover:text-red-500">Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="max-w-2xl space-y-4">
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Email Notifications</h2>
            {[
              { label: 'Overdue action items', sub: 'Daily digest of actions past due date', defaultOn: true },
              { label: 'Regulatory changes', sub: 'Alert when new regulatory changes are published', defaultOn: true },
              { label: 'Control review reminders', sub: '7 days before a control review is due', defaultOn: true },
              { label: 'Application stage updates', sub: 'When FCA application stage status changes', defaultOn: false },
              { label: 'Weekly compliance summary', sub: 'Weekly digest of compliance posture changes', defaultOn: false },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">{n.label}</div>
                  <div className="text-xs text-gray-400">{n.sub}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={n.defaultOn} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="max-w-3xl grid grid-cols-2 gap-4">
          {[
            { name: 'Transaction Monitoring API', desc: 'Real-time blockchain analytics and cryptoasset transaction monitoring', status: 'connected', logo: '🔗' },
            { name: 'AML Screening Service', desc: 'Automated AML screening, sanctions checking, and adverse media monitoring', status: 'connected', logo: '🛡️' },
            { name: 'AWS S3', desc: 'Secure document storage and archival with encryption at rest', status: 'connected', logo: '☁️' },
            { name: 'Slack', desc: 'Alert notifications to compliance team channel', status: 'not_connected', logo: '💬' },
            { name: 'Microsoft Teams', desc: 'Compliance alerts and workflow notifications', status: 'not_connected', logo: '📱' },
            { name: 'FCA Connect', desc: 'FCA regulatory portal integration for application submission', status: 'coming_soon', logo: '🏛️' },
            { name: 'IGRC Platform', desc: 'Enterprise GRC integration for consolidated risk reporting', status: 'coming_soon', logo: '⚙️' },
            { name: 'Companies House', desc: 'Automated entity verification and director screening', status: 'coming_soon', logo: '🏢' },
          ].map(integration => (
            <div key={integration.name} className="card p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{integration.logo}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{integration.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{integration.desc}</div>
                  <div className="mt-3">
                    {integration.status === 'connected' && <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">Connected</span>}
                    {integration.status === 'not_connected' && <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Connect</button>}
                    {integration.status === 'coming_soon' && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">Coming Soon</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  )
}
