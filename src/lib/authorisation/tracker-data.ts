// Shared authorisation-tracker definitions used by both the main seed
// (prisma/seed.ts) and the setup-wizard API route.
//
// Phase 1 scope: 8 new trackers — Gibraltar GFSC, Singapore MAS, UAE VARA,
// Switzerland FINMA, Hong Kong SFC, Australia ASIC, Canada CSA, US BSA.
// FCA and MiCA continue to be seeded inline in prisma/seed.ts for now; they
// can be migrated into this module in a follow-up refactor.
//
// Template reuse: common compliance constructs (AML policy, governance
// framework, MLRO appointment, etc.) are seeded once as SHARED_TEMPLATES
// and referenced by every tracker that needs them. One Document serves
// multiple requirements across frameworks.

import type { PrismaClient } from '@prisma/client'

export type Framework = 'FCA' | 'MICA' | 'GFSC' | 'MAS' | 'VARA' | 'FINMA' | 'SFC' | 'ASIC' | 'CSA' | 'BSA'
export type StageEnum = 'PRE_APPLICATION' | 'BUSINESS_PLAN' | 'FINANCIAL_RESOURCES' | 'SYSTEMS_CONTROLS' | 'AML_CTF' | 'CONSUMER_PROTECTION' | 'SUBMISSION' | 'POST_APPROVAL'
export type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'NA'

// ─── Shared templates ───────────────────────────────────────────────────────
// IDs are stable and referenced by both the new trackers AND (optionally) by
// FCA/MiCA requirements in follow-up work, so compliance teams edit one
// template and it flows through to every framework that depends on it.
export const SHARED_TEMPLATE = {
  AML_POLICY:             'tpl-shared-aml-policy',
  KYC_CDD:                'tpl-shared-kyc-cdd',
  MLRO_APPOINTMENT:       'tpl-shared-mlro',
  TRAVEL_RULE:            'tpl-shared-travel-rule',
  SANCTIONS:              'tpl-shared-sanctions',
  BUSINESS_PLAN:          'tpl-shared-business-plan',
  GOVERNANCE:             'tpl-shared-governance',
  FIT_PROPER:             'tpl-shared-fit-proper',
  CONFLICTS_OF_INTEREST:  'tpl-shared-conflicts',
  CAPITAL_ADEQUACY:       'tpl-shared-capital-adequacy',
  WIND_DOWN:              'tpl-shared-wind-down',
  PI_INSURANCE:           'tpl-shared-pi-insurance',
  CYBERSECURITY:          'tpl-shared-cybersecurity',
  BCP:                    'tpl-shared-bcp',
  OUTSOURCING:            'tpl-shared-outsourcing',
  CLIENT_SEGREGATION:     'tpl-shared-client-segregation',
  CUSTODY_POLICY:         'tpl-shared-custody-policy',
  COMPLAINTS:             'tpl-shared-complaints',
  MARKET_CONDUCT:         'tpl-shared-market-conduct',
  APPLICATION_DOSSIER:    'tpl-shared-application-dossier',
  COMPLIANCE_MONITORING:  'tpl-shared-compliance-monitoring',
  REGULATORY_REPORTING:   'tpl-shared-regulatory-reporting',
  CHANGE_OF_CONTROL:      'tpl-shared-change-of-control',
} as const

export const SHARED_TEMPLATE_DEFS = [
  { id: SHARED_TEMPLATE.AML_POLICY,            name: 'Template: AML/CTF Policy (Universal)',              type: 'POLICY',    body: 'Global AML/CTF policy aligned to FCA MLR 2017, AMLD6, MAS PSN02, AMLO (HK), AMLA (CH), BSA (US), PCMLTFA (CA), AUSTRAC AML/CTF, FATF 40 Recommendations and ISO/TS 23635 governance.' },
  { id: SHARED_TEMPLATE.KYC_CDD,               name: 'Template: KYC / Customer Due Diligence (Universal)', type: 'PROCEDURE', body: 'Standard, simplified and enhanced CDD procedures. FATF Rec. 10; MLR 2017 reg. 28; AMLD6 Art. 13; MAS PSN01; AMLO Schedule 2; BSA 31 CFR 1022.220.' },
  { id: SHARED_TEMPLATE.MLRO_APPOINTMENT,      name: 'Template: MLRO / BSA Officer Appointment',           type: 'POLICY',    body: 'Formal appointment mandate, responsibilities, independence, and NCA notification. MLR 2017 reg. 21; AMLD6 Art. 8; BSA 31 CFR 1022.210(d); MAS PSN02 s.6.' },
  { id: SHARED_TEMPLATE.TRAVEL_RULE,           name: 'Template: Travel Rule Implementation',               type: 'PROCEDURE', body: 'VASP-to-VASP information transmission. FATF Rec. 16; UK MLR 2017 reg. 64A (£1,000); EU TFR 2023/1113 (no de minimis); FinCEN (USD 3,000); MAS Notice PSN02.' },
  { id: SHARED_TEMPLATE.SANCTIONS,             name: 'Template: Sanctions Screening Policy',               type: 'POLICY',    body: 'Real-time screening against OFSI, OFAC, UN, EU consolidated lists. Includes dual-use, sectoral and cryptoasset-specific designations.' },
  { id: SHARED_TEMPLATE.BUSINESS_PLAN,         name: 'Template: Regulatory Business Plan',                 type: 'POLICY',    body: 'Five-year business plan covering operating model, revenue forecasts, risk appetite, capital requirements and go-to-market. Aligned to FCA COND 2.4, MAS PSA application, FINMA FinIA, VARA.' },
  { id: SHARED_TEMPLATE.GOVERNANCE,            name: 'Template: Corporate Governance Framework',           type: 'POLICY',    body: 'Board composition, committees, delegated authorities, three-lines-of-defence. FCA SYSC 4.1, SYSC 5.1; MiCA Art. 68; VARA Company Rulebook; FINMA Circular 2017/1.' },
  { id: SHARED_TEMPLATE.FIT_PROPER,            name: 'Template: Fit & Proper Assessment',                  type: 'PROCEDURE', body: 'Senior management and controlled-function fitness assessment. FCA FIT 2; SM&CR; MiCA Art. 68(1); MAS Fit and Proper Criteria; AMF guidance.' },
  { id: SHARED_TEMPLATE.CONFLICTS_OF_INTEREST, name: 'Template: Conflicts of Interest Policy',             type: 'POLICY',    body: 'Identification, management and disclosure of conflicts. FCA SYSC 10; MiCA Art. 72; VARA Market Conduct Rulebook; MAS Notice SFA04-N15.' },
  { id: SHARED_TEMPLATE.CAPITAL_ADEQUACY,      name: 'Template: Capital Adequacy Calculation',             type: 'REPORT',    body: 'Own-funds requirement calculation and ongoing monitoring. FCA MIFIDPRU 4; MiCA Art. 67; MAS PSA Base Capital; FINMA FinIA; HK FRR; ASIC NTA.' },
  { id: SHARED_TEMPLATE.WIND_DOWN,             name: 'Template: Wind-Down Plan',                           type: 'POLICY',    body: 'Orderly wind-down scenarios covering liquidation, client asset return, regulatory notification. FCA WDPG; MiCA Art. 73; FINMA insolvency protections; MAS PSA.' },
  { id: SHARED_TEMPLATE.PI_INSURANCE,          name: 'Template: Professional Indemnity / Guarantees',      type: 'EVIDENCE',  body: 'PI insurance or bank guarantee documentation. FCA MIPRU 3; MiCA Art. 67(2); VARA Company Rulebook; MAS PSA security deposit.' },
  { id: SHARED_TEMPLATE.CYBERSECURITY,         name: 'Template: Cybersecurity & ICT Policy',               type: 'POLICY',    body: 'Cyber-resilience programme aligned to ISO 27001 Annex A, NIST CSF, MAS TRM Guidelines, FINMA Circular 2023/1, DORA Reg. 2022/2554, VARA Technology Rulebook.' },
  { id: SHARED_TEMPLATE.BCP,                   name: 'Template: Business Continuity Plan',                 type: 'POLICY',    body: 'Business continuity and disaster recovery procedures. FCA SYSC 15A; DORA Art. 11; MAS TRM; FINMA Circular 2023/1; ISO 22301 alignment.' },
  { id: SHARED_TEMPLATE.OUTSOURCING,           name: 'Template: Outsourcing Framework',                    type: 'POLICY',    body: 'Vendor due-diligence, contractual minimum requirements, ongoing monitoring. FCA SYSC 8; MiCA Art. 73; FINMA Circular 2018/3; MAS Guidelines on Outsourcing.' },
  { id: SHARED_TEMPLATE.CLIENT_SEGREGATION,    name: 'Template: Client Asset Segregation',                 type: 'POLICY',    body: 'Client cryptoasset and fiat segregation, daily reconciliation, bankruptcy-remoteness. FCA CASS; MiCA Art. 70; MAS PSA trust account; Swiss DLT Act.' },
  { id: SHARED_TEMPLATE.CUSTODY_POLICY,        name: 'Template: Custody Policy (Cold Storage + Keys)',     type: 'POLICY',    body: 'Private key management, cold/hot allocation, multi-sig, insurance. FCA cryptoasset custody; MiCA Art. 70(3); VARA Custody Rulebook; HK SFC VATP Guidelines.' },
  { id: SHARED_TEMPLATE.COMPLAINTS,            name: 'Template: Complaints Handling Procedure',            type: 'PROCEDURE', body: 'Eight-week resolution, FOS/AFCA/AFS referral rights, root-cause analysis. FCA DISP 1; MiCA Art. 71; ASIC RG 271; AFCA scheme.' },
  { id: SHARED_TEMPLATE.MARKET_CONDUCT,        name: 'Template: Market Conduct & Market Abuse Framework',  type: 'POLICY',    body: 'Market abuse detection, surveillance, insider-dealing controls. UK MAR; MiCA Art. 92; VARA Market Conduct Rulebook; HK SFO Part XIII-XIV.' },
  { id: SHARED_TEMPLATE.APPLICATION_DOSSIER,   name: 'Template: Authorisation Application Dossier',        type: 'PROCEDURE', body: 'Structure and quality-control checklist for regulator application packs. Adaptable to FCA Connect, MiCA NCA portals, MAS, VARA, FINMA, SFC WINGS.' },
  { id: SHARED_TEMPLATE.COMPLIANCE_MONITORING, name: 'Template: Compliance Monitoring Programme',          type: 'POLICY',    body: 'Annual compliance monitoring plan with risk-based testing schedule. FCA SYSC 6.1; MiCA Art. 68; MAS Compliance Toolkit.' },
  { id: SHARED_TEMPLATE.REGULATORY_REPORTING,  name: 'Template: Regulatory Reporting Framework',           type: 'PROCEDURE', body: 'Timely and accurate submission of regulatory returns. FCA SUP 16; MiCA Art. 109; MAS MASNET; ASIC RG 104; FINMA reporting.' },
  { id: SHARED_TEMPLATE.CHANGE_OF_CONTROL,     name: 'Template: Change-in-Control Notification',           type: 'PROCEDURE', body: 'Notification procedures for material changes in ownership, senior management, services. FCA SUP 11; MiCA Art. 83; VARA; MAS.' },
] as const

