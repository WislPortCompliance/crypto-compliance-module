'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  COMPLIANCE_OFFICER: 'bg-blue-100 text-blue-700',
  RISK_MANAGER: 'bg-amber-100 text-amber-700',
  AUDITOR: 'bg-green-100 text-green-700',
  VIEWER: 'bg-gray-100 text-gray-600',
}

export function OrganisationClient({ org }: { org: any }) {
  const [tab, setTab] = useState<'details' | 'profile' | 'users' | 'entities'>('details')

  if (!org) return <div className="p-6">Organisation not found.</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
          {org.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            {org.fcaReferenceNumber && (
              <span className="text-sm text-gray-500">FCA Ref: <strong>{org.fcaReferenceNumber}</strong></span>
            )}
            {org.entityType && (
              <span className="text-sm text-gray-500">· {org.entityType}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {(['details', 'profile', 'users', 'entities'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'details' ? 'Company Details' : t === 'profile' ? 'Activity Profile' : t === 'users' ? `Users (${org.users?.length ?? 0})` : `Entities (${org.entities?.length ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'details' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Company Information</h2>
            <InfoRow label="Legal Name" value={org.name} />
            <InfoRow label="FCA Reference Number" value={org.fcaReferenceNumber ?? '—'} />
            <InfoRow label="Companies House Number" value={org.registrationNumber ?? '—'} />
            <InfoRow label="Entity Type" value={org.entityType ?? '—'} />
            <InfoRow label="Incorporation Date" value={formatDate(org.incorporationDate)} />
            <InfoRow label="Website" value={org.website ?? '—'} />
            <InfoRow label="Primary Contact" value={org.primaryContact ?? '—'} />
            <InfoRow label="Primary Email" value={org.primaryEmail ?? '—'} />
          </div>
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">FCA Application Status</h2>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm font-semibold text-blue-900">Application In Progress</div>
              <div className="text-xs text-blue-700 mt-1">FCA Cryptoasset Authorisation under FSMA s.19</div>
            </div>
            <InfoRow label="Regulatory Framework" value="FCA Cryptoassets Regime 2026" />
            <InfoRow label="Application Type" value="New Authorisation" />
            <InfoRow label="Target Submission" value="Q3 2026" />
          </div>
        </div>
      )}

      {tab === 'profile' && org.profile && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Cryptoasset Types</h2>
            <div className="flex flex-wrap gap-2">
              {org.profile.assetTypes?.map((at: any) => (
                <span key={at.id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">{at.name}</span>
              ))}
            </div>
          </div>
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Services Provided</h2>
            <div className="flex flex-wrap gap-2">
              {org.profile.serviceTypes?.map((svc: any) => (
                <span key={svc.id} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">{svc.name}</span>
              ))}
            </div>
          </div>
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Operating Locations</h2>
            <div className="space-y-2">
              {org.profile.operatingLocations?.map((loc: any) => (
                <div key={loc.id} className="flex items-center gap-2">
                  <span className="text-base">{countryFlag(loc.countryCode)}</span>
                  <span className="text-sm text-gray-700">{loc.country}</span>
                  {loc.isPrimary && <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">Primary</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Organisation Scale</h2>
            <InfoRow label="Headcount" value={org.profile.headcountRange ?? '—'} />
            <InfoRow label="Revenue Range" value={org.profile.revenueRange ?? '—'} />
            <InfoRow label="Years in Crypto" value={org.profile.yearsInCrypto ? `${org.profile.yearsInCrypto} years` : '—'} />
            <InfoRow label="Customer Types" value={Array.isArray(org.profile.customerTypes) ? org.profile.customerTypes.join(', ') : (org.profile.customerTypes ?? '—')} />
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 table-header">Name</th>
                <th className="text-left px-5 py-3 table-header">Email</th>
                <th className="text-left px-5 py-3 table-header">Role</th>
                <th className="text-left px-5 py-3 table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {org.users?.map((user: any) => (
                <tr key={user.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">
                        {user.name?.charAt(0) ?? 'U'}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'entities' && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Legal Entities</h2>
          </div>
          {org.entities?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 table-header">Entity Name</th>
                  <th className="text-left px-5 py-3 table-header">FCA Ref</th>
                  <th className="text-left px-5 py-3 table-header">Type</th>
                  <th className="text-left px-5 py-3 table-header">Jurisdiction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {org.entities.map((entity: any) => (
                  <tr key={entity.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{entity.name}</td>
                    <td className="px-5 py-3 text-gray-500">{entity.fcaRef ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{entity.entityType ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{entity.jurisdiction ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">No additional entities configured</div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}

function countryFlag(code: string) {
  const flags: Record<string, string> = { GB: '🇬🇧', DE: '🇩🇪', SG: '🇸🇬', US: '🇺🇸', FR: '🇫🇷', NL: '🇳🇱' }
  return flags[code] ?? '🌍'
}
