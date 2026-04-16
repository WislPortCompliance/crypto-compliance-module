'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

const typeColors: Record<string, string> = {
  POLICY: 'bg-blue-100 text-blue-700',
  PROCEDURE: 'bg-purple-100 text-purple-700',
  EVIDENCE: 'bg-green-100 text-green-700',
  CERTIFICATE: 'bg-amber-100 text-amber-700',
  REPORT: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

const typeIcons: Record<string, string> = {
  POLICY: '📋',
  PROCEDURE: '📝',
  EVIDENCE: '🔍',
  CERTIFICATE: '🏆',
  REPORT: '📊',
  OTHER: '📄',
}

const auditActionLabels: Record<string, string> = {
  CONTROL_STATUS_UPDATE: 'Control status updated',
  STAGE_STATUS_UPDATE: 'Stage status updated',
  DOCUMENT_UPLOAD: 'Document uploaded',
  ALERT_CREATED: 'Alert created',
  ACTION_CREATED: 'Action item created',
  USER_LOGIN: 'User signed in',
}

// ─── Template Definitions ─────────────────────────────────────────────────────

interface TemplateField {
  id: string
  label: string
  helpText: string
  placeholder: string
  multiline: boolean
}

interface Template {
  id: string
  name: string
  type: string
  version: string
  description: string
  icon: string
  fields: TemplateField[]
}

const TEMPLATES: Template[] = [
  {
    id: 'regulatory-perimeter',
    name: 'Regulatory Perimeter Analysis',
    type: 'EVIDENCE',
    version: '1.0',
    description: 'Assessment of which activities fall within the FCA regulated perimeter',
    icon: '🔍',
    fields: [
      { id: 'companyName', label: 'Company Name', helpText: 'Legal name of your company', placeholder: 'e.g. BlockChain Securities Ltd', multiline: false },
      { id: 'proposedActivities', label: 'Proposed Business Activities', helpText: 'Describe the cryptoasset activities you intend to conduct', placeholder: 'e.g. Operating a cryptoasset exchange, providing custody services...', multiline: true },
      { id: 'assetTypes', label: 'Cryptoasset Types in Scope', helpText: 'List the types of cryptoassets your services will cover', placeholder: 'e.g. Bitcoin, Ether, stablecoins, utility tokens...', multiline: true },
      { id: 'regulatoryAssessment', label: 'Regulatory Classification', helpText: 'How are your activities classified under FSMA and the RAO?', placeholder: 'e.g. Exchange activities fall under Article 25D RAO...', multiline: true },
      { id: 'keyConclusions', label: 'Key Conclusions', helpText: 'Summarise your conclusions on regulatory perimeter', placeholder: 'e.g. FCA authorisation required before commencing operations...', multiline: true },
      { id: 'nextSteps', label: 'Recommended Next Steps', helpText: 'What regulatory steps do you need to take?', placeholder: 'e.g. Submit pre-application engagement to FCA, appoint SMF holders...', multiline: true },
    ],
  },
  {
    id: 'business-model',
    name: 'Business Model Assessment',
    type: 'POLICY',
    version: '1.0',
    description: 'Regulatory business plan covering company overview, activities, and governance',
    icon: '📋',
    fields: [
      { id: 'companyOverview', label: 'Company Overview', helpText: 'Brief description of your company, history, and key facts', placeholder: 'e.g. Founded in 2019, headquartered in London, 50+ employees...', multiline: true },
      { id: 'businessActivities', label: 'Core Business Activities', helpText: 'Describe each business line in detail', placeholder: 'e.g. Exchange platform, custody services, OTC trading desk...', multiline: true },
      { id: 'targetMarket', label: 'Target Market', helpText: 'Who are your target customers?', placeholder: 'e.g. UK retail investors, professional clients, institutional counterparties...', multiline: true },
      { id: 'revenueModel', label: 'Revenue Model', helpText: 'How does your company generate revenue?', placeholder: 'e.g. Trading fees (0.20% taker), custody fees (0.15% p.a.), staking management fees...', multiline: true },
      { id: 'governanceStructure', label: 'Governance Structure', helpText: 'Describe your board and senior management structure', placeholder: 'e.g. 3 executive directors, 2 NEDs, quarterly board meetings, Risk Committee...', multiline: true },
      { id: 'keyRisks', label: 'Key Risk Factors', helpText: 'What are the main business and regulatory risks?', placeholder: 'e.g. Regulatory change risk, cyber risk, market volatility, key person dependency...', multiline: true },
    ],
  },
  {
    id: 'aml-ctf-policy',
    name: 'AML/CTF Policy Document',
    type: 'POLICY',
    version: '1.0',
    description: 'Anti-Money Laundering and Counter-Terrorist Financing policy',
    icon: '🛡️',
    fields: [
      { id: 'policyStatement', label: 'Policy Statement', helpText: "State your firm's commitment to AML/CTF compliance", placeholder: 'e.g. [Company] is committed to preventing money laundering and terrorist financing...', multiline: true },
      { id: 'governance', label: 'Governance and Oversight', helpText: 'Describe the MLRO role and three lines of defence', placeholder: 'e.g. MLRO appointed under Reg 21 MLR 2017, supported by 4-person compliance team...', multiline: true },
      { id: 'riskAssessment', label: 'Risk Assessment Approach', helpText: 'How does your firm assess AML/CTF risk?', placeholder: 'e.g. Firm-wide risk assessment updated annually, covering customer, product, geographic risk...', multiline: true },
      { id: 'cdd', label: 'Customer Due Diligence', helpText: 'Describe your CDD/EDD/SDD procedures', placeholder: 'e.g. Standard CDD includes ID verification, proof of address, source of funds above £2,000...', multiline: true },
      { id: 'transactionMonitoring', label: 'Transaction Monitoring', helpText: 'How do you monitor transactions for suspicious activity?', placeholder: 'e.g. Automated TMS with 47 rules, ML anomaly detection, blockchain analytics integration...', multiline: true },
      { id: 'sarReporting', label: 'SAR Reporting Procedures', helpText: 'Describe your internal and external SAR process', placeholder: 'e.g. Internal SARs submitted to MLRO within 24 hours, external SARs to NCA via UKFIU...', multiline: true },
    ],
  },
  {
    id: 'risk-framework',
    name: 'Risk Assessment Framework',
    type: 'PROCEDURE',
    version: '1.0',
    description: 'Enterprise risk methodology, risk appetite, and risk scoring framework',
    icon: '⚠️',
    fields: [
      { id: 'methodology', label: 'Risk Methodology', helpText: 'Describe your risk identification and assessment approach', placeholder: 'e.g. Annual risk workshops, horizon scanning, incident reporting, Likelihood × Impact scoring...', multiline: true },
      { id: 'riskAppetite', label: 'Risk Appetite Statement', helpText: "State the Board's risk appetite across key categories", placeholder: 'e.g. Zero tolerance for regulatory breaches; low appetite for cyber risk; moderate appetite for market risk...', multiline: true },
      { id: 'scoringMatrix', label: 'Risk Scoring Matrix', helpText: 'Define your likelihood (1–5) and impact (1–5) scales', placeholder: 'e.g. Likelihood 1=Remote (<5%), 5=Almost Certain (>80%); Impact 1=Negligible (<£50k)...', multiline: true },
      { id: 'riskCategories', label: 'Key Risk Categories', helpText: 'List the main risk categories you monitor', placeholder: 'e.g. Regulatory, AML/Financial Crime, Technology/Cyber, Market, Operational, Reputational...', multiline: true },
      { id: 'monitoring', label: 'Monitoring and Reporting', helpText: 'How frequently is the risk register reviewed and reported?', placeholder: 'e.g. Monthly management review, quarterly Risk Committee, annual Board approval of risk appetite...', multiline: true },
    ],
  },
  {
    id: 'financial-resources',
    name: 'Financial Resources Assessment',
    type: 'REPORT',
    version: '1.0',
    description: 'Capital adequacy, financial projections, and liquidity analysis',
    icon: '💰',
    fields: [
      { id: 'capitalRequirements', label: 'Capital Requirements', helpText: 'Summarise your minimum capital requirement calculation', placeholder: 'e.g. Base requirement £150,000 + variable 1.5% of revenue = total £436,000 minimum...', multiline: true },
      { id: 'ownFunds', label: 'Own Funds Position', helpText: 'Describe your current capital position', placeholder: 'e.g. Paid-up share capital £2.5m + retained earnings £1.4m = £3.9m own funds...', multiline: true },
      { id: 'financialProjections', label: 'Financial Projections (3-year)', helpText: 'Summarise revenue, expenses, and profitability forecast', placeholder: 'e.g. FY2024 revenue £12m, EBITDA margin 18%; FY2025 revenue £15m, EBITDA 22%...', multiline: true },
      { id: 'liquidityManagement', label: 'Liquidity Management', helpText: 'Describe your liquidity policy and stress test results', placeholder: 'e.g. Minimum £1.5m liquidity buffer; stress tests show ability to withstand 50% withdrawal scenario...', multiline: true },
      { id: 'windDownPlan', label: 'Wind-Down Plan Summary', helpText: 'Summarise your ability to wind down operations in an orderly manner', placeholder: 'e.g. 6-month wind-down timeline; estimated cost £1.85m; own funds provide 200%+ coverage...', multiline: true },
    ],
  },
  {
    id: 'systems-controls',
    name: 'Systems & Controls Documentation',
    type: 'PROCEDURE',
    version: '1.0',
    description: 'Compliance systems, technology controls, and operational resilience',
    icon: '⚙️',
    fields: [
      { id: 'complianceSystems', label: 'Compliance Management System', helpText: 'Describe your compliance systems and their capabilities', placeholder: 'e.g. Compliance management platform covering controls, document management, alert handling...', multiline: true },
      { id: 'transactionMonitoring', label: 'Transaction Monitoring System', helpText: 'Describe your TMS and how alerts are handled', placeholder: 'e.g. Real-time TMS with 47 rules, ML models; alerts reviewed within 4 hours by compliance team...', multiline: true },
      { id: 'cyberControls', label: 'Cybersecurity Controls', helpText: 'List key security controls in place', placeholder: 'e.g. ISO 27001 certified, annual pen testing, zero-trust architecture, MFA on all systems...', multiline: true },
      { id: 'custodyControls', label: 'Custody Technology Controls', helpText: 'Describe controls for safeguarding client cryptoassets', placeholder: 'e.g. 95% cold storage, 3-of-5 multi-sig, HSM key ceremonies, hardware security modules...', multiline: true },
      { id: 'operationalResilience', label: 'Operational Resilience', helpText: 'Describe your BCP, IBS, and impact tolerances', placeholder: 'e.g. Hot standby data centre with 15-min failover; RTO 4 hours for exchange; annual BCP test...', multiline: true },
    ],
  },
  {
    id: 'consumer-protection',
    name: 'Consumer Protection Policy',
    type: 'POLICY',
    version: '1.0',
    description: 'FCA Consumer Duty implementation and retail investor protection framework',
    icon: '👥',
    fields: [
      { id: 'policyStatement', label: 'Policy Statement', helpText: 'State your commitment to Consumer Duty outcomes', placeholder: 'e.g. [Company] is committed to delivering good outcomes for all retail consumers under FCA Consumer Duty...', multiline: true },
      { id: 'targetMarket', label: 'Target Market Assessment', helpText: 'Define your target market for each product', placeholder: 'e.g. Retail consumers with medium-high risk appetite and investment experience; exclude financially vulnerable...', multiline: true },
      { id: 'priceValue', label: 'Price and Value Assessment', helpText: 'Demonstrate that your fees represent fair value', placeholder: 'e.g. Trading fee 0.20% in line with market; all fees transparently disclosed on website and at point of sale...', multiline: true },
      { id: 'riskWarnings', label: 'Risk Warning Framework', helpText: 'Describe your risk warnings and financial promotions compliance', placeholder: 'e.g. Statutory risk warning on all materials; appropriateness assessment for all retail clients; 24-hour cooling-off period...', multiline: true },
      { id: 'consumerSupport', label: 'Consumer Support Standards', helpText: 'Describe how you support customers', placeholder: 'e.g. Live chat 09:00–21:00, email response within 2 business days, complaints handled per FCA DISP rules...', multiline: true },
    ],
  },
  {
    id: 'compliance-monitoring',
    name: 'Compliance Monitoring Plan',
    type: 'PROCEDURE',
    version: '1.0',
    description: 'Annual risk-based compliance monitoring programme and reporting framework',
    icon: '📅',
    fields: [
      { id: 'objectives', label: 'Monitoring Objectives', helpText: 'What does your compliance monitoring aim to achieve?', placeholder: 'e.g. Assurance that controls are operating effectively; identification of regulatory gaps; early warning of issues...', multiline: true },
      { id: 'riskBasis', label: 'Risk-Based Prioritisation', helpText: 'How do you prioritise what to monitor?', placeholder: 'e.g. Prioritise FCA-identified risk areas (AML, Consumer Duty, Travel Rule) plus internal high-risk areas...', multiline: true },
      { id: 'programme', label: 'Testing Programme (Q1–Q4)', helpText: 'List the reviews planned across the year', placeholder: 'e.g. Q1: CDD quality review, sanctions screening test; Q2: TMS effectiveness, Travel Rule gap; Q3: AML framework review...', multiline: true },
      { id: 'reporting', label: 'Reporting Framework', helpText: 'How are monitoring findings reported to senior management and the Board?', placeholder: 'e.g. Quarterly report to Risk Committee; annual compliance report to Board; RAG-rated findings with action plans...', multiline: true },
      { id: 'resources', label: 'Resources and Ownership', helpText: 'Who is responsible for conducting monitoring reviews?', placeholder: 'e.g. CCO owns the programme; 3 compliance analysts conduct fieldwork; Internal Audit conducts annual programme review...', multiline: true },
    ],
  },
]

function generateDocumentContent(template: Template, values: Record<string, string>): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const companyName = values['companyName'] || 'BlockChain Securities Ltd'

  const sections = template.fields
    .map(f => {
      const val = values[f.id]?.trim()
      if (!val) return null
      return `## ${f.label}\n\n${val}`
    })
    .filter(Boolean)
    .join('\n\n')

  return `# ${template.name.toUpperCase()}

## ${companyName}

**Version:** ${template.version} | **Date:** ${today} | **Classification:** CONFIDENTIAL
**Document Type:** ${template.type} | **Generated via:** CryptoComply Template Builder

---

${sections}

---

*This document was generated using the CryptoComply template builder. Please review and update all sections before submission to the FCA or use as official documentation. For queries, contact your Chief Compliance Officer.*`
}