// ─── Tracker definitions ────────────────────────────────────────────────────

export interface ReqDef {
  title: string
  fcaReference: string      // regulatory citation — shown on the requirement row
  sharedTemplateId?: string // reuse a shared template; otherwise a per-req template is created
  demoStatus?: Status       // demo-org status when seeded with includeDemo=true
  demoDocumentId?: string   // evidence doc for demo-complete requirements
}

export interface StageDef {
  stage: StageEnum
  order: number
  title: string
  description: string
  demoStatus?: Status
  demoCompletedAt?: string  // ISO date
  demoTargetDate?: string
  requirements: ReqDef[]
}

export interface TrackerDef {
  framework: Framework
  displayName: string
  subtitle: string
  regulatorShortName: string
  regulationName: string    // matches Regulation.name used in the DB
  stages: StageDef[]
}

// ─── GFSC — Gibraltar DLT Provider ─────────────────────────────────────────
const GFSC_TRACKER: TrackerDef = {
  framework: 'GFSC', displayName: 'Gibraltar DLT Authorisation', subtitle: 'GFSC Distributed Ledger Technology Provider Licence',
  regulatorShortName: 'GFSC', regulationName: 'Gibraltar DLT Framework',
  stages: [
    { stage: 'PRE_APPLICATION', order: 1, title: 'Pre-Application & Regulatory Engagement',
      description: 'Scope activities against the 9 GFSC Regulatory Principles; engage with GFSC DLT team.',
      demoStatus: 'COMPLETE', demoCompletedAt: '2026-02-28',
      requirements: [
        { title: 'Regulatory perimeter analysis (DLT Regs 2020)', fcaReference: 'Gibraltar FS (DLT Providers) Regs 2020', demoStatus: 'COMPLETE' },
        { title: 'Pre-application meeting with GFSC', fcaReference: 'GFSC DLT Guidance Notes', demoStatus: 'COMPLETE' },
        { title: 'Project plan & timeline', fcaReference: 'GFSC Application Process', demoStatus: 'COMPLETE' },
      ],
    },
    { stage: 'BUSINESS_PLAN', order: 2, title: 'Business Plan & Corporate Governance',
      description: 'Business plan, board composition, and governance aligned to the 9 GFSC Regulatory Principles.',
      demoStatus: 'IN_PROGRESS', demoTargetDate: '2026-06-30',
      requirements: [
        { title: 'Five-year business plan', fcaReference: 'GFSC Principle 1 (Honesty & Integrity)', sharedTemplateId: SHARED_TEMPLATE.BUSINESS_PLAN, demoStatus: 'COMPLETE' },
        { title: 'Board composition & fit-and-proper', fcaReference: 'GFSC Principle 8 (Corporate Governance)', sharedTemplateId: SHARED_TEMPLATE.FIT_PROPER, demoStatus: 'COMPLETE' },
        { title: 'Senior management function mapping', fcaReference: 'GFSC Principle 8', sharedTemplateId: SHARED_TEMPLATE.GOVERNANCE, demoStatus: 'IN_PROGRESS' },
        { title: 'Conflicts of interest policy', fcaReference: 'GFSC Principle 1', sharedTemplateId: SHARED_TEMPLATE.CONFLICTS_OF_INTEREST, demoStatus: 'NOT_STARTED' },
      ],
    },
    { stage: 'FINANCIAL_RESOURCES', order: 3, title: 'Prudential Resources',
      description: 'Minimum initial capital, ongoing prudential requirements and PI cover.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-07-31',
      requirements: [
        { title: 'Minimum initial capital (£100,000)', fcaReference: 'GFSC Principle 3 (Prudential Standards)', sharedTemplateId: SHARED_TEMPLATE.CAPITAL_ADEQUACY },
        { title: 'Ongoing prudential buffer', fcaReference: 'GFSC Principle 3' },
        { title: 'Professional indemnity insurance', fcaReference: 'GFSC Principle 3', sharedTemplateId: SHARED_TEMPLATE.PI_INSURANCE },
      ],
    },
    { stage: 'SYSTEMS_CONTROLS', order: 4, title: 'Systems & Technology Resilience',
      description: 'IT architecture, cybersecurity, and operational resilience per GFSC Principle 9.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-08-31',
      requirements: [
        { title: 'IT systems architecture', fcaReference: 'GFSC Principle 9 (Systems & Security)', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'Cybersecurity framework', fcaReference: 'GFSC Principle 9', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'Business continuity plan', fcaReference: 'GFSC Principle 9', sharedTemplateId: SHARED_TEMPLATE.BCP },
      ],
    },
    { stage: 'AML_CTF', order: 5, title: 'Financial Crime Framework',
      description: 'POCA 2015-aligned AML/CFT programme, sanctions screening, and MLRO appointment.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-09-30',
      requirements: [
        { title: 'POCA 2015 AML/CTF programme', fcaReference: 'GFSC Principle 2 (Financial Crime)', sharedTemplateId: SHARED_TEMPLATE.AML_POLICY },
        { title: 'Sanctions screening framework', fcaReference: 'GFSC Principle 2', sharedTemplateId: SHARED_TEMPLATE.SANCTIONS },
        { title: 'MLRO appointment (POCA-approved)', fcaReference: 'GFSC Principle 2', sharedTemplateId: SHARED_TEMPLATE.MLRO_APPOINTMENT },
      ],
    },
    { stage: 'CONSUMER_PROTECTION', order: 6, title: 'Client Protection & Asset Safeguarding',
      description: 'Client asset rules, complaint handling and market conduct principles.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-10-31',
      requirements: [
        { title: 'Client asset protection rules', fcaReference: 'GFSC Principle 4 (Protection of Client Assets)', sharedTemplateId: SHARED_TEMPLATE.CLIENT_SEGREGATION },
        { title: 'Complaints handling procedure', fcaReference: 'GFSC Principle 7 (Market Conduct)', sharedTemplateId: SHARED_TEMPLATE.COMPLAINTS },
        { title: 'Market conduct framework', fcaReference: 'GFSC Principle 7', sharedTemplateId: SHARED_TEMPLATE.MARKET_CONDUCT },
      ],
    },
    { stage: 'SUBMISSION', order: 7, title: 'DLT Licence Application',
      description: 'Application dossier, GFSC application fee, and regulator decision.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-11-30',
      requirements: [
        { title: 'Application dossier to GFSC', fcaReference: 'GFSC DLT Application Form', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
        { title: 'Application fee (tiered by activity)', fcaReference: 'GFSC Fee Schedule' },
        { title: 'GFSC decision & licence conditions', fcaReference: 'GFSC Authorisation Decision' },
      ],
    },
    { stage: 'POST_APPROVAL', order: 8, title: 'Ongoing Supervision',
      description: 'Regulatory reporting, change-in-control, and annual attestation.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Ongoing regulatory returns', fcaReference: 'GFSC Periodic Reporting', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
        { title: 'Change-in-control notifications', fcaReference: 'GFSC Principle 8', sharedTemplateId: SHARED_TEMPLATE.CHANGE_OF_CONTROL },
        { title: 'Annual compliance attestation', fcaReference: 'GFSC Annual Attestation', sharedTemplateId: SHARED_TEMPLATE.COMPLIANCE_MONITORING },
      ],
    },
  ],
}

