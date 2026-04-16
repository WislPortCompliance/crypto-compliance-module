'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  SETUP_WIZARD_COMPLETED: 'Setup wizard completed',
  CONTROL_CREATED: 'Control created',
  CONTROL_DELETED: 'Control deleted',
}

// ─── Template Builder Data ────────────────────────────────────────────────────

interface TemplateSection {
  id: string
  title: string
  fcaRef: string
  fcaRefDetail: string
  description: string
  subsections: { title: string; fcaRef: string; guidance: string; placeholder: string }[]
}

const TEMPLATES: TemplateSection[] = [
  {
    id: 'business-model',
    title: 'Business Model Assessment',
    fcaRef: 'FCA Crypto Regime Ch.4',
    fcaRefDetail: 'FCA Cryptoassets Regime 2026, Chapter 4 (Business Model Requirements)',
    description: 'Assessment of the firm\'s business model against FCA regulatory requirements for cryptoasset businesses.',
    subsections: [
      {
        title: 'Revenue Model',
        fcaRef: 'FCA Crypto Regime Ch.4.2',
        guidance: 'FCA expects firms to demonstrate a sustainable, transparent revenue model that does not create consumer harm incentives.',
        placeholder: 'Describe how your firm generates revenue (trading fees, custody fees, spread, etc.) and how conflicts of interest are managed...',
      },
      {
        title: 'Regulatory Perimeter Analysis',
        fcaRef: 'FCA PERG 18 / FCA Crypto Regime Ch.4.1',
        guidance: 'Firms must demonstrate they have correctly identified all activities requiring FCA authorisation under FSMA and the Cryptoassets Regime.',
        placeholder: 'Set out which activities fall within the FCA regulatory perimeter, including any exclusions relied upon...',
      },
      {
        title: 'Cryptoasset Classification',
        fcaRef: 'FCA Crypto Regime Ch.2',
        guidance: 'FCA requires firms to clearly classify each cryptoasset they deal in (exchange token, security token, stablecoin, or e-money token).',
        placeholder: 'Classify each cryptoasset type your firm handles and explain the regulatory treatment of each...',
      },
    ],
  },
  {
    id: 'aml-ctf',
    title: 'AML/CTF Policy',
    fcaRef: 'SYSC 6.3 / MLR 2017 Regs 19-21',
    fcaRefDetail: 'FCA Handbook, SYSC 6.3 (Financial Crime), MLR 2017 Regulations 19-21',
    description: 'Group AML/CTF policy covering all regulated activities, customer types, and jurisdictions.',
    subsections: [
      {
        title: 'Customer Due Diligence (CDD) Procedures',
        fcaRef: 'MLR 2017, Regs 28-30',
        guidance: 'MLR 2017 requires CDD for all customers at onboarding and on an ongoing basis. Simplified CDD may apply for low-risk; EDD required for high-risk.',
        placeholder: 'Describe your standard, simplified, and enhanced due diligence procedures, including documentation requirements...',
      },
      {
        title: 'Travel Rule Compliance',
        fcaRef: 'MLR 2017, Reg 64A / FATF Rec. 16',
        guidance: 'UK Travel Rule (MLR Reg 64A) requires VASPs to collect and transmit originator and beneficiary data for transfers ≥ £1,000.',
        placeholder: 'Describe your Travel Rule solution, data collection procedures, and handling of unhosted wallets...',
      },
      {
        title: 'Suspicious Activity Reporting',
        fcaRef: 'POCA 2002 / MLR 2017, Reg 19',
        guidance: 'Firms must have documented procedures for staff to report suspicions to the MLRO, and for the MLRO to submit SARs to the NCA.',
        placeholder: 'Set out the escalation path for suspicious activity, MLRO decision process, and NCA SAR filing procedures...',
      },
      {
        title: 'Sanctions Screening',
        fcaRef: 'SAMLA 2018 / OFSI Guidance',
        guidance: 'All UK firms must screen customers and transactions against OFSI, UN, and relevant sanctions lists in real time.',
        placeholder: 'Describe your sanctions screening solution, frequency of screening, and handling of potential matches...',
      },
    ],
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment Framework',
    fcaRef: 'SYSC 7 / PRIN 2.1',
    fcaRefDetail: 'FCA Handbook, SYSC 7 (Risk Control), PRIN 2.1 (The Principles)',
    description: 'Firm-wide risk assessment framework covering financial crime, operational, market, and cryptoasset-specific risks.',
    subsections: [
      {
        title: 'Business-Wide Risk Assessment (BWRA)',
        fcaRef: 'MLR 2017, Reg 18',
        guidance: 'MLR 2017 requires firms to carry out and maintain a written BWRA of the ML/TF/PF risks to which they are exposed, covering products, services, customers, geographies, and delivery channels.',
        placeholder: 'Summarise the firm\'s overall ML/TF/PF risk exposure and key risk drivers, with ratings (high/medium/low)...',
      },
      {
        title: 'Cryptoasset-Specific Risks',
        fcaRef: 'FCA Crypto Regime Ch.6 / FATF VA Guidance',
        guidance: 'FCA expects explicit assessment of cryptoasset-specific risks: smart contract risk, DeFi exposure, mixer/tumbler use, and blockchain analytics limitations.',
        placeholder: 'Document specific risks associated with each cryptoasset type and service, including blockchain analytics findings...',
      },
      {
        title: 'Operational Risk Framework',
        fcaRef: 'SYSC 7.1 / FCA Operational Resilience Policy',
        guidance: 'Firms must identify, assess, and mitigate operational risks including technology failures, cyber incidents, and key person dependencies.',
        placeholder: 'Describe the operational risk taxonomy, risk appetite, and key controls for each risk category...',
      },
    ],
  },
  {
    id: 'financial-resources',
    title: 'Financial Resources Assessment',
    fcaRef: 'FSMA Sched 6 / FCA Threshold Conditions',
    fcaRefDetail: 'FCA Threshold Conditions, Schedule 6 FSMA 2000 (Adequate Resources)',
    description: 'Assessment of capital adequacy, liquidity, and financial prudence requirements.',
    subsections: [
      {
        title: 'Capital Adequacy Calculation',
        fcaRef: 'MIFIDPRU / FCA Crypto Capital Rules',
        guidance: 'FCA requires CASP applicants to demonstrate adequate financial resources, including fixed overhead requirements and a capital buffer for crypto-specific risks.',
        placeholder: 'Set out your capital calculation methodology, including fixed overheads, risk-weighted assets, and any additional buffers...',
      },
      {
        title: 'Liquidity Risk Assessment',
        fcaRef: 'SYSC 7.1.7R / FCA Crypto Regime',
        guidance: 'Firms must demonstrate adequate liquidity to meet obligations, including scenarios such as stablecoin de-peg, market stress, and client redemption spikes.',
        placeholder: 'Describe liquidity risk management approach, stress scenarios tested, and minimum liquidity buffer maintained...',
      },
      {
        title: 'Wind-Down Planning',
        fcaRef: 'FCA Wind-Down Planning Guide 2020',
        guidance: 'FCA requires firms to maintain a credible wind-down plan ensuring orderly return of client assets. Plans should be reviewed annually.',
        placeholder: 'Summarise the wind-down trigger events, timeline, resource requirements, and client asset return process...',
      },
    ],
  },
  {
    id: 'systems-controls',
    title: 'Systems & Controls',
    fcaRef: 'SYSC 4-9',
    fcaRefDetail: 'FCA Handbook, SYSC 4-9 (Systems and Controls)',
    description: 'Documentation of systems and controls framework covering governance, technology, and operational controls.',
    subsections: [
      {
        title: 'Governance Arrangements',
        fcaRef: 'SYSC 4.1 / SMCR',
        guidance: 'SYSC 4.1 requires firms to have robust governance arrangements, including a clear organisational structure, appropriate segregation of duties, and defined lines of responsibility.',
        placeholder: 'Describe the board structure, committee framework, reporting lines, and key governance documents (ToR, Delegation of Authority)...',
      },
      {
        title: 'Technology Risk Controls',
        fcaRef: 'SYSC 8 / FCA Cyber / DORA (future)',
        guidance: 'FCA expects crypto firms to have robust technology controls given the digital nature of assets. This includes cybersecurity, key management, and smart contract controls.',
        placeholder: 'Describe your information security architecture, key management procedures, and technology risk controls...',
      },
      {
        title: 'Compliance Monitoring',
        fcaRef: 'SYSC 6.1.1R',
        guidance: 'SYSC 6.1 requires firms to have a permanent and effective compliance function with documented monitoring programme and board-level reporting.',
        placeholder: 'Outline the compliance monitoring programme scope, testing schedule, escalation procedures, and reporting to the Board...',
      },
    ],
  },
  {
    id: 'consumer-protection',
    title: 'Consumer Protection Framework',
    fcaRef: 'PRIN 6 / Consumer Duty PS22/9',
    fcaRefDetail: 'FCA Handbook, PRIN 6 (Customers\' Interests), Consumer Duty (PS22/9)',
    description: 'Framework for delivering good outcomes for retail customers under FCA Consumer Duty.',
    subsections: [
      {
        title: 'Consumer Duty Implementation Plan',
        fcaRef: 'Consumer Duty FG22/5',
        guidance: 'FCA Consumer Duty requires firms to demonstrate delivery of four outcomes: products and services, price and value, consumer understanding, and consumer support.',
        placeholder: 'Set out how each of the four Consumer Duty outcomes is delivered, with evidence of customer testing and gap analysis...',
      },
      {
        title: 'Risk Warnings & Appropriateness',
        fcaRef: 'FCA PS23/6 / COBS 4',
        guidance: 'FCA PS23/6 requires specific risk warnings for cryptoassets (e.g., "Don\'t invest unless you\'re prepared to lose all the money you invest") and appropriateness testing for restricted mass-market investments.',
        placeholder: 'Describe risk warning implementations, appropriateness test design, and cooling-off period procedures...',
      },
      {
        title: 'Complaints Handling',
        fcaRef: 'DISP 1 / CONC 12',
        guidance: 'DISP requires firms to have an effective complaints handling procedure with 8-week resolution target, FOS referral rights at point of complaint, and root cause analysis.',
        placeholder: 'Describe the complaints handling process, escalation procedures, FOS information provision, and root cause analysis...',
      },
    ],
  },
  {
    id: 'compliance-monitoring',
    title: 'Compliance Monitoring Plan',
    fcaRef: 'SYSC 6.1',
    fcaRefDetail: 'FCA Handbook, SYSC 6.1 (Compliance)',
    description: 'Annual compliance monitoring programme covering all regulatory obligations.',
    subsections: [
      {
        title: 'Monitoring Programme Scope',
        fcaRef: 'SYSC 6.1.2G',
        guidance: 'FCA expects the compliance monitoring programme to cover all significant regulatory risks on a risk-based schedule. Higher-risk areas should be monitored more frequently.',
        placeholder: 'List all regulatory obligations covered by the monitoring programme, with frequency of monitoring and risk ratings...',
      },
      {
        title: 'Testing Methodology',
        fcaRef: 'SYSC 6.1.1R',
        guidance: 'Monitoring should include transaction testing, file review, system testing, and staff interviews. Findings must be documented and tracked to remediation.',
        placeholder: 'Describe the testing methodologies used (file review, transaction sampling, mystery shopping) and documentation standards...',
      },
      {
        title: 'Management Reporting',
        fcaRef: 'SYSC 4.1.1R / SYSC 6.1',
        guidance: 'Compliance monitoring findings must be reported to the Board or Board Risk Committee at least quarterly. The MLRO Annual Report is required by MLR 2017.',
        placeholder: 'Set out the reporting schedule, report recipients, escalation thresholds, and MLRO Annual Report template...',
      },
    ],
  },
  {
    id: 'regulatory-perimeter',
    title: 'Regulatory Perimeter Analysis',
    fcaRef: 'FCA PERG / PERG 18',
    fcaRefDetail: 'FCA Perimeter Guidance Manual (PERG), specifically PERG 18 (Cryptoassets)',
    description: 'Analysis of the regulatory perimeter and applicability of FSMA authorisation requirements.',
    subsections: [
      {
        title: 'Regulated Activities Analysis',
        fcaRef: 'PERG 18.3 / RAO 2001',
        guidance: 'PERG 18 provides FCA guidance on which cryptoasset activities constitute regulated activities under RAO 2001. Firms must assess each activity against the specified investments and activities.',
        placeholder: 'Map each business activity to relevant RAO 2001 articles and confirm whether FCA authorisation is required...',
      },
      {
        title: 'Financial Promotions Regime',
        fcaRef: 'FCA PS23/6 / COBS 4.15',
        guidance: 'Since October 2023, cryptoasset financial promotions must be approved by an FCA-authorised person or issued by a registered crypto firm. FCA has specific rules on fair, clear, and not misleading promotions.',
        placeholder: 'Describe the financial promotions approval process, review schedule, and compliance with FCA cryptoasset promotion rules...',
      },
      {
        title: 'Cross-Border Considerations',
        fcaRef: 'PERG 2.4 / SUP 13',
        guidance: 'Firms operating across multiple jurisdictions must analyse each jurisdiction\'s regulatory requirements. MiCA passporting applies within the EU; MAS PSA applies in Singapore.',
        placeholder: 'For each jurisdiction of operation, confirm the regulatory status and required licences or exemptions relied upon...',
      },
    ],
  },
]