export function DocumentsClient({ documents, auditLogs }: { documents: any[]; auditLogs: any[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<'documents' | 'audit'>('documents')
  const [filterType, setFilterType] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({})
  const [templateLoading, setTemplateLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', type: 'POLICY' })
  const [localDocs, setLocalDocs] = useState(documents)

  const filtered = localDocs.filter(d => !filterType || d.type === filterType)

  const grouped = filtered.reduce((acc: Record<string, any[]>, doc) => {
    if (!acc[doc.type]) acc[doc.type] = []
    acc[doc.type].push(doc)
    return acc
  }, {})

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const doc = await res.json()
    setLocalDocs(prev => [doc, ...prev])
    setShowUpload(false)
    setForm({ name: '', description: '', type: 'POLICY' })
  }

  async function handleGenerateDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTemplate) return
    setTemplateLoading(true)
    try {
      const content = generateDocumentContent(selectedTemplate, templateValues)
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          type: selectedTemplate.type,
          version: selectedTemplate.version,
          content,
        }),
      })
      const doc = await res.json()
      setShowTemplate(false)
      setSelectedTemplate(null)
      setTemplateValues({})
      router.push(`/documents/${doc.id}`)
    } finally {
      setTemplateLoading(false)
    }
  }

  function openTemplate(template: Template) {
    setSelectedTemplate(template)
    setTemplateValues({})
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents & Evidence</h1>
          <p className="text-gray-500 text-sm mt-0.5">{localDocs.length} documents · Audit trail</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowTemplate(true); setSelectedTemplate(null) }} className="btn-secondary">
            + Create from Template
          </button>
          <button onClick={() => setShowUpload(true)} className="btn-primary">Upload Document</button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {(['documents', 'audit'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'documents' ? `Documents (${localDocs.length})` : `Audit Log (${auditLogs.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'documents' && (
        <>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${!filterType ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>All</button>
            {['POLICY', 'PROCEDURE', 'EVIDENCE', 'CERTIFICATE', 'REPORT'].map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? '' : t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filterType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>

          {Object.keys(grouped).length === 0 && (
            <div className="card p-12 flex flex-col items-center text-center">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-gray-500 text-sm">No documents yet. Create one from a template or upload an existing document.</p>
            </div>
          )}

          <div className="space-y-6">
            {Object.entries(grouped).map(([type, docs]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{typeIcons[type] ?? '📄'}</span>
                  <h2 className="text-sm font-semibold text-gray-700">{type}</h2>
                  <span className="text-xs text-gray-400">{docs.length}</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {docs.map((doc: any) => (
                    <div key={doc.id} className="card p-4 hover:shadow-md transition-shadow group">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5 flex-shrink-0">{typeIcons[doc.type] ?? '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                          {doc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[doc.type] ?? typeColors.OTHER}`}>{doc.type}</span>
                            {doc.version && <span className="text-xs text-gray-400">v{doc.version}</span>}
                            <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            {doc.content ? (
                              <Link
                                href={`/documents/${doc.id}`}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                View Document
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            ) : (
                              <Link
                                href={`/documents/${doc.id}`}
                                className="text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1"
                              >
                                Open
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'audit' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 table-header">Timestamp</th>
                <th className="text-left px-5 py-3 table-header">Action</th>
                <th className="text-left px-5 py-3 table-header">Entity</th>
                <th className="text-left px-5 py-3 table-header">User</th>
                <th className="text-left px-5 py-3 table-header">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auditLogs.map((log: any) => (
                <tr key={log.id}>
                  <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium text-gray-700">{auditActionLabels[log.action] ?? log.action}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-400">{log.entityType}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{log.user?.name ?? 'System'}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {log.newValues && JSON.stringify(log.newValues).slice(0, 60)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {['POLICY', 'PROCEDURE', 'EVIDENCE', 'CERTIFICATE', 'REPORT', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Add Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Builder Modal */}
      {showTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            {!selectedTemplate ? (
              /* Template Selection */
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Create from Template</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Select a compliance document template to get started</p>
                  </div>
                  <button onClick={() => setShowTemplate(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => openTemplate(template)}
                      className="text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{template.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 leading-tight">{template.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{template.description}</div>
                          <span className={`inline-block mt-2 text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[template.type] ?? typeColors.OTHER}`}>{template.type}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Template Form */
              <div>
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedTemplate(null)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{selectedTemplate.icon}</span>
                          <h2 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h2>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Fill in the sections below — all fields are optional</p>
                      </div>
                    </div>
                    <button onClick={() => setShowTemplate(false)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleGenerateDocument}>
                  <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {selectedTemplate.fields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-semibold text-gray-700 mb-0.5">{field.label}</label>
                        <p className="text-xs text-gray-400 mb-1.5">{field.helpText}</p>
                        {field.multiline ? (
                          <textarea
                            value={templateValues[field.id] ?? ''}
                            onChange={e => setTemplateValues(v => ({ ...v, [field.id]: e.target.value }))}
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-gray-300"
                          />
                        ) : (
                          <input
                            type="text"
                            value={templateValues[field.id] ?? ''}
                            onChange={e => setTemplateValues(v => ({ ...v, [field.id]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-300"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">
                      A formatted compliance document will be generated from your inputs and saved to the document library.
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button type="button" onClick={() => setShowTemplate(false)} className="btn-secondary text-sm">Cancel</button>
                      <button type="submit" disabled={templateLoading} className="btn-primary text-sm min-w-[160px]">
                        {templateLoading ? (
                          <span className="flex items-center gap-2 justify-center">
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Generating...
                          </span>
                        ) : 'Generate Document'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