// ─── MAS — Singapore Payment Services Act (DPT) ─────────────────────────────
const MAS_TRACKER: TrackerDef = {
  framework: 'MAS', displayName: 'MAS Payment Services Act Tracker', subtitle: 'Singapore Digital Payment Token Licence',
  regulatorShortName: 'MAS', regulationName: 'MAS PSA',
  stages: [
    { stage: 'PRE_APPLICATION', order: 1, title: 'Pre-Application & Licence Scoping',
      description: 'Select the right licence tier (SPI vs MPI) and engage with MAS.',
      demoStatus: 'COMPLETE', demoCompletedAt: '2026-02-15',
      requirements: [
        { title: 'Licence classification (SPI vs MPI)', fcaReference: 'PSA s.5; MAS PSN03', demoStatus: 'COMPLETE' },
        { title: 'MAS pre-application engagement', fcaReference: 'MAS Payment Services Guide', demoStatus: 'COMPLETE' },
        { title: 'Gap analysis against MAS PSN01–08', fcaReference: 'MAS Notices PSN01–08', demoStatus: 'COMPLETE' },
      ],
    },
    { stage: 'BUSINESS_PLAN', order: 2, title: 'Business Plan & Governance',
      description: 'Three-year business plan, fit-and-proper assessments, independent directors.',
      demoStatus: 'IN_PROGRESS', demoTargetDate: '2026-06-30',
      requirements: [
        { title: 'Three-year business plan', fcaReference: 'MAS PSA application', sharedTemplateId: SHARED_TEMPLATE.BUSINESS_PLAN, demoStatus: 'COMPLETE' },
        { title: 'Fit & proper assessments', fcaReference: 'MAS Guidelines on F&P', sharedTemplateId: SHARED_TEMPLATE.FIT_PROPER, demoStatus: 'IN_PROGRESS' },
        { title: 'Independent director appointments', fcaReference: 'MAS Corporate Governance', sharedTemplateId: SHARED_TEMPLATE.GOVERNANCE, demoStatus: 'NOT_STARTED' },
      ],
    },
    { stage: 'FINANCIAL_RESOURCES', order: 3, title: 'Capital Requirements',
      description: 'Base capital (S$100k SPI / S$250k MPI) and security deposit to MAS.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-07-31',
      requirements: [
        { title: 'Base capital requirement', fcaReference: 'PSA s.6; MAS PSN03', sharedTemplateId: SHARED_TEMPLATE.CAPITAL_ADEQUACY },
        { title: 'Security deposit to MAS', fcaReference: 'PSA s.6(3)', sharedTemplateId: SHARED_TEMPLATE.PI_INSURANCE },
      ],
    },
    { stage: 'SYSTEMS_CONTROLS', order: 4, title: 'Technology Risk Management',
      description: 'MAS TRM Guidelines, cyber hygiene and system recovery objectives.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-08-31',
      requirements: [
        { title: 'MAS TRM Guidelines compliance', fcaReference: 'MAS TRM Guidelines 2021', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'Cyber hygiene notice compliance', fcaReference: 'MAS Notice 655', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'System recovery objectives (RTO/RPO)', fcaReference: 'MAS TRM Annex B', sharedTemplateId: SHARED_TEMPLATE.BCP },
      ],
    },
    { stage: 'AML_CTF', order: 5, title: 'AML/CFT Framework',
      description: 'MAS PSN02 compliance, enhanced due diligence, and Travel Rule.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-09-30',
      requirements: [
        { title: 'MAS PSN02 AML/CFT policies', fcaReference: 'MAS Notice PSN02', sharedTemplateId: SHARED_TEMPLATE.AML_POLICY },
        { title: 'EDD for high-risk jurisdictions', fcaReference: 'MAS PSN02 para 6', sharedTemplateId: SHARED_TEMPLATE.KYC_CDD },
        { title: 'Travel Rule implementation', fcaReference: 'MAS PSN02 para 9', sharedTemplateId: SHARED_TEMPLATE.TRAVEL_RULE },
      ],
    },
    { stage: 'CONSUMER_PROTECTION', order: 6, title: 'Client Safeguarding',
      description: 'Trust-account segregation, DPT marketing restrictions, and complaints.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-10-31',
      requirements: [
        { title: 'Client money segregation (trust account)', fcaReference: 'PSA s.23', sharedTemplateId: SHARED_TEMPLATE.CLIENT_SEGREGATION },
        { title: 'DPT marketing restrictions', fcaReference: 'MAS Guidelines on DPT 2022', sharedTemplateId: SHARED_TEMPLATE.MARKET_CONDUCT },
        { title: 'Complaints handling', fcaReference: 'MAS Notice PS-N01', sharedTemplateId: SHARED_TEMPLATE.COMPLAINTS },
      ],
    },
    { stage: 'SUBMISSION', order: 7, title: 'MAS Licence Application',
      description: 'MAS Connect submission, supporting documentation and MAS review.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-11-30',
      requirements: [
        { title: 'MAS Connect application', fcaReference: 'MAS Connect Portal', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
        { title: 'Supporting documentation pack', fcaReference: 'MAS PSA application form', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
        { title: 'MAS review & decision', fcaReference: 'MAS PSA s.6(4)' },
      ],
    },
    { stage: 'POST_APPROVAL', order: 8, title: 'Ongoing Obligations',
      description: 'MAS returns, breach reporting and ongoing prudential monitoring.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Ongoing MAS reporting', fcaReference: 'MAS MASNET returns', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
        { title: 'Breach reporting', fcaReference: 'MAS Notice PSN07', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
      ],
    },
  ],
}

// ─── VARA — UAE Dubai Virtual Assets Regulatory Authority ─────────────────
const VARA_TRACKER: TrackerDef = {
  framework: 'VARA', displayName: 'VARA Authorisation (Dubai)', subtitle: 'UAE Virtual Assets Regulatory Authority Licensing',
  regulatorShortName: 'VARA', regulationName: 'VARA Framework',
  stages: [
    { stage: 'PRE_APPLICATION', order: 1, title: 'Pre-Application & Category Scoping',
      description: 'Classify activities under VARA Categories 1–7 and engage pre-application.',
      demoStatus: 'NOT_STARTED', demoTargetDate: '2026-08-31',
      requirements: [
        { title: 'VA activity classification (Categories 1–7)', fcaReference: 'VARA Regulations 2023' },
        { title: 'VARA pre-application engagement', fcaReference: 'VARA Application Guide' },
        { title: 'Fit-and-proper declarations', fcaReference: 'VARA Company Rulebook', sharedTemplateId: SHARED_TEMPLATE.FIT_PROPER },
      ],
    },
    { stage: 'BUSINESS_PLAN', order: 2, title: 'Business Plan & Corporate Governance',
      description: 'Business plan, governance and beneficial-ownership disclosure.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Business plan & financial model', fcaReference: 'VARA Company Rulebook', sharedTemplateId: SHARED_TEMPLATE.BUSINESS_PLAN },
        { title: 'Governance & senior appointments', fcaReference: 'VARA Company Rulebook', sharedTemplateId: SHARED_TEMPLATE.GOVERNANCE },
        { title: 'Beneficial ownership disclosure', fcaReference: 'VARA Rulebook Company Part E' },
      ],
    },
    { stage: 'FINANCIAL_RESOURCES', order: 3, title: 'Prudential Requirements',
      description: 'Paid-up capital per category, plus guarantees/insurance.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Paid-up capital per VARA category', fcaReference: 'VARA Company Rulebook Part B', sharedTemplateId: SHARED_TEMPLATE.CAPITAL_ADEQUACY },
        { title: 'Guarantees & insurance cover', fcaReference: 'VARA Compliance Rulebook', sharedTemplateId: SHARED_TEMPLATE.PI_INSURANCE },
      ],
    },
    { stage: 'SYSTEMS_CONTROLS', order: 4, title: 'Technology & Information Rulebook',
      description: 'VARA Technology & Information Rulebook alignment, cyber and data protection.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Technology framework (Rulebook)', fcaReference: 'VARA Technology Rulebook', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'Cybersecurity programme', fcaReference: 'VARA Technology Rulebook Part C', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'Data protection (UAE PDPL)', fcaReference: 'UAE Federal Decree-Law 45/2021' },
      ],
    },
    { stage: 'AML_CTF', order: 5, title: 'Financial Crime Compliance Rulebook',
      description: 'VARA FCC Rulebook, CDD, sanctions and Travel Rule.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'VARA FCC Rulebook compliance', fcaReference: 'VARA FCC Rulebook', sharedTemplateId: SHARED_TEMPLATE.AML_POLICY },
        { title: 'Customer due diligence', fcaReference: 'VARA FCC Rulebook Part B', sharedTemplateId: SHARED_TEMPLATE.KYC_CDD },
        { title: 'Sanctions & Travel Rule', fcaReference: 'VARA FCC Rulebook Part D', sharedTemplateId: SHARED_TEMPLATE.TRAVEL_RULE },
      ],
    },
    { stage: 'CONSUMER_PROTECTION', order: 6, title: 'Market Conduct & Client Protection',
      description: 'VARA Market Conduct Rulebook and client asset segregation.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'VARA Market Conduct Rulebook', fcaReference: 'VARA Market Conduct Rulebook', sharedTemplateId: SHARED_TEMPLATE.MARKET_CONDUCT },
        { title: 'Client asset segregation', fcaReference: 'VARA Custody Services Rulebook', sharedTemplateId: SHARED_TEMPLATE.CLIENT_SEGREGATION },
      ],
    },
    { stage: 'SUBMISSION', order: 7, title: 'VARA Licence Application',
      description: 'Application submission, fees and decision.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Application submission to VARA', fcaReference: 'VARA Application Form', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
        { title: 'Application fees & decision', fcaReference: 'VARA Fee Schedule' },
      ],
    },
    { stage: 'POST_APPROVAL', order: 8, title: 'Supervision & Reporting',
      description: 'Ongoing returns to VARA and change-in-control notifications.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Ongoing VARA reporting', fcaReference: 'VARA Compliance Rulebook', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
        { title: 'Change-in-control notifications', fcaReference: 'VARA Compliance Rulebook', sharedTemplateId: SHARED_TEMPLATE.CHANGE_OF_CONTROL },
      ],
    },
  ],
}