export function DocumentsClient({ documents, auditLogs }: { documents: any[]; auditLogs: any[] }) {
  const [tab, setTab] = useState<'documents' | 'templates' | 'audit'>('documents')
  const [filterType, setFilterType] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', type: 'POLICY' })
  const [localDocs, setLocalDocs] = useState(documents)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [templateText, setTemplateText] = useState<Record<string, string>>({})

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents & Evidence</h1>
          <p className="text-gray-500 text-sm mt-0.5">{localDocs.length} documents · Templates · Audit trail</p>
        </div>
        {tab === 'documents' && <button onClick={() => setShowUpload(true)} className="btn-primary">+ Add Document</button>}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {(['documents', 'templates', 'audit'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'documents' ? `Documents (${localDocs.length})` : t === 'templates' ? 'Template Builder' : `Audit Log (${auditLogs.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'documents' && (
        <>
          <div className="flex gap-2">
            <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${!filterType ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>All</button>
            {['POLICY', 'PROCEDURE', 'EVIDENCE', 'CERTIFICATE', 'REPORT'].map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? '' : t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filterType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>

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
                    <Link key={doc.id} href={`/documents/${doc.id}`} className="card p-4 hover:shadow-md transition-shadow block hover:border-blue-300">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{typeIcons[doc.type] ?? '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                          {doc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[doc.type] ?? typeColors.OTHER}`}>{doc.type}</span>
                            <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>
                          </div>
                          <div className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View document
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-800">FCA-Referenced Template Builder</div>
                <p className="text-xs text-blue-700 mt-0.5">Each template section is cross-referenced to specific FCA guidance. Click any section to expand and begin drafting your compliance document.</p>
              </div>
            </div>
          </div>

          {TEMPLATES.map(tmpl => (
            <div key={tmpl.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedTemplate(expandedTemplate === tmpl.id ? null : tmpl.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="text-base font-semibold text-gray-900">{tmpl.title}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 flex-shrink-0">
                      📌 {tmpl.fcaRef}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{tmpl.description}</p>
                  <p className="text-xs text-blue-600 mt-0.5">{tmpl.fcaRefDetail}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400">{tmpl.subsections.length} sections</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedTemplate === tmpl.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              {expandedTemplate === tmpl.id && (
                <div className="border-t border-gray-100">
                  {tmpl.subsections.map((sub, idx) => {
                    const key = `${tmpl.id}-${idx}`
                    const isOpen = expandedSection === key
                    return (
                      <div key={key} className={`border-b border-gray-50 last:border-0 ${isOpen ? 'bg-blue-50/30' : ''}`}>
                        <button
                          onClick={() => setExpandedSection(isOpen ? null : key)}
                          className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50/80 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{idx + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{sub.title}</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 flex-shrink-0">
                                {sub.fcaRef}
                              </span>
                            </div>
                          </div>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <div className="text-xs font-semibold text-amber-700 mb-1">FCA Guidance — {sub.fcaRef}</div>
                              <p className="text-xs text-amber-800 leading-relaxed">{sub.guidance}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1.5">Your Content</label>
                              <textarea
                                value={templateText[key] ?? ''}
                                onChange={e => setTemplateText(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={sub.placeholder}
                                rows={5}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-700 placeholder-gray-400"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const content = `${sub.title}\n[${sub.fcaRef}]\n\n${templateText[key] ?? ''}`
                                  navigator.clipboard.writeText(content)
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Copy with FCA reference
                              </button>
                              <span className="text-gray-300">·</span>
                              <span className="text-xs text-gray-400">{(templateText[key] ?? '').length} characters</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                    <span className="text-xs text-gray-500">Template: {tmpl.title}</span>
                    <button
                      onClick={() => {
                        const content = tmpl.subsections.map((sub, idx) => {
                          const key = `${tmpl.id}-${idx}`
                          return `${sub.title}\n[${sub.fcaRef}]\n\n${templateText[key] ?? '(Draft content here)'}\n`
                        }).join('\n---\n\n')
                        const full = `${tmpl.title}\n${tmpl.fcaRefDetail}\n\n${'='.repeat(60)}\n\n${content}`
                        navigator.clipboard.writeText(full)
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Export full template
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Document</h2>
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
    </div>
  )
}