// ─── FINMA — Switzerland ───────────────────────────────────────────────────
const FINMA_TRACKER: TrackerDef = {
  framework: 'FINMA', displayName: 'FINMA Authorisation (Switzerland)', subtitle: 'Swiss Financial Market Supervisory Authority',
  regulatorShortName: 'FINMA', regulationName: 'FINMA Framework',
  stages: [
    { stage: 'PRE_APPLICATION', order: 1, title: 'Regulatory Perimeter (FINMA)',
      description: 'Classify under FinIA, BankA, or CISA; engage FINMA pre-application; register with SRO.',
      demoStatus: 'IN_PROGRESS', demoTargetDate: '2026-06-30',
      requirements: [
        { title: 'Activity classification (FinIA vs BankA)', fcaReference: 'FinIA Art. 17; BankA Art. 1', demoStatus: 'COMPLETE' },
        { title: 'FINMA pre-application dialogue', fcaReference: 'FINMA Circular 2018/3', demoStatus: 'IN_PROGRESS' },
        { title: 'SRO registration (interim)', fcaReference: 'AMLA Art. 14', demoStatus: 'NOT_STARTED' },
      ],
    },
    { stage: 'BUSINESS_PLAN', order: 2, title: 'Business Plan & Governance',
      description: 'Business plan, Swiss-resident senior management, board independence.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Business plan (3-year)', fcaReference: 'FinIA Art. 10', sharedTemplateId: SHARED_TEMPLATE.BUSINESS_PLAN },
        { title: 'Swiss-resident senior management', fcaReference: 'FinIA Art. 11', sharedTemplateId: SHARED_TEMPLATE.FIT_PROPER },
        { title: 'Board structure & independence', fcaReference: 'FINMA Circular 2017/1', sharedTemplateId: SHARED_TEMPLATE.GOVERNANCE },
      ],
    },
    { stage: 'FINANCIAL_RESOURCES', order: 3, title: 'Capital Adequacy (FinIA)',
      description: 'Minimum capital requirements and qualifying capital buffer.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Minimum capital requirements', fcaReference: 'FinIA Art. 22', sharedTemplateId: SHARED_TEMPLATE.CAPITAL_ADEQUACY },
        { title: 'Qualifying capital buffer', fcaReference: 'FinIV Art. 23' },
      ],
    },
    { stage: 'SYSTEMS_CONTROLS', order: 4, title: 'ICT & Operational Resilience',
      description: 'FINMA Circular 2023/1 operational risk, outsourcing, and data protection.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'FINMA Circular 2023/1 compliance', fcaReference: 'FINMA Circ. 2023/1 Operational Risks', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'Outsourcing (FINMA Circular 2018/3)', fcaReference: 'FINMA Circ. 2018/3', sharedTemplateId: SHARED_TEMPLATE.OUTSOURCING },
        { title: 'Data protection (nFADP alignment)', fcaReference: 'Swiss nFADP 2023' },
      ],
    },
    { stage: 'AML_CTF', order: 5, title: 'AMLA Compliance',
      description: 'Swiss AMLA, MROS reporting, and KYC/beneficial ownership.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'AMLA & AMLO-FINMA policies', fcaReference: 'AMLA Art. 3-9; AMLO-FINMA', sharedTemplateId: SHARED_TEMPLATE.AML_POLICY },
        { title: 'MROS reporting procedures', fcaReference: 'AMLA Art. 9', sharedTemplateId: SHARED_TEMPLATE.MLRO_APPOINTMENT },
        { title: 'KYC & beneficial ownership', fcaReference: 'AMLA Art. 4; Form A/K', sharedTemplateId: SHARED_TEMPLATE.KYC_CDD },
      ],
    },
    { stage: 'CONSUMER_PROTECTION', order: 6, title: 'Client Asset Protection',
      description: 'Client asset segregation and bankruptcy remoteness under the Swiss DLT Act.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Client asset segregation (FinIA)', fcaReference: 'FinIA Art. 16', sharedTemplateId: SHARED_TEMPLATE.CLIENT_SEGREGATION },
        { title: 'Bankruptcy remoteness (DLT Act)', fcaReference: 'Swiss DLT Act 2021', sharedTemplateId: SHARED_TEMPLATE.CUSTODY_POLICY },
      ],
    },
    { stage: 'SUBMISSION', order: 7, title: 'FINMA Authorisation',
      description: 'FINMA application dossier and pre-authorisation licence confirmation.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'FINMA application dossier', fcaReference: 'FinIA Art. 10', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
        { title: 'Pre-authorisation licence confirmation', fcaReference: 'FINMA licensing decision' },
      ],
    },
    { stage: 'POST_APPROVAL', order: 8, title: 'Ongoing Supervision',
      description: 'FINMA reporting and annual audit by licensed auditor.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Ongoing FINMA reporting', fcaReference: 'FINMA FINFRA reporting', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
        { title: 'Annual audit (licensed auditor)', fcaReference: 'FINMA Circular 2013/3', sharedTemplateId: SHARED_TEMPLATE.COMPLIANCE_MONITORING },
      ],
    },
  ],
}

// ─── SFC — Hong Kong Virtual Asset Trading Platform ────────────────────────
const SFC_TRACKER: TrackerDef = {
  framework: 'SFC', displayName: 'SFC VATP Licensing (Hong Kong)', subtitle: 'Securities and Futures Commission — Virtual Asset Trading Platform',
  regulatorShortName: 'SFC', regulationName: 'SFC VATP Guidelines',
  stages: [
    { stage: 'PRE_APPLICATION', order: 1, title: 'VATP Licence Scoping',
      description: 'Determine Type 1 (Dealing in Securities) and Type 7 (Automated Trading Services) licence need.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Licence type determination (T1 + T7)', fcaReference: 'SFO Schedule 5 Part 2' },
        { title: 'SFC pre-application engagement', fcaReference: 'SFC VATP Guidelines (June 2023)' },
      ],
    },
    { stage: 'BUSINESS_PLAN', order: 2, title: 'Business Plan & Governance',
      description: 'Three-year business plan and responsible-officer appointments.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Three-year business plan', fcaReference: 'SFC Code of Conduct', sharedTemplateId: SHARED_TEMPLATE.BUSINESS_PLAN },
        { title: 'Responsible Officer appointments', fcaReference: 'SFO s.125', sharedTemplateId: SHARED_TEMPLATE.FIT_PROPER },
        { title: 'Substantial shareholders fit-and-proper', fcaReference: 'SFO s.129', sharedTemplateId: SHARED_TEMPLATE.FIT_PROPER },
      ],
    },
    { stage: 'FINANCIAL_RESOURCES', order: 3, title: 'Financial Resources Rules',
      description: 'Paid-up share capital (HK$5M) and liquid capital (HK$3M) requirements.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Paid-up share capital (HK$5M)', fcaReference: 'Financial Resources Rules Sch 1', sharedTemplateId: SHARED_TEMPLATE.CAPITAL_ADEQUACY },
        { title: 'Liquid capital (HK$3M)', fcaReference: 'FRR s.6' },
      ],
    },
    { stage: 'SYSTEMS_CONTROLS', order: 4, title: 'Technology & Operations',
      description: 'SFC VATP Guidelines tech requirements and cybersecurity.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'SFC VATP Guidelines — tech', fcaReference: 'VATP Guidelines Chapter 3', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'Cybersecurity framework', fcaReference: 'SFC Cyber Resilience 2024', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
      ],
    },
    { stage: 'AML_CTF', order: 5, title: 'AML/CFT Framework (AMLO)',
      description: 'AMLO compliance, Travel Rule (FATF equivalent), sanctions screening.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'AMLO compliance policies', fcaReference: 'Cap. 615 AMLO', sharedTemplateId: SHARED_TEMPLATE.AML_POLICY },
        { title: 'Travel Rule implementation', fcaReference: 'SFC AML Guidelines Ch.12', sharedTemplateId: SHARED_TEMPLATE.TRAVEL_RULE },
        { title: 'Sanctions screening', fcaReference: 'HKMA Sanctions Guidance', sharedTemplateId: SHARED_TEMPLATE.SANCTIONS },
      ],
    },
    { stage: 'CONSUMER_PROTECTION', order: 6, title: 'Client Money & Asset Segregation',
      description: 'Client money rules and asset protection with insurance.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Client money segregation', fcaReference: 'Client Money Rules s.4', sharedTemplateId: SHARED_TEMPLATE.CLIENT_SEGREGATION },
        { title: 'Asset protection & insurance', fcaReference: 'VATP Guidelines Ch.8', sharedTemplateId: SHARED_TEMPLATE.CUSTODY_POLICY },
      ],
    },
    { stage: 'SUBMISSION', order: 7, title: 'SFC WINGS Application',
      description: 'Application via SFC WINGS portal.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Licensing application via WINGS', fcaReference: 'SFC WINGS portal', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
        { title: 'Application fees', fcaReference: 'Securities and Futures (Fees) Rules' },
      ],
    },
    { stage: 'POST_APPROVAL', order: 8, title: 'Ongoing Licensing Obligations',
      description: 'SFC returns and breach reporting.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Ongoing SFC returns', fcaReference: 'SFO s.151 + FRR', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
        { title: 'Breach reporting', fcaReference: 'SFC PSI Guidelines', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
      ],
    },
  ],
}

// ─── ASIC — Australia ───────────────────────────────────────────────────────
const ASIC_TRACKER: TrackerDef = {
  framework: 'ASIC', displayName: 'ASIC AFS Licensing (Australia)', subtitle: 'Australian Securities and Investments Commission — Digital Asset Platforms',
  regulatorShortName: 'ASIC', regulationName: 'ASIC Framework',
  stages: [
    { stage: 'PRE_APPLICATION', order: 1, title: 'Licence Scoping',
      description: 'Determine whether AFSL (and/or ACL) is required and engage ASIC.',
      demoStatus: 'COMPLETE', demoCompletedAt: '2026-03-15',
      requirements: [
        { title: 'AFSL applicability (RG 225, INFO 225)', fcaReference: 'ASIC RG 225; INFO 225', demoStatus: 'COMPLETE' },
        { title: 'ASIC pre-engagement meeting', fcaReference: 'ASIC Licensing Hub', demoStatus: 'COMPLETE' },
      ],
    },
    { stage: 'BUSINESS_PLAN', order: 2, title: 'Business Plan & Governance',
      description: 'Business plan, Responsible Manager appointments, compliance framework.',
      demoStatus: 'IN_PROGRESS', demoTargetDate: '2026-07-31',
      requirements: [
        { title: 'Business plan', fcaReference: 'AFSL Application Kit', sharedTemplateId: SHARED_TEMPLATE.BUSINESS_PLAN, demoStatus: 'IN_PROGRESS' },
        { title: 'Responsible Manager fit & proper', fcaReference: 'ASIC RG 105', sharedTemplateId: SHARED_TEMPLATE.FIT_PROPER, demoStatus: 'NOT_STARTED' },
        { title: 'Compliance framework (RG 104)', fcaReference: 'ASIC RG 104', sharedTemplateId: SHARED_TEMPLATE.COMPLIANCE_MONITORING, demoStatus: 'NOT_STARTED' },
      ],
    },
    { stage: 'FINANCIAL_RESOURCES', order: 3, title: 'Financial Requirements',
      description: 'Net Tangible Assets and solvency requirements.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Net Tangible Assets requirements', fcaReference: 'ASIC RG 166', sharedTemplateId: SHARED_TEMPLATE.CAPITAL_ADEQUACY },
        { title: 'Solvency requirements', fcaReference: 'Corps Act s.912A(1)(d)' },
      ],
    },
    { stage: 'SYSTEMS_CONTROLS', order: 4, title: 'Risk Management & Compliance',
      description: 'Risk framework, compliance arrangements and tech resilience.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Risk management framework (RG 78)', fcaReference: 'ASIC RG 78', sharedTemplateId: SHARED_TEMPLATE.COMPLIANCE_MONITORING },
        { title: 'Compliance arrangements (RG 104)', fcaReference: 'ASIC RG 104', sharedTemplateId: SHARED_TEMPLATE.COMPLIANCE_MONITORING },
        { title: 'Technology & cyber resilience', fcaReference: 'ASIC RG 255', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
      ],
    },
    { stage: 'AML_CTF', order: 5, title: 'AUSTRAC AML/CTF Programme',
      description: 'AUSTRAC enrolment and transaction reporting.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'AUSTRAC enrolment & programme', fcaReference: 'AML/CTF Act 2006 Part 7', sharedTemplateId: SHARED_TEMPLATE.AML_POLICY },
        { title: 'Transaction reporting (SMR, TTR)', fcaReference: 'AML/CTF Act Part 4', sharedTemplateId: SHARED_TEMPLATE.MLRO_APPOINTMENT },
      ],
    },
    { stage: 'CONSUMER_PROTECTION', order: 6, title: 'Client Money Obligations',
      description: 'Client money segregation and complaints (IDR/EDR via AFCA).',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Client money segregation (s.981B)', fcaReference: 'Corps Act s.981B', sharedTemplateId: SHARED_TEMPLATE.CLIENT_SEGREGATION },
        { title: 'Complaints (IDR/EDR via AFCA)', fcaReference: 'ASIC RG 271', sharedTemplateId: SHARED_TEMPLATE.COMPLAINTS },
      ],
    },
    { stage: 'SUBMISSION', order: 7, title: 'AFSL Application',
      description: 'AFSL application to ASIC with supporting proofs.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'AFSL application to ASIC', fcaReference: 'AFS Licensing Kit', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
        { title: 'Supporting proofs', fcaReference: 'AFS Proofs Annex' },
      ],
    },
    { stage: 'POST_APPROVAL', order: 8, title: 'Ongoing Licensee Obligations',
      description: 'Annual compliance certificate and breach reporting.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Annual compliance certificate', fcaReference: 'Corps Act s.912C', sharedTemplateId: SHARED_TEMPLATE.COMPLIANCE_MONITORING },
        { title: 'Breach reporting (RG 78)', fcaReference: 'ASIC RG 78', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
      ],
    },
  ],
}

// ─── CSA — Canada ───────────────────────────────────────────────────────────
const CSA_TRACKER: TrackerDef = {
  framework: 'CSA', displayName: 'CSA + FINTRAC Registration (Canada)', subtitle: 'Canadian Securities Administrators Pre-Registration Undertaking + FINTRAC MSB',
  regulatorShortName: 'CSA', regulationName: 'CSA Framework',
  stages: [
    { stage: 'PRE_APPLICATION', order: 1, title: 'Perimeter & PRU Scoping',
      description: 'Determine securities status of crypto-assets and prepare Pre-Registration Undertaking.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Securities classification (SN 21-332)', fcaReference: 'CSA Staff Notice 21-332' },
        { title: 'PRU preparation', fcaReference: 'CSA SN 21-332 Appendix B' },
      ],
    },
    { stage: 'BUSINESS_PLAN', order: 2, title: 'Business Plan',
      description: 'Business plan and key-personnel fit-and-proper.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Business plan (3-year)', fcaReference: 'NI 31-103 Part 12', sharedTemplateId: SHARED_TEMPLATE.BUSINESS_PLAN },
        { title: 'Key personnel fit & proper', fcaReference: 'NI 31-103 s.3.3', sharedTemplateId: SHARED_TEMPLATE.FIT_PROPER },
      ],
    },
    { stage: 'FINANCIAL_RESOURCES', order: 3, title: 'Financial Requirements',
      description: 'Capital requirements under NI 31-103.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Capital requirements (NI 31-103)', fcaReference: 'NI 31-103 s.12.1', sharedTemplateId: SHARED_TEMPLATE.CAPITAL_ADEQUACY },
      ],
    },
    { stage: 'SYSTEMS_CONTROLS', order: 4, title: 'Technology & Market Integrity',
      description: 'Technology resilience and trade surveillance.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Technology & operational resilience', fcaReference: 'NI 31-103 Part 11', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'Trade surveillance & market integrity', fcaReference: 'UMIR; CSA SN 21-329', sharedTemplateId: SHARED_TEMPLATE.MARKET_CONDUCT },
      ],
    },
    { stage: 'AML_CTF', order: 5, title: 'FINTRAC MSB Registration',
      description: 'FINTRAC MSB registration and AML programme.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'FINTRAC MSB registration', fcaReference: 'PCMLTFA Reg. s.5(g)' },
        { title: 'AML programme (PCMLTFA)', fcaReference: 'PCMLTFA s.9.6', sharedTemplateId: SHARED_TEMPLATE.AML_POLICY },
      ],
    },
    { stage: 'CONSUMER_PROTECTION', order: 6, title: 'Client Handling & Custody',
      description: 'Custody (cold storage) and suitability/disclosure.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Client asset custody (cold storage ≥66%)', fcaReference: 'CSA SN 21-329', sharedTemplateId: SHARED_TEMPLATE.CUSTODY_POLICY },
        { title: 'Suitability & disclosure', fcaReference: 'NI 31-103 s.13', sharedTemplateId: SHARED_TEMPLATE.MARKET_CONDUCT },
      ],
    },
    { stage: 'SUBMISSION', order: 7, title: 'CSA Application',
      description: 'Pre-Registration Undertaking submission to CSA.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'PRU submission to CSA', fcaReference: 'CSA SN 21-332', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
        { title: 'CSA decision & conditions', fcaReference: 'CSA SN 21-332 Appendix B' },
      ],
    },
    { stage: 'POST_APPROVAL', order: 8, title: 'Ongoing Registration',
      description: 'Annual reporting and material change notifications.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Annual reporting (NRD)', fcaReference: 'NRD annual filing', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
        { title: 'Material change notifications', fcaReference: 'NI 31-103 s.11.9', sharedTemplateId: SHARED_TEMPLATE.CHANGE_OF_CONTROL },
      ],
    },
  ],
}

// ─── BSA — US FinCEN Money Services Business ───────────────────────────────
const BSA_TRACKER: TrackerDef = {
  framework: 'BSA', displayName: 'FinCEN BSA Registration (US)', subtitle: 'US Money Services Business under the Bank Secrecy Act',
  regulatorShortName: 'FinCEN', regulationName: 'BSA/FinCEN',
  stages: [
    { stage: 'PRE_APPLICATION', order: 1, title: 'MSB Applicability Analysis',
      description: 'Analyse MSB definition applicability and map state money transmitter licence (MTL) requirements.',
      demoStatus: 'IN_PROGRESS', demoTargetDate: '2026-08-31',
      requirements: [
        { title: 'MSB definition applicability', fcaReference: '31 CFR 1010.100(ff)(5)', demoStatus: 'COMPLETE' },
        { title: 'State MTL scoping (50 states)', fcaReference: 'State-specific statutes', demoStatus: 'IN_PROGRESS' },
      ],
    },
    { stage: 'BUSINESS_PLAN', order: 2, title: 'Programme Governance',
      description: 'Designate BSA Officer and define AML programme ownership.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'AML programme ownership', fcaReference: '31 CFR 1022.210', sharedTemplateId: SHARED_TEMPLATE.GOVERNANCE },
        { title: 'BSA Officer appointment', fcaReference: '31 CFR 1022.210(d)(1)(i)', sharedTemplateId: SHARED_TEMPLATE.MLRO_APPOINTMENT },
      ],
    },
    { stage: 'FINANCIAL_RESOURCES', order: 3, title: 'State Licence Requirements',
      description: 'Surety bonds and state-specific net-worth requirements.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Surety bonds / state net worth', fcaReference: 'State-specific MTL statutes', sharedTemplateId: SHARED_TEMPLATE.PI_INSURANCE },
      ],
    },
    { stage: 'SYSTEMS_CONTROLS', order: 4, title: 'Systems & Controls',
      description: 'Transaction monitoring and OFAC sanctions screening.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Transaction monitoring systems', fcaReference: '31 CFR 1022.210(d)(1)(ii)', sharedTemplateId: SHARED_TEMPLATE.CYBERSECURITY },
        { title: 'OFAC sanctions screening', fcaReference: 'OFAC Virtual Currency Guidance 2021', sharedTemplateId: SHARED_TEMPLATE.SANCTIONS },
      ],
    },
    { stage: 'AML_CTF', order: 5, title: 'BSA/AML Programme',
      description: 'AML programme, SAR/CTR filings and Customer Identification Programme.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'AML programme (31 CFR 1022.210)', fcaReference: '31 CFR 1022.210', sharedTemplateId: SHARED_TEMPLATE.AML_POLICY },
        { title: 'SAR & CTR filing procedures', fcaReference: '31 CFR 1022.320; 1022.310', sharedTemplateId: SHARED_TEMPLATE.MLRO_APPOINTMENT },
        { title: 'Customer Identification Programme (CIP)', fcaReference: '31 CFR 1022.220', sharedTemplateId: SHARED_TEMPLATE.KYC_CDD },
      ],
    },
    { stage: 'CONSUMER_PROTECTION', order: 6, title: 'Customer Protection',
      description: 'Consumer disclosures and error-resolution procedures.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Consumer disclosures & error resolution', fcaReference: 'CFPB Remittance Rule (12 CFR 1005)', sharedTemplateId: SHARED_TEMPLATE.COMPLAINTS },
      ],
    },
    { stage: 'SUBMISSION', order: 7, title: 'FinCEN Registration',
      description: 'FinCEN Form 107 registration and parallel state MTL applications.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'FinCEN Form 107 registration', fcaReference: '31 CFR 1022.380', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
        { title: 'State MTL applications', fcaReference: 'NMLS + state-specific', sharedTemplateId: SHARED_TEMPLATE.APPLICATION_DOSSIER },
      ],
    },
    { stage: 'POST_APPROVAL', order: 8, title: 'Ongoing BSA Obligations',
      description: 'Biennial FinCEN re-registration and state licence renewal.',
      demoStatus: 'NOT_STARTED',
      requirements: [
        { title: 'Biennial FinCEN re-registration', fcaReference: '31 CFR 1022.380(b)(2)', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
        { title: 'Annual state licence renewal', fcaReference: 'State-specific', sharedTemplateId: SHARED_TEMPLATE.REGULATORY_REPORTING },
      ],
    },
  ],
}

// ─── All trackers registry ─────────────────────────────────────────────────
export const NEW_TRACKERS: TrackerDef[] = [GFSC_TRACKER, MAS_TRACKER, VARA_TRACKER, FINMA_TRACKER, SFC_TRACKER, ASIC_TRACKER, CSA_TRACKER, BSA_TRACKER]

// Metadata for the /authorisation index page — includes FCA/MiCA which are
// seeded elsewhere but still appear on the index alongside the new trackers.
export const TRACKER_METADATA: { framework: Framework; displayName: string; subtitle: string; regulatorShortName: string; path: string }[] = [
  { framework: 'FCA',   displayName: 'FCA Application Tracker',             subtitle: 'UK Cryptoasset Authorisation Journey',                   regulatorShortName: 'FCA',    path: '/fca-tracker' },
  { framework: 'MICA',  displayName: 'MiCA CASP Authorisation Tracker',     subtitle: 'EU Markets in Crypto-Assets — CASP Licensing Journey',   regulatorShortName: 'ESMA',   path: '/mica-tracker' },
  { framework: 'GFSC',  displayName: GFSC_TRACKER.displayName,              subtitle: GFSC_TRACKER.subtitle,                                    regulatorShortName: 'GFSC',   path: '/tracker/gfsc' },
  { framework: 'MAS',   displayName: MAS_TRACKER.displayName,               subtitle: MAS_TRACKER.subtitle,                                     regulatorShortName: 'MAS',    path: '/tracker/mas' },
  { framework: 'VARA',  displayName: VARA_TRACKER.displayName,              subtitle: VARA_TRACKER.subtitle,                                    regulatorShortName: 'VARA',   path: '/tracker/vara' },
  { framework: 'FINMA', displayName: FINMA_TRACKER.displayName,             subtitle: FINMA_TRACKER.subtitle,                                   regulatorShortName: 'FINMA',  path: '/tracker/finma' },
  { framework: 'SFC',   displayName: SFC_TRACKER.displayName,               subtitle: SFC_TRACKER.subtitle,                                     regulatorShortName: 'SFC',    path: '/tracker/sfc' },
  { framework: 'ASIC',  displayName: ASIC_TRACKER.displayName,              subtitle: ASIC_TRACKER.subtitle,                                    regulatorShortName: 'ASIC',   path: '/tracker/asic' },
  { framework: 'CSA',   displayName: CSA_TRACKER.displayName,               subtitle: CSA_TRACKER.subtitle,                                     regulatorShortName: 'CSA',    path: '/tracker/csa' },
  { framework: 'BSA',   displayName: BSA_TRACKER.displayName,               subtitle: BSA_TRACKER.subtitle,                                     regulatorShortName: 'FinCEN', path: '/tracker/bsa' },
]

export function findTracker(framework: Framework): TrackerDef | undefined {
  return NEW_TRACKERS.find(t => t.framework === framework)
}

// ─── Provisioner ────────────────────────────────────────────────────────────
// Seeds (or no-ops if already present) an entire tracker for an organisation.
// When includeDemo=true, applies demo statuses / completedAt / targetDate.
export async function provisionNewTracker(
  prisma: PrismaClient,
  orgId: string,
  framework: Framework,
  opts: { includeDemo?: boolean } = {},
): Promise<number> {
  const tracker = findTracker(framework)
  if (!tracker) return 0

  // Skip if already provisioned
  const existing = await prisma.fCAApplicationStage.count({ where: { organisationId: orgId, framework: framework as any } })
  if (existing > 0) return 0

  const prefix = framework.toLowerCase()
  for (let si = 0; si < tracker.stages.length; si++) {
    const stageDef = tracker.stages[si]
    const stageId = `${prefix}-stage-${si + 1}`
    const stage = await prisma.fCAApplicationStage.create({
      data: {
        id: stageId,
        stage: stageDef.stage as any,
        framework: framework as any,
        title: stageDef.title,
        description: stageDef.description,
        order: stageDef.order,
        status: (opts.includeDemo && stageDef.demoStatus ? stageDef.demoStatus : 'NOT_STARTED') as any,
        completedAt: opts.includeDemo && stageDef.demoCompletedAt ? new Date(stageDef.demoCompletedAt) : null,
        targetDate: stageDef.demoTargetDate ? new Date(stageDef.demoTargetDate) : null,
        organisationId: orgId,
      },
    })

    for (let ri = 0; ri < stageDef.requirements.length; ri++) {
      const r = stageDef.requirements[ri]
      const reqId = `req-${stageId}-${ri}`
      await prisma.stageRequirement.create({
        data: {
          id: reqId,
          stageId: stage.id,
          title: r.title,
          fcaReference: r.fcaReference,
          status: (opts.includeDemo && r.demoStatus ? r.demoStatus : 'NOT_STARTED') as any,
          templateId: r.sharedTemplateId ?? null,
          documentId: opts.includeDemo ? r.demoDocumentId ?? null : null,
        },
      })
    }
  }
  return tracker.stages.length
}

// Seeds the shared template library (idempotent upsert).
export async function seedSharedTemplates(prisma: PrismaClient, orgId: string): Promise<number> {
  let n = 0
  for (const t of SHARED_TEMPLATE_DEFS) {
    await prisma.document.upsert({
      where: { id: t.id },
      update: { name: t.name, type: t.type as any, content: renderSharedTemplate(t.name, t.body), isTemplate: true },
      create: {
        id: t.id,
        name: t.name,
        description: `Shared template reused across multiple authorisation trackers.`,
        type: t.type as any,
        content: renderSharedTemplate(t.name, t.body),
        isTemplate: true,
        organisationId: orgId,
      },
    })
    n++
  }
  return n
}

function renderSharedTemplate(name: string, body: string): string {
  return `# ${name}

> Shared template — one document supports multiple authorisation trackers and evidences multiple regulations.

## Purpose

${body}

## Scope

Applies to all employees, contractors and third-party providers of [Organisation Name] engaged in activities within the scope of the relevant authorisation or registration regime(s).

## Policy Statement

[Organisation Name] shall establish, implement, and maintain controls and procedures consistent with this template and the specific obligations of each applicable regulation, guideline and standard.

## Roles & Responsibilities

| Role | Responsibility |
|---|---|
| Board | Oversight and approval |
| Senior Management (SMF / Responsible Officer) | Day-to-day accountability |
| Compliance Function | Implementation, testing, reporting |
| Internal Audit | Independent assurance |

## Procedure

1. **Identify.** Map the activities and risks in scope.
2. **Assess.** Perform a risk-based assessment against each applicable regulatory framework.
3. **Implement.** Deploy the controls and procedures required by the most stringent applicable requirement.
4. **Evidence.** Capture artefacts linking controls to each applicable regulation/standard.
5. **Monitor.** Ongoing monitoring, testing and reporting.
6. **Review.** Annual review and refresh.

## Monitoring & Reporting

- Monthly KPIs to the accountable function
- Quarterly review at the Risk & Compliance Committee
- Annual Board re-approval

## Record-Keeping

Records retained for a minimum of six (6) years (or the longest applicable regulatory requirement) in the organisation's document-management system.

## Review & Approval

| Field | Detail |
|---|---|
| Prepared by | [Name, Role, Date] |
| Reviewed by | [Accountable Officer, Date] |
| Approved by | [Board / Designated SMF, Date] |
| Next review due | [Date + 12 months] |

---

*This is a shared template. Populate bracketed placeholders, tailor the Procedure section to your operational practice, and ensure content is reviewed by Compliance and Legal before adoption.*
`
}
