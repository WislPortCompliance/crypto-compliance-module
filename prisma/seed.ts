import { PrismaClient, UserRole, ControlStatus, StageStatus, DocumentType, AlertType, RiskLevel, ApplicationStage } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Users ────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Demo2024!', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Alex Thompson',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  })

  const complianceOfficer = await prisma.user.upsert({
    where: { email: 'compliance@demo.com' },
    update: {},
    create: {
      email: 'compliance@demo.com',
      name: 'Sarah Chen',
      password: hashedPassword,
      role: UserRole.COMPLIANCE_OFFICER,
    },
  })

  const riskManager = await prisma.user.upsert({
    where: { email: 'risk@demo.com' },
    update: {},
    create: {
      email: 'risk@demo.com',
      name: 'James Okafor',
      password: hashedPassword,
      role: UserRole.RISK_MANAGER,
    },
  })

  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@demo.com' },
    update: {},
    create: {
      email: 'auditor@demo.com',
      name: 'Emma Williams',
      password: hashedPassword,
      role: UserRole.AUDITOR,
    },
  })

  // ─── Organisation ──────────────────────────────────────────────────────────
  const org = await prisma.organisation.upsert({
    where: { id: 'org-demo-001' },
    update: {},
    create: {
      id: 'org-demo-001',
      name: 'BlockChain Securities Ltd',
      fcaReferenceNumber: 'FRN 987654',
      entityType: 'Cryptoasset Exchange Provider',
      registrationNumber: '12345678',
      incorporationDate: new Date('2019-06-15'),
      website: 'https://blockchainsecurities.co.uk',
      primaryContact: 'Alex Thompson',
      primaryEmail: 'admin@demo.com',
    },
  })

  // Update users with org
  await prisma.user.updateMany({
    where: { email: { in: ['admin@demo.com', 'compliance@demo.com', 'risk@demo.com', 'auditor@demo.com'] } },
    data: { organisationId: org.id },
  })

  // ─── Organisation Profile ──────────────────────────────────────────────────
  const profile = await prisma.organisationProfile.upsert({
    where: { organisationId: org.id },
    update: {},
    create: {
      organisationId: org.id,
      headcountRange: '51-200',
      revenueRange: '10-50m',
      customerTypes: ['retail', 'professional'],
      yearsInCrypto: 5,
    },
  })

  // Asset types
  const assetTypes = [
    { name: 'Cryptocurrencies', code: 'CRYPTO' },
    { name: 'Stablecoins', code: 'STABLE' },
    { name: 'Utility Tokens', code: 'UTILITY' },
    { name: 'Security Tokens', code: 'SECURITY' },
    { name: 'NFTs', code: 'NFT' },
  ]
  for (const at of assetTypes) {
    await prisma.assetType.upsert({
      where: { id: `at-${at.code}` },
      update: {},
      create: { id: `at-${at.code}`, ...at, profileId: profile.id },
    })
  }

  // Operating locations
  const locations = [
    { country: 'United Kingdom', countryCode: 'GB', isPrimary: true },
    { country: 'Germany', countryCode: 'DE', isPrimary: false },
    { country: 'Singapore', countryCode: 'SG', isPrimary: false },
  ]
  for (const loc of locations) {
    await prisma.operatingLocation.upsert({
      where: { id: `loc-${loc.countryCode}` },
      update: {},
      create: { id: `loc-${loc.countryCode}`, ...loc, profileId: profile.id },
    })
  }

  // Service types
  const services = [
    { name: 'Cryptoasset Exchange', code: 'EXCHANGE' },
    { name: 'Custodian Services', code: 'CUSTODY' },
    { name: 'Staking Services', code: 'STAKING' },
    { name: 'OTC Trading', code: 'OTC' },
  ]
  for (const svc of services) {
    await prisma.serviceType.upsert({
      where: { id: `svc-${svc.code}` },
      update: {},
      create: { id: `svc-${svc.code}`, ...svc, profileId: profile.id },
    })
  }

  // ─── Control Categories ───────────────────────────────────────────────────
  const categories = [
    { id: 'cat-aml', code: 'AML_KYC', name: 'AML/KYC', description: 'Anti-Money Laundering and Know Your Customer controls' },
    { id: 'cat-mi', code: 'MARKET_INTEGRITY', name: 'Market Integrity', description: 'Controls ensuring fair and orderly markets' },
    { id: 'cat-cp', code: 'CONSUMER_PROTECTION', name: 'Consumer Protection', description: 'Controls protecting retail and professional consumers' },
    { id: 'cat-or', code: 'OPERATIONAL_RESILIENCE', name: 'Operational Resilience', description: 'Business continuity and operational risk controls' },
    { id: 'cat-fc', code: 'FINANCIAL_CRIME', name: 'Financial Crime', description: 'Controls preventing financial crime and fraud' },
    { id: 'cat-dp', code: 'DATA_PROTECTION', name: 'Data Protection', description: 'GDPR and data privacy controls' },
    { id: 'cat-cust', code: 'CUSTODY', name: 'Custody & Safeguarding', description: 'Controls for cryptoasset custody and client money' },
    { id: 'cat-gov', code: 'GOVERNANCE', name: 'Governance', description: 'Corporate governance and SM&CR controls' },
    { id: 'cat-tech', code: 'TECHNOLOGY', name: 'Technology & Cyber', description: 'Technology risk and cybersecurity controls' },
  ]

  for (const cat of categories) {
    await prisma.controlCategory.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    })
  }

  // ─── FCA Principles ────────────────────────────────────────────────────────
  const principles = [
    { id: 'fca-p1', number: '1', name: 'Integrity', description: 'A firm must conduct its business with integrity.' },
    { id: 'fca-p2', number: '2', name: 'Skill, Care and Diligence', description: 'A firm must conduct its business with due skill, care and diligence.' },
    { id: 'fca-p3', number: '3', name: 'Management and Control', description: 'A firm must take reasonable care to organise and control its affairs responsibly and effectively.' },
    { id: 'fca-p4', number: '4', name: 'Financial Prudence', description: 'A firm must maintain adequate financial resources.' },
    { id: 'fca-p5', number: '5', name: 'Market Conduct', description: 'A firm must observe proper standards of market conduct.' },
    { id: 'fca-p6', number: '6', name: 'Customers Interests', description: 'A firm must pay due regard to the interests of its customers.' },
    { id: 'fca-p7', number: '7', name: 'Communications', description: 'A firm must pay due regard to the information needs of its clients.' },
    { id: 'fca-p8', number: '8', name: 'Conflicts of Interest', description: 'A firm must manage conflicts of interest fairly.' },
    { id: 'fca-p9', number: '9', name: 'Customers: Relationships of Trust', description: 'A firm must take reasonable care to ensure the suitability of its advice.' },
    { id: 'fca-p10', number: '10', name: 'Clients Assets', description: 'A firm must arrange adequate protection for clients assets.' },
    { id: 'fca-p11', number: '11', name: 'Relations with Regulators', description: 'A firm must deal with its regulators in an open and cooperative way.' },
  ]

  for (const p of principles) {
    await prisma.fCAPrinciple.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    })
  }

  // ─── Compliance Controls (50 controls) ───────────────────────────────────
  const controls = [
    // AML/KYC Controls
    { id: 'ctrl-001', controlRef: 'AML-001', name: 'Customer Due Diligence (CDD) Policy', description: 'Documented CDD policy covering standard, simplified, and enhanced due diligence procedures for all customer types.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-07-15'), nextReviewDate: new Date('2026-07-15') },
    { id: 'ctrl-002', controlRef: 'AML-002', name: 'Enhanced Due Diligence (EDD) Procedures', description: 'Documented EDD procedures for high-risk customers including PEPs, high-risk countries, and complex structures.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-07-15'), nextReviewDate: new Date('2026-07-15') },
    { id: 'ctrl-003', controlRef: 'AML-003', name: 'Transaction Monitoring System', description: 'Automated transaction monitoring system capable of detecting suspicious patterns including mixing, layering, and structuring.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-08-20'), nextReviewDate: new Date('2026-08-20') },
    { id: 'ctrl-004', controlRef: 'AML-004', name: 'Suspicious Activity Reporting (SAR)', description: 'Procedures for identifying, escalating, and reporting suspicious activity to the National Crime Agency (NCA).', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p1', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-07-20'), nextReviewDate: new Date('2026-07-20') },
    { id: 'ctrl-005', controlRef: 'AML-005', name: 'Travel Rule Compliance', description: 'FATF Travel Rule implementation for crypto transactions above threshold — collecting and transmitting originator/beneficiary information.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.NON_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-09-01'), nextReviewDate: new Date('2026-09-01') },
    { id: 'ctrl-006', controlRef: 'AML-006', name: 'Sanctions Screening', description: 'Real-time sanctions screening against OFSI, OFAC, UN, and EU sanctions lists for all customers and transactions.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p1', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-08-01'), nextReviewDate: new Date('2026-08-01') },
    { id: 'ctrl-007', controlRef: 'AML-007', name: 'Politically Exposed Persons (PEP) Screening', description: 'PEP screening at onboarding and ongoing for all customers, with enhanced monitoring for identified PEPs.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-07-15'), nextReviewDate: new Date('2026-07-15') },
    { id: 'ctrl-008', controlRef: 'AML-008', name: 'Blockchain Analytics Integration', description: 'Integration with blockchain analytics tools (Transaction Monitoring API) for cryptoasset tracing and risk scoring of all incoming and outgoing transactions.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-09-15'), nextReviewDate: new Date('2026-09-15') },
    { id: 'ctrl-009', controlRef: 'AML-009', name: 'AML Risk Assessment', description: 'Firm-wide AML/CTF risk assessment covering products, customers, geographies, delivery channels, and cryptoasset-specific risks.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-07-10'), nextReviewDate: new Date('2026-07-10') },
    { id: 'ctrl-010', controlRef: 'AML-010', name: 'AML Training Programme', description: 'Mandatory AML training for all staff with role-specific modules and annual refreshers. Records maintained.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p2', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-07-30'), nextReviewDate: new Date('2026-07-30') },
    // Governance Controls
    { id: 'ctrl-011', controlRef: 'GOV-001', name: 'Board Governance Framework', description: 'Documented governance framework including board composition, responsibilities, committee structures, and decision-making authorities.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-08-05'), nextReviewDate: new Date('2026-08-05') },
    { id: 'ctrl-012', controlRef: 'GOV-002', name: 'Senior Managers & Certification Regime (SM&CR)', description: 'Full SM&CR implementation including Senior Manager Function mapping, Statements of Responsibilities, and Certification regime.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-08-15'), nextReviewDate: new Date('2026-08-15') },
    { id: 'ctrl-013', controlRef: 'GOV-003', name: 'Compliance Monitoring Programme', description: 'Annual compliance monitoring programme covering all regulatory obligations with risk-based testing schedule.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-08-08'), nextReviewDate: new Date('2026-08-08') },
    { id: 'ctrl-014', controlRef: 'GOV-004', name: 'Regulatory Reporting Framework', description: 'Processes for timely and accurate submission of all FCA regulatory reports including REP-CRIM, annual AML reports.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p11', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-08-01'), nextReviewDate: new Date('2026-08-01') },
    { id: 'ctrl-015', controlRef: 'GOV-005', name: 'Conflicts of Interest Policy', description: 'Policy identifying, managing, and disclosing conflicts of interest including crypto-specific conflicts (proprietary trading, market making).', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p8', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-08-20'), nextReviewDate: new Date('2026-08-20') },
    { id: 'ctrl-016', controlRef: 'GOV-006', name: 'Whistleblowing Framework', description: 'FCA-compliant whistleblowing policy with designated whistleblowing champion and protected disclosure procedures.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p1', status: ControlStatus.NOT_ASSESSED, ownerId: adminUser.id, lastReviewed: null, nextReviewDate: new Date('2026-07-01') },
    // Consumer Protection Controls
    { id: 'ctrl-017', controlRef: 'CP-001', name: 'Consumer Duty Implementation', description: 'FCA Consumer Duty implementation plan covering four outcomes: products/services, price/value, understanding, support.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p6', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-09-01'), nextReviewDate: new Date('2026-09-01') },
    { id: 'ctrl-018', controlRef: 'CP-002', name: 'Risk Warnings & Disclosures', description: 'FCA-compliant risk warnings for cryptoassets prominently displayed in all customer-facing materials and at point of investment.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p7', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-08-25'), nextReviewDate: new Date('2026-08-25') },
    { id: 'ctrl-019', controlRef: 'CP-003', name: 'Client Categorisation', description: 'Procedures for correctly categorising clients as Retail, Professional, or Eligible Counterparty with appropriateness assessments.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p9', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-08-10'), nextReviewDate: new Date('2026-08-10') },
    { id: 'ctrl-020', controlRef: 'CP-004', name: 'Complaints Handling Procedure', description: 'FCA-compliant complaints handling procedure with 8-week resolution target, FOS referral rights, and root cause analysis.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p6', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-08-15'), nextReviewDate: new Date('2026-08-15') },
    { id: 'ctrl-021', controlRef: 'CP-005', name: 'Cooling-off Period Implementation', description: '24-hour cooling-off period for first-time cryptoasset purchases per FCA PS23/6 requirements.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p6', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-08-20'), nextReviewDate: new Date('2026-08-20') },
    // Custody Controls
    { id: 'ctrl-022', controlRef: 'CUST-001', name: 'Client Asset Segregation', description: 'Strict segregation of client cryptoassets from firm assets with daily reconciliation and independent verification.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p10', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-09-20'), nextReviewDate: new Date('2026-09-20') },
    { id: 'ctrl-023', controlRef: 'CUST-002', name: 'Cold Storage Policy', description: 'Policy requiring minimum 95% of client cryptoassets held in cold/offline storage with documented key management procedures.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p10', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-09-20'), nextReviewDate: new Date('2026-09-20') },
    { id: 'ctrl-024', controlRef: 'CUST-003', name: 'Private Key Management', description: 'Documented private key management procedures including multi-sig, key ceremony processes, and hardware security modules.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p10', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-09-10'), nextReviewDate: new Date('2026-09-10') },
    { id: 'ctrl-025', controlRef: 'CUST-004', name: 'Custody Insurance', description: 'Insurance coverage for cryptoassets in custody including hot wallet coverage and crime insurance.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p4', status: ControlStatus.NOT_ASSESSED, ownerId: riskManager.id, lastReviewed: null, nextReviewDate: new Date('2026-06-01') },
    { id: 'ctrl-026', controlRef: 'CUST-005', name: 'Third-Party Custodian Due Diligence', description: 'Due diligence framework for selecting, appointing, and monitoring third-party sub-custodians.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p10', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-09-01'), nextReviewDate: new Date('2026-09-01') },
    // Technology & Cyber Controls
    { id: 'ctrl-027', controlRef: 'TECH-001', name: 'Information Security Policy', description: 'ISO 27001-aligned information security policy covering all systems, data, and cryptoasset infrastructure.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-10-10'), nextReviewDate: new Date('2026-10-10') },
    { id: 'ctrl-028', controlRef: 'TECH-002', name: 'Cyber Incident Response Plan', description: 'Documented cyber incident response plan with defined RTO/RPO, escalation procedures, and FCA notification requirements.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-10-01'), nextReviewDate: new Date('2026-10-01') },
    { id: 'ctrl-029', controlRef: 'TECH-003', name: 'Penetration Testing Programme', description: 'Annual penetration testing of all customer-facing systems and internal infrastructure by approved third-party testers.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-09-15'), nextReviewDate: new Date('2026-09-15') },
    { id: 'ctrl-030', controlRef: 'TECH-004', name: 'Multi-Factor Authentication (MFA)', description: 'MFA enforced for all staff access to critical systems, admin panels, and all customer accounts above threshold values.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-10-20'), nextReviewDate: new Date('2026-10-20') },
    { id: 'ctrl-031', controlRef: 'TECH-005', name: 'Smart Contract Audit Programme', description: 'Third-party smart contract audits for all DeFi integrations and tokenisation products before deployment.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p2', status: ControlStatus.NOT_ASSESSED, ownerId: adminUser.id, lastReviewed: null, nextReviewDate: new Date('2026-08-01') },
    { id: 'ctrl-032', controlRef: 'TECH-006', name: 'Business Continuity Plan (BCP)', description: 'Tested BCP covering cryptoasset trading disruption, custody system failures, and key person dependencies.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-10-25'), nextReviewDate: new Date('2026-10-25') },
    // Operational Resilience
    { id: 'ctrl-033', controlRef: 'OR-001', name: 'Important Business Services Mapping', description: 'Identification and mapping of Important Business Services (IBS) per FCA operational resilience requirements.', categoryId: 'cat-or', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-10-01'), nextReviewDate: new Date('2026-10-01') },
    { id: 'ctrl-034', controlRef: 'OR-002', name: 'Impact Tolerances', description: 'Defined and tested impact tolerances for each Important Business Service within FCA guidance.', categoryId: 'cat-or', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-10-01'), nextReviewDate: new Date('2026-10-01') },
    { id: 'ctrl-035', controlRef: 'OR-003', name: 'Third Party and Outsourcing Risk', description: 'Third-party risk management framework covering cloud providers, custody sub-contractors, and critical service providers.', categoryId: 'cat-or', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-10-15'), nextReviewDate: new Date('2026-10-15') },
    // Market Integrity
    { id: 'ctrl-036', controlRef: 'MI-001', name: 'Market Abuse Policy', description: 'Policy and controls to prevent market manipulation, insider dealing, and abusive practices in cryptoasset markets.', categoryId: 'cat-mi', fcaPrincipleId: 'fca-p5', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-11-30'), nextReviewDate: new Date('2026-11-30') },
    { id: 'ctrl-037', controlRef: 'MI-002', name: 'Order Surveillance System', description: 'Automated surveillance of order flow and trading patterns to detect potential market manipulation.', categoryId: 'cat-mi', fcaPrincipleId: 'fca-p5', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-11-20'), nextReviewDate: new Date('2026-11-20') },
    { id: 'ctrl-038', controlRef: 'MI-003', name: 'Pre/Post Trade Controls', description: 'Pre-trade risk controls including position limits, velocity checks, and post-trade reporting obligations.', categoryId: 'cat-mi', fcaPrincipleId: 'fca-p5', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-11-01'), nextReviewDate: new Date('2026-11-01') },
    // Financial Crime
    { id: 'ctrl-039', controlRef: 'FC-001', name: 'Fraud Prevention Framework', description: 'Comprehensive fraud prevention controls covering account takeover, payment fraud, and cryptoasset-specific fraud vectors.', categoryId: 'cat-fc', fcaPrincipleId: 'fca-p1', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-11-10'), nextReviewDate: new Date('2026-11-10') },
    { id: 'ctrl-040', controlRef: 'FC-002', name: 'Proliferation Finance Controls', description: 'Controls specifically addressing proliferation finance risks per FATF Recommendation 1 and FCA guidance.', categoryId: 'cat-fc', fcaPrincipleId: 'fca-p1', status: ControlStatus.NOT_ASSESSED, ownerId: complianceOfficer.id, lastReviewed: null, nextReviewDate: new Date('2026-07-01') },
    { id: 'ctrl-041', controlRef: 'FC-003', name: 'Tax Evasion Prevention', description: 'Corporate criminal offence (CCO) controls and FATCA/CRS reporting for cryptoasset transactions.', categoryId: 'cat-fc', fcaPrincipleId: 'fca-p1', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-11-20'), nextReviewDate: new Date('2026-11-20') },
    // Data Protection
    { id: 'ctrl-042', controlRef: 'DP-001', name: 'GDPR Compliance Programme', description: 'UK GDPR compliance programme including privacy notices, consent management, DSAR procedures, and DPIA process.', categoryId: 'cat-dp', fcaPrincipleId: 'fca-p6', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-12-15'), nextReviewDate: new Date('2026-12-15') },
    { id: 'ctrl-043', controlRef: 'DP-002', name: 'Data Retention Policy', description: 'Documented data retention schedules for all customer and transactional data meeting AML 5-year retention requirements.', categoryId: 'cat-dp', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-12-15'), nextReviewDate: new Date('2026-12-15') },
    { id: 'ctrl-044', controlRef: 'DP-003', name: 'Data Breach Response Plan', description: 'ICO-compliant data breach response plan with 72-hour notification procedure and affected party communication process.', categoryId: 'cat-dp', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-12-01'), nextReviewDate: new Date('2026-12-01') },
    // Financial Resources
    { id: 'ctrl-045', controlRef: 'FIN-001', name: 'Capital Adequacy Assessment', description: 'ICAAP-equivalent assessment of capital requirements including cryptoasset-specific risk capital buffers.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p4', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-12-10'), nextReviewDate: new Date('2026-12-10') },
    { id: 'ctrl-046', controlRef: 'FIN-002', name: 'Liquidity Risk Management', description: 'Liquidity risk framework covering crypto market liquidity, stablecoin de-peg scenarios, and fiat liquidity buffers.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p4', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2025-12-01'), nextReviewDate: new Date('2026-12-01') },
    { id: 'ctrl-047', controlRef: 'FIN-003', name: 'Wind-Down Plan', description: 'Documented wind-down plan ensuring orderly return of client assets and cessation of regulated activities if required.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p4', status: ControlStatus.NOT_ASSESSED, ownerId: riskManager.id, lastReviewed: null, nextReviewDate: new Date('2026-08-01') },
    { id: 'ctrl-048', controlRef: 'FIN-004', name: 'Financial Crime Risk Appetite', description: 'Board-approved financial crime risk appetite statement with quantified risk tolerances and escalation thresholds.', categoryId: 'cat-fc', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2025-12-10'), nextReviewDate: new Date('2026-12-10') },
    { id: 'ctrl-049', controlRef: 'GOV-007', name: 'Regulatory Change Management', description: 'Process for monitoring, assessing, and implementing regulatory changes including FCA consultations and policy statements.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p11', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-08-15'), nextReviewDate: new Date('2026-08-15') },
    { id: 'ctrl-050', controlRef: 'AML-011', name: 'MLRO Appointment & Oversight', description: 'Appointed Money Laundering Reporting Officer (MLRO) with appropriate experience, resources, and board-level access.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-07-05'), nextReviewDate: new Date('2026-07-05') },
  ]

  for (const ctrl of controls) {
    await prisma.complianceControl.upsert({
      where: { id: ctrl.id },
      update: { status: ctrl.status },
      create: { ...ctrl, organisationId: org.id },
    })
  }

  // ─── FCA Application Stages ───────────────────────────────────────────────
  const stages = [
    {
      id: 'stage-1',
      stage: ApplicationStage.PRE_APPLICATION,
      title: 'Pre-Application Assessment',
      description: 'Initial assessment of regulatory perimeter, business model analysis, and readiness evaluation.',
      status: StageStatus.COMPLETE,
      order: 1,
      completedAt: new Date('2024-01-31'),
      targetDate: new Date('2024-01-31'),
      requirements: [
        { title: 'Regulatory perimeter analysis', status: StageStatus.COMPLETE },
        { title: 'Business model assessment', status: StageStatus.COMPLETE },
        { title: 'Gap analysis against FCA requirements', status: StageStatus.COMPLETE },
        { title: 'Pre-application meeting with FCA', status: StageStatus.COMPLETE },
        { title: 'Project plan and resource allocation', status: StageStatus.COMPLETE },
      ],
    },
    {
      id: 'stage-2',
      stage: ApplicationStage.BUSINESS_PLAN,
      title: 'Business Plan & Governance',
      description: 'Preparation of regulatory business plan, governance structure, and SM&CR mapping.',
      status: StageStatus.COMPLETE,
      order: 2,
      completedAt: new Date('2024-02-29'),
      targetDate: new Date('2024-02-29'),
      requirements: [
        { title: 'Regulatory business plan (5-year)', status: StageStatus.COMPLETE },
        { title: 'Governance framework and board composition', status: StageStatus.COMPLETE },
        { title: 'SM&CR Senior Manager Function mapping', status: StageStatus.COMPLETE },
        { title: 'Statements of Responsibilities (SoR)', status: StageStatus.COMPLETE },
        { title: 'Responsibility Map', status: StageStatus.COMPLETE },
        { title: 'Conflicts of interest register', status: StageStatus.COMPLETE },
      ],
    },
    {
      id: 'stage-3',
      stage: ApplicationStage.FINANCIAL_RESOURCES,
      title: 'Financial Resources Assessment',
      description: 'Capital requirements calculation, liquidity assessment, and financial projections.',
      status: StageStatus.COMPLETE,
      order: 3,
      completedAt: new Date('2024-03-15'),
      targetDate: new Date('2024-03-31'),
      requirements: [
        { title: 'Capital adequacy calculation', status: StageStatus.COMPLETE },
        { title: 'Financial projections (3-year)', status: StageStatus.COMPLETE },
        { title: 'Liquidity risk assessment', status: StageStatus.COMPLETE },
        { title: 'Wind-down plan (draft)', status: StageStatus.COMPLETE },
        { title: 'Professional indemnity insurance review', status: StageStatus.COMPLETE },
      ],
    },
    {
      id: 'stage-4',
      stage: ApplicationStage.SYSTEMS_CONTROLS,
      title: 'Systems & Controls Setup',
      description: 'Implementation of compliance systems, technology infrastructure, and operational controls.',
      status: StageStatus.IN_PROGRESS,
      order: 4,
      targetDate: new Date('2026-06-30'),
      requirements: [
        { title: 'Compliance monitoring system implementation', status: StageStatus.COMPLETE },
        { title: 'Transaction monitoring system deployment', status: StageStatus.IN_PROGRESS },
        { title: 'Surveillance system configuration', status: StageStatus.IN_PROGRESS },
        { title: 'Reporting infrastructure setup', status: StageStatus.COMPLETE },
        { title: 'Operational resilience testing', status: StageStatus.NOT_STARTED },
        { title: 'IT security assessment (pen test)', status: StageStatus.IN_PROGRESS },
      ],
    },
    {
      id: 'stage-5',
      stage: ApplicationStage.AML_CTF,
      title: 'AML/CTF Framework',
      description: 'Full AML/CTF programme implementation including policies, procedures, and technology.',
      status: StageStatus.IN_PROGRESS,
      order: 5,
      targetDate: new Date('2026-07-31'),
      requirements: [
        { title: 'AML policy suite finalisation', status: StageStatus.COMPLETE },
        { title: 'KYC/CDD procedures documentation', status: StageStatus.COMPLETE },
        { title: 'Travel Rule solution implementation', status: StageStatus.IN_PROGRESS },
        { title: 'Blockchain analytics tool integration', status: StageStatus.IN_PROGRESS },
        { title: 'MLRO appointment and mandate', status: StageStatus.COMPLETE },
        { title: 'AML training programme rollout', status: StageStatus.COMPLETE },
        { title: 'SAR reporting procedures', status: StageStatus.COMPLETE },
      ],
    },
    {
      id: 'stage-6',
      stage: ApplicationStage.CONSUMER_PROTECTION,
      title: 'Consumer Protection Measures',
      description: 'Implementation of Consumer Duty obligations and retail investor protections.',
      status: StageStatus.NOT_STARTED,
      order: 6,
      targetDate: new Date('2026-08-31'),
      requirements: [
        { title: 'Consumer Duty implementation plan', status: StageStatus.NOT_STARTED },
        { title: 'Risk warning framework implementation', status: StageStatus.NOT_STARTED },
        { title: 'Client categorisation review', status: StageStatus.NOT_STARTED },
        { title: 'Appropriateness test design', status: StageStatus.NOT_STARTED },
        { title: 'Complaints handling review', status: StageStatus.NOT_STARTED },
      ],
    },
    {
      id: 'stage-7',
      stage: ApplicationStage.SUBMISSION,
      title: 'Application Submission',
      description: 'Final preparation and submission of FCA authorisation application.',
      status: StageStatus.NOT_STARTED,
      order: 7,
      targetDate: new Date('2026-10-31'),
      requirements: [
        { title: 'Application form completion', status: StageStatus.NOT_STARTED },
        { title: 'Supporting document pack assembly', status: StageStatus.NOT_STARTED },
        { title: 'Regulatory fees payment', status: StageStatus.NOT_STARTED },
        { title: 'FCA Connect portal submission', status: StageStatus.NOT_STARTED },
        { title: 'Application acknowledgement', status: StageStatus.NOT_STARTED },
      ],
    },
    {
      id: 'stage-8',
      stage: ApplicationStage.POST_APPROVAL,
      title: 'Post-Approval Monitoring',
      description: 'Ongoing compliance monitoring and regulatory reporting post-authorisation.',
      status: StageStatus.NOT_STARTED,
      order: 8,
      targetDate: null,
      requirements: [
        { title: 'Ongoing compliance monitoring programme', status: StageStatus.NOT_STARTED },
        { title: 'Annual regulatory returns setup', status: StageStatus.NOT_STARTED },
        { title: 'Change in control notification process', status: StageStatus.NOT_STARTED },
        { title: 'Regulatory change monitoring', status: StageStatus.NOT_STARTED },
      ],
    },
  ]

  // Map certain completed requirements to evidence documents
  const reqDocumentMap: Record<string, string> = {
    'req-stage-1-1': 'doc-001',   // Business model assessment → AML Policy
    'req-stage-1-3': 'doc-005',   // Pre-application meeting → Meeting Notes
    'req-stage-2-0': 'doc-006',   // Regulatory business plan → Board Governance Charter
    'req-stage-2-1': 'doc-006',   // Governance framework → Board Governance Charter
    'req-stage-3-0': 'doc-003',   // Capital adequacy → Annual AML Report
    'req-stage-4-0': 'doc-002',   // Compliance monitoring system → KYC Manual
    'req-stage-4-5': 'doc-004',   // IT security assessment → Pen Test Report
    'req-stage-5-0': 'doc-001',   // AML policy suite → AML Policy
    'req-stage-5-1': 'doc-002',   // KYC/CDD procedures → KYC Manual
    'req-stage-5-4': 'doc-001',   // MLRO appointment → AML Policy
    'req-stage-5-5': 'doc-003',   // AML training → Annual AML Report
    'req-stage-5-6': 'doc-001',   // SAR procedures → AML Policy
  }

  for (const stageData of stages) {
    const { requirements, ...stageFields } = stageData
    const stage = await prisma.fCAApplicationStage.upsert({
      where: { id: stageFields.id },
      update: { status: stageFields.status },
      create: { ...stageFields, organisationId: org.id },
    })

    for (let i = 0; i < requirements.length; i++) {
      const reqId = `req-${stageFields.id}-${i}`
      const documentId = reqDocumentMap[reqId] ?? null
      await prisma.stageRequirement.upsert({
        where: { id: reqId },
        update: { status: requirements[i].status, documentId },
        create: {
          id: reqId,
          stageId: stage.id,
          title: requirements[i].title,
          status: requirements[i].status,
          documentId,
        },
      })
    }
  }

  // ─── Regulations ──────────────────────────────────────────────────────────
  const regulations = [
    // UK
    { id: 'reg-fca-crypto', code: 'FCA_CRYPTO_2026', name: 'FCA Cryptoassets Regime 2026', fullName: 'FCA Cryptoassets Regulations 2026 (FSMA)', jurisdiction: 'UK', regulator: 'FCA', description: 'UK regulatory framework for cryptoasset businesses under FSMA, including exchange, custody, and stablecoin issuance.' },
    { id: 'reg-fsma', code: 'FSMA_2000', name: 'FSMA 2000', fullName: 'Financial Services and Markets Act 2000', jurisdiction: 'UK', regulator: 'FCA/PRA', description: 'Primary UK financial services legislation governing authorisation, conduct, and prudential requirements.' },
    { id: 'reg-mlr', code: 'MLR_2017', name: 'MLR 2017', fullName: 'Money Laundering Regulations 2017 (as amended)', jurisdiction: 'UK', regulator: 'HMRC/FCA', description: 'UK AML/CTF regulations implementing the EU 4th/5th AML Directives into UK law.' },
    { id: 'reg-smcr', code: 'SMCR', name: 'SM&CR', fullName: 'Senior Managers and Certification Regime', jurisdiction: 'UK', regulator: 'FCA', description: 'UK accountability regime for financial services firms requiring senior manager accountability and certification.' },
    { id: 'reg-gdpr', code: 'UK_GDPR', name: 'UK GDPR', fullName: 'UK General Data Protection Regulation', jurisdiction: 'UK', regulator: 'ICO', description: 'UK data protection law post-Brexit, governing processing of personal data.' },
    { id: 'reg-ofsi', code: 'OFSI', name: 'OFSI Sanctions', fullName: 'Office of Financial Sanctions Implementation', jurisdiction: 'UK', regulator: 'OFSI/HMT', description: 'UK financial sanctions regime administered by OFSI including crypto-specific sanctions guidance.' },
    { id: 'reg-consumer-duty', code: 'CONSUMER_DUTY', name: 'FCA Consumer Duty', fullName: 'FCA Consumer Duty (PS22/9)', jurisdiction: 'UK', regulator: 'FCA', description: 'FCA Consumer Duty requiring firms to deliver good outcomes for retail customers across four key areas.' },
    // EU
    { id: 'reg-mica', code: 'MICA', name: 'MiCA', fullName: 'Markets in Crypto-Assets Regulation (EU) 2023/1114', jurisdiction: 'EU', regulator: 'ESMA/NCAs', description: 'EU comprehensive crypto-asset regulatory framework covering CASPs, EMTs, and ARTs.' },
    { id: 'reg-amld6', code: 'AMLD6', name: 'AMLD6', fullName: '6th EU Anti-Money Laundering Directive', jurisdiction: 'EU', regulator: 'EBA/NCAs', description: 'EU AML directive extending predicate offences and strengthening criminal liability for money laundering.' },
    // US
    { id: 'reg-genius', code: 'GENIUS_ACT', name: 'GENIUS Act', fullName: 'Guiding and Establishing National Innovation for US Stablecoins Act', jurisdiction: 'US', regulator: 'OCC/Fed', description: 'US federal stablecoin legislation establishing regulatory framework for payment stablecoin issuers. Important for UK firms issuing or handling stablecoins with US nexus.' },
    { id: 'reg-sec', code: 'SEC_EXCHANGE_ACT', name: 'SEC Exchange Act', fullName: 'Securities Exchange Act 1934 (SEC crypto guidance)', jurisdiction: 'US', regulator: 'SEC', description: 'US securities law applied to crypto assets deemed securities by the SEC. Applies to firms with US investors or US-listed tokens.' },
    { id: 'reg-bsa', code: 'BSA_FINCEN', name: 'BSA/FinCEN', fullName: 'Bank Secrecy Act / FinCEN VASP Requirements', jurisdiction: 'US', regulator: 'FinCEN', description: 'US AML framework for Virtual Asset Service Providers including MSB registration and SAR filing.' },
    { id: 'reg-fatca', code: 'FATCA', name: 'FATCA', fullName: 'Foreign Account Tax Compliance Act', jurisdiction: 'US', regulator: 'IRS', description: 'US tax reporting requirements for foreign financial institutions, extended to crypto in guidance.' },
    // Japan
    { id: 'reg-japan-psa', code: 'JAPAN_PSA', name: 'Japan PSA', fullName: 'Payment Services Act (Japan) — Crypto Asset Exchange Services', jurisdiction: 'Japan', regulator: 'JFSA', description: 'Japanese regulatory framework for crypto asset exchange service providers (CAESP) requiring JFSA registration.' },
    // Australia
    { id: 'reg-asic', code: 'ASIC_FRAMEWORK', name: 'ASIC Framework', fullName: 'ASIC Crypto Regulatory Framework (Australia)', jurisdiction: 'Australia', regulator: 'ASIC', description: 'Australian Securities and Investments Commission framework for digital asset businesses, including AFS licensing requirements.' },
    // Canada
    { id: 'reg-csa', code: 'CSA_FRAMEWORK', name: 'CSA Framework', fullName: 'Canadian Securities Administrators Crypto Framework', jurisdiction: 'Canada', regulator: 'CSA/FINTRAC', description: 'Canadian crypto regulatory framework requiring pre-registration with provincial securities regulators and FINTRAC MSB registration.' },
    // Singapore
    { id: 'reg-mas-psa', code: 'MAS_PSA', name: 'MAS PSA', fullName: 'Payment Services Act (Singapore) — MAS', jurisdiction: 'Singapore', regulator: 'MAS', description: 'Singapore Monetary Authority of Singapore Payment Services Act licensing framework for Digital Payment Token (DPT) services.' },
    // South Korea
    { id: 'reg-kr-vaupa', code: 'KR_VAUPA', name: 'Korea VAUPA', fullName: 'Virtual Asset User Protection Act (South Korea)', jurisdiction: 'South Korea', regulator: 'FSC/FSS', description: 'South Korean virtual asset user protection legislation requiring VASP registration, customer asset segregation, and market surveillance.' },
    // Brazil
    { id: 'reg-brazil', code: 'BRAZIL_CRYPTO', name: 'Brazil Crypto Law', fullName: 'Brazilian Crypto Regulatory Framework (Law 14,478/2022)', jurisdiction: 'Brazil', regulator: 'BCB/CVM', description: 'Brazilian framework for virtual asset service providers regulated by Banco Central do Brasil and CVM.' },
    // India
    { id: 'reg-india-vda', code: 'INDIA_VDA', name: 'India VDA Framework', fullName: 'Virtual Digital Assets Taxation Framework (India)', jurisdiction: 'India', regulator: 'CBDT/FIU-IND', description: 'Indian framework for Virtual Digital Assets including 30% tax on gains, 1% TDS, and PMLA reporting requirements for VASPs.' },
    // Saudi Arabia
    { id: 'reg-sama', code: 'SAMA_DIGITAL', name: 'SAMA Digital Assets', fullName: 'SAMA Digital Asset Regulations (Saudi Arabia)', jurisdiction: 'Saudi Arabia', regulator: 'SAMA/CMA', description: 'Saudi Central Bank and Capital Market Authority regulatory framework for digital assets and crypto service providers.' },
    // Global
    { id: 'reg-fatf-tr', code: 'FATF_TRAVEL_RULE', name: 'FATF Travel Rule', fullName: 'FATF Recommendation 16 - Virtual Assets Travel Rule', jurisdiction: 'Global', regulator: 'FATF', description: 'FATF requirement for VASPs to collect and transmit originator and beneficiary information for crypto transfers.' },
    { id: 'reg-fatf-40', code: 'FATF_40', name: 'FATF 40 Recommendations', fullName: 'FATF 40 Recommendations (Virtual Assets)', jurisdiction: 'Global', regulator: 'FATF', description: 'FATF international standards on combating money laundering and terrorist financing, including Recommendations 10, 15, and 16 specific to VASPs.' },
    { id: 'reg-crs', code: 'CRS_CARF', name: 'CRS/CARF', fullName: 'Common Reporting Standard / Crypto-Asset Reporting Framework', jurisdiction: 'Global', regulator: 'OECD', description: 'OECD automatic exchange of information standard, now extended to crypto via CARF framework.' },
    { id: 'reg-wolfsburg', code: 'WOLFSBURG', name: 'Wolfsburg Principles', fullName: 'Wolfsburg Group AML/CTF Principles for Correspondent Banking', jurisdiction: 'Global', regulator: 'Wolfsburg Group', description: 'Industry standards for AML/CTF in correspondent banking relationships, increasingly applied to crypto.' },
    { id: 'reg-basel', code: 'BASEL_CRYPTO', name: 'Basel Crypto Standards', fullName: 'Basel Committee Prudential Standard for Crypto-Asset Exposures', jurisdiction: 'Global', regulator: 'BCBS', description: 'Basel Committee on Banking Supervision prudential treatment of crypto-asset exposures, establishing capital requirements and classification framework.' },
  ]

  for (const reg of regulations) {
    await prisma.regulation.upsert({
      where: { id: reg.id },
      update: {},
      create: reg,
    })
  }

  // Compliance map entries
  const mapEntries = [
    // UK — applicable (HQ)
    { id: 'cme-0', regulationId: 'reg-fca-crypto', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT, notes: 'Applicable as UK-headquartered cryptoasset exchange provider seeking FCA authorisation.' },
    { id: 'cme-1', regulationId: 'reg-fsma', applicable: true, status: ControlStatus.COMPLIANT, notes: 'Applicable as a UK financial services firm operating under FSMA framework.' },
    { id: 'cme-2', regulationId: 'reg-mlr', applicable: true, status: ControlStatus.COMPLIANT, notes: 'Applicable as a crypto asset exchange registered for AML purposes under MLR 2017.' },
    { id: 'cme-3', regulationId: 'reg-smcr', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT, notes: 'Applicable to FCA-regulated firms. SM&CR certification partially complete.' },
    { id: 'cme-4', regulationId: 'reg-gdpr', applicable: true, status: ControlStatus.COMPLIANT, notes: 'Applicable as UK data controller processing customer personal data.' },
    { id: 'cme-5', regulationId: 'reg-ofsi', applicable: true, status: ControlStatus.COMPLIANT, notes: 'Applicable as UK firm subject to OFSI financial sanctions obligations.' },
    { id: 'cme-6', regulationId: 'reg-consumer-duty', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT, notes: 'Applicable as FCA-regulated firm with retail customers.' },
    // EU — applicable (Germany office)
    { id: 'cme-7', regulationId: 'reg-mica', applicable: true, status: ControlStatus.NOT_ASSESSED, notes: 'Applicable due to Germany operations. MiCA authorisation as CASP required for EU services.' },
    { id: 'cme-8', regulationId: 'reg-amld6', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT, notes: 'Applicable via German operations subject to EU AML directives.' },
    // US — applicable (stablecoin operations + US clients)
    { id: 'cme-9', regulationId: 'reg-genius', applicable: true, status: ControlStatus.NOT_ASSESSED, notes: 'Applicable as stablecoin issuer/handler with potential US customer exposure.' },
    { id: 'cme-10', regulationId: 'reg-sec', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not currently applicable — no US-listed securities tokens. Monitor if token offerings expand.' },
    { id: 'cme-11', regulationId: 'reg-bsa', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not directly applicable — no US money transmitter licence. Required if onboarding US retail clients.' },
    { id: 'cme-12', regulationId: 'reg-fatca', applicable: true, status: ControlStatus.COMPLIANT, notes: 'Applicable as foreign financial institution with US person reporting obligations.' },
    // Japan — not applicable
    { id: 'cme-13', regulationId: 'reg-japan-psa', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not applicable — no Japan operations or Japanese customer base.' },
    // Australia — not applicable
    { id: 'cme-14', regulationId: 'reg-asic', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not applicable — no Australian operations.' },
    // Canada — not applicable
    { id: 'cme-15', regulationId: 'reg-csa', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not applicable — no Canadian operations.' },
    // Singapore — applicable (Singapore office)
    { id: 'cme-16', regulationId: 'reg-mas-psa', applicable: true, status: ControlStatus.NOT_ASSESSED, notes: 'Applicable due to Singapore operations. MAS Major Payment Institution licence required for DPT services.' },
    // South Korea — not applicable
    { id: 'cme-17', regulationId: 'reg-kr-vaupa', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not applicable — no South Korean operations.' },
    // Brazil — not applicable
    { id: 'cme-18', regulationId: 'reg-brazil', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not applicable — no Brazilian operations.' },
    // India — not applicable
    { id: 'cme-19', regulationId: 'reg-india-vda', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not applicable — no Indian operations.' },
    // Saudi Arabia — not applicable
    { id: 'cme-20', regulationId: 'reg-sama', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not applicable — no Saudi Arabian operations.' },
    // Global — applicable
    { id: 'cme-21', regulationId: 'reg-fatf-tr', applicable: true, status: ControlStatus.NON_COMPLIANT, notes: 'Applicable as international VASP. Travel Rule compliance gap identified.' },
    { id: 'cme-22', regulationId: 'reg-fatf-40', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT, notes: 'Applicable as VASP operating across multiple jurisdictions. Recommendations 10, 15, 16 specifically relevant.' },
    { id: 'cme-23', regulationId: 'reg-crs', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT, notes: 'Applicable under CARF framework for crypto-asset reporting. Full CARF implementation due 2027.' },
    { id: 'cme-24', regulationId: 'reg-wolfsburg', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT, notes: 'Applicable for correspondent banking and institutional relationships.' },
    { id: 'cme-25', regulationId: 'reg-basel', applicable: false, status: ControlStatus.NOT_ASSESSED, notes: 'Not directly applicable — applies to banks with crypto exposures. Monitor as prudential framework may extend to CASPs.' },
  ]

  // Delete and recreate compliance map entries to avoid ID conflicts across seeds
  await prisma.complianceMapEntry.deleteMany({ where: { organisationId: org.id } })
  for (const entry of mapEntries) {
    const { id, ...rest } = entry
    await prisma.complianceMapEntry.create({
      data: { id, organisationId: org.id, ...rest },
    })
  }

  // ─── Regulation → Control Mappings ───────────────────────────────────────────
  const regControlMappings: { regulationId: string; controlIds: string[] }[] = [
    {
      regulationId: 'reg-fca-crypto',
      controlIds: ['ctrl-001', 'ctrl-002', 'ctrl-005', 'ctrl-008', 'ctrl-011', 'ctrl-012', 'ctrl-017', 'ctrl-018', 'ctrl-019', 'ctrl-021', 'ctrl-022', 'ctrl-023', 'ctrl-024', 'ctrl-027', 'ctrl-028', 'ctrl-033', 'ctrl-034', 'ctrl-036', 'ctrl-037', 'ctrl-038'],
    },
    {
      regulationId: 'reg-fsma',
      controlIds: ['ctrl-011', 'ctrl-012', 'ctrl-013', 'ctrl-014', 'ctrl-045', 'ctrl-046', 'ctrl-047'],
    },
    {
      regulationId: 'reg-mlr',
      controlIds: ['ctrl-001', 'ctrl-002', 'ctrl-003', 'ctrl-004', 'ctrl-005', 'ctrl-006', 'ctrl-007', 'ctrl-008', 'ctrl-009', 'ctrl-010', 'ctrl-050'],
    },
    {
      regulationId: 'reg-smcr',
      controlIds: ['ctrl-011', 'ctrl-012', 'ctrl-013', 'ctrl-016'],
    },
    {
      regulationId: 'reg-gdpr',
      controlIds: ['ctrl-042', 'ctrl-043', 'ctrl-044'],
    },
    {
      regulationId: 'reg-ofsi',
      controlIds: ['ctrl-006', 'ctrl-039'],
    },
    {
      regulationId: 'reg-consumer-duty',
      controlIds: ['ctrl-017', 'ctrl-018', 'ctrl-019', 'ctrl-020', 'ctrl-021'],
    },
    {
      regulationId: 'reg-mica',
      controlIds: ['ctrl-001', 'ctrl-002', 'ctrl-011', 'ctrl-017', 'ctrl-022', 'ctrl-023', 'ctrl-036'],
    },
    {
      regulationId: 'reg-amld6',
      controlIds: ['ctrl-001', 'ctrl-002', 'ctrl-004', 'ctrl-040'],
    },
    {
      regulationId: 'reg-genius',
      controlIds: ['ctrl-022', 'ctrl-023', 'ctrl-001', 'ctrl-003'],
    },
    {
      regulationId: 'reg-bsa',
      controlIds: ['ctrl-001', 'ctrl-003', 'ctrl-006'],
    },
    {
      regulationId: 'reg-fatca',
      controlIds: ['ctrl-041'],
    },
    {
      regulationId: 'reg-mas-psa',
      controlIds: ['ctrl-001', 'ctrl-005', 'ctrl-022', 'ctrl-023'],
    },
    {
      regulationId: 'reg-fatf-tr',
      controlIds: ['ctrl-005', 'ctrl-008'],
    },
    {
      regulationId: 'reg-fatf-40',
      controlIds: ['ctrl-001', 'ctrl-002', 'ctrl-003', 'ctrl-004', 'ctrl-005', 'ctrl-006', 'ctrl-007', 'ctrl-009', 'ctrl-040'],
    },
    {
      regulationId: 'reg-crs',
      controlIds: ['ctrl-041'],
    },
    {
      regulationId: 'reg-wolfsburg',
      controlIds: ['ctrl-001', 'ctrl-002', 'ctrl-009'],
    },
    {
      regulationId: 'reg-basel',
      controlIds: ['ctrl-022', 'ctrl-023', 'ctrl-024', 'ctrl-027', 'ctrl-045'],
    },
  ]

  let rcIdx = 0
  for (const mapping of regControlMappings) {
    for (const controlId of mapping.controlIds) {
      await prisma.regulationControl.upsert({
        where: { controlId_regulationId: { controlId, regulationId: mapping.regulationId } },
        update: {},
        create: { id: `rc-${rcIdx++}`, controlId, regulationId: mapping.regulationId },
      })
    }
  }

  // ─── Documents ────────────────────────────────────────────────────────────
  const documents = [
    {
      id: 'doc-001',
      name: 'AML Policy v3.2',
      type: DocumentType.POLICY,
      description: 'Group AML/CTF Policy covering all business lines',
      uploadedBy: complianceOfficer.id,
      content: `# AML/CTF Policy — BlockChain Securities Ltd
## Version 3.2 | Effective Date: 1 January 2026 | Owner: MLRO

> This policy is approved by the Board of Directors and applies to all employees, contractors, and agents of BlockChain Securities Ltd. It must be reviewed annually or upon material regulatory change.

---

## 1. Introduction and Scope

BlockChain Securities Ltd (**"the Firm"**) is committed to preventing money laundering, terrorist financing, and proliferation financing in all its operations. This policy sets out the Firm's obligations under the **Money Laundering Regulations 2017 (as amended)**, the **Proceeds of Crime Act 2002**, and the **Terrorism Act 2000**.

This policy applies to:
- All cryptoasset exchange services
- Custodian services for client cryptoassets
- OTC trading and institutional services
- Staking and ancillary services

## 2. Regulatory Framework

### 2.1 Primary Legislation

| Legislation | Scope | Regulator |
|---|---|---|
| Money Laundering Regulations 2017 | CDD, EDD, ongoing monitoring | HMRC / FCA |
| Proceeds of Crime Act 2002 | SAR obligations, tipping off | NCA |
| Terrorism Act 2000 | Terrorist financing prevention | NCA / Counter-terrorism |
| SAMLA 2018 / OFSI Guidance | Financial sanctions compliance | OFSI / HMT |
| FATF Recommendations 10, 15, 16 | International VASP standards | FATF |

### 2.2 FCA Expectations

The FCA requires cryptoasset exchange providers to maintain a **robust, risk-based AML/CTF framework** commensurate with the nature, scale, and complexity of their business. The Firm's framework is assessed annually by the MLRO and reported to the Board.

## 3. Customer Due Diligence (CDD)

### 3.1 Standard CDD

Standard CDD must be conducted for **all customers** at the point of onboarding. The minimum information collected is:

1. Full legal name (verified against government-issued ID)
2. Date of birth and nationality
3. Current residential address (verified within 3 months)
4. Source of funds declaration
5. Nature and purpose of business relationship

### 3.2 Enhanced Due Diligence (EDD)

EDD is required where a higher risk of money laundering or terrorist financing is identified, including:

- **Politically Exposed Persons (PEPs)** and their associates
- Customers from **FATF high-risk jurisdictions** (current FATF grey/black list)
- **Complex ownership structures** with ultimate beneficial owners in high-risk jurisdictions
- Customers transacting above **£50,000** in a rolling 30-day period
- Customers using **privacy coins** (Monero, Zcash) or mixer services

EDD measures include senior management approval, enhanced source of wealth verification, and quarterly account reviews.

### 3.3 Simplified CDD

Simplified CDD may apply where risk is demonstrably lower, such as regulated financial institutions within the EEA or equivalent jurisdictions. Simplified CDD must be documented and reviewed at least annually.

## 4. Ongoing Monitoring

All customer accounts are subject to **continuous transaction monitoring** via the Firm's automated Transaction Monitoring API. The system:

- Analyses blockchain transaction patterns for typologies including layering, structuring, and mixing
- Assigns real-time risk scores to all inbound and outbound transactions
- Generates alerts for transactions meeting defined risk thresholds
- Flags unhosted wallet interactions above £1,000 for manual review

The MLRO reviews all high-risk alerts within **24 hours**. Alert disposition is documented and retained for 5 years.

## 5. Suspicious Activity Reporting (SAR)

### 5.1 Internal Reporting

All staff must report suspicions to the MLRO immediately upon identification. The **internal SAR form** must be completed with:
- Details of the suspicious activity or transaction
- Reason for suspicion with reference to specific red flags
- Any actions taken or contemplated

### 5.2 External Reporting to NCA

The MLRO will submit a **SAR to the NCA** via the online portal where there is knowledge or suspicion (or reasonable grounds for such) of money laundering or terrorist financing. The MLRO will seek a **Defence Against Money Laundering (DAML)** consent where required before proceeding with a transaction.

**Tipping-off** to the customer or third parties is strictly prohibited under POCA 2002 s.333A.

## 6. Sanctions Screening

All customers and transactions are screened in real-time against:
- **OFSI UK Consolidated List**
- **UN Security Council sanctions lists**
- **EU financial sanctions register**
- **OFAC SDN List** (for US dollar transactions)

Potential matches are escalated to the MLRO within **1 hour**. The Firm will not process transactions for sanctioned individuals or entities.

## 7. Travel Rule Compliance

In accordance with **MLR 2017, Regulation 64A** and **FATF Recommendation 16**, the Firm collects and transmits originator and beneficiary information for all crypto transfers **≥ £1,000** to other VASPs.

Where the receiving VASP cannot receive Travel Rule data, the Firm will conduct enhanced due diligence on the transaction before proceeding.

## 8. Training and Awareness

All staff complete mandatory AML/CTF training upon joining and **annually thereafter**. Training includes:
- Overview of money laundering typologies in cryptoassets
- The Firm's internal reporting procedures
- Sanctions compliance obligations
- Case studies from recent regulatory actions

Training records are maintained by HR and reviewed by the MLRO quarterly.

## 9. Record Keeping

All CDD documentation, transaction records, and SAR-related materials must be retained for a minimum of **5 years** from the end of the business relationship, in accordance with MLR 2017, Regulation 40.

## 10. Policy Review

This policy is reviewed by the MLRO **annually**, or sooner if material changes to legislation, FCA guidance, or the Firm's business model require it. Amendments are approved by the Board and communicated to all staff within 10 business days.

---

*Document Reference: AML-POL-001 | Approved by: Board of Directors | Next Review: January 2027*`,
    },
    {
      id: 'doc-002',
      name: 'KYC Procedures Manual',
      type: DocumentType.PROCEDURE,
      description: 'Detailed KYC procedures for onboarding team',
      uploadedBy: complianceOfficer.id,
      content: `# KYC/CDD Procedures Manual
## BlockChain Securities Ltd — Onboarding Team Reference

> **Reference:** [MLR 2017, Regs 28-30] [FCA Crypto Regime Ch.5] [FATF Rec.10]
> This manual provides step-by-step procedures for the onboarding team. It supplements the Group AML Policy and must be read in conjunction with it.

---

## 1. Overview of the KYC Process

The Know Your Customer (KYC) process consists of three phases:

1. **Identity Verification** — Confirming the customer is who they claim to be
2. **Risk Classification** — Determining the customer's AML/CTF risk rating
3. **Ongoing Monitoring** — Continuous review of the customer relationship

All onboarding decisions must be documented in the **CRM system** within 24 hours of completion.

## 2. Retail Customer Onboarding

### 2.1 Required Documents

| Document Type | Accepted Documents | Validity |
|---|---|---|
| Photo ID | Passport, driving licence, national ID card | Must not be expired |
| Proof of Address | Bank statement, utility bill, council tax | Within 3 months |
| Selfie / Liveness Check | Digital liveness via onboarding platform | Real-time |

### 2.2 Step-by-Step Process

1. Customer submits application via web or mobile platform
2. **Automated ID verification** runs via integrated eKYC provider — result returned in <2 minutes
3. If automated check fails, manual review is triggered within **4 business hours**
4. **Sanction screening** runs automatically at point of application
5. **PEP screening** runs automatically at point of application
6. Risk score is calculated based on: nationality, country of residence, transaction history, occupation
7. Customer is assigned to **Standard**, **Medium**, or **High** risk tier

### 2.3 Risk Tier Definitions

| Tier | Criteria | Review Frequency | Document Refresh |
|---|---|---|---|
| **Standard** | Low-risk nationality, domestic address, salaried income | Annual | Every 2 years |
| **Medium** | Mixed indicators, self-employed, ≥£20k annual volume | 6 months | Annual |
| **High** | PEP/RCA, high-risk jurisdiction, complex structure | Quarterly | 6 months |

## 3. Corporate / Institutional Onboarding

Corporate onboarding requires **additional documentation** beyond standard CDD:

- Certificate of incorporation and constitutional documents
- Register of Directors (all directors must be individually ID-verified)
- Ultimate Beneficial Ownership (UBO) register — all UBOs ≥25% shareholding
- Proof of business address
- Latest filed accounts (if available) or management accounts
- Source of funds declaration from authorised signatory

**Complex structures** (trusts, SPVs, offshore entities) require MLRO sign-off before account activation.

## 4. Enhanced Due Diligence (EDD) Triggers

EDD must be initiated automatically when any of the following are present:

- Customer is flagged as a **PEP or Relative/Close Associate (RCA)** by screening
- Customer's nationality or country of residence appears on the **FATF grey or black list**
- Source of funds cannot be adequately verified from documentary evidence
- Onboarding transaction volume exceeds **£50,000** within first 30 days
- Customer requests access to **OTC desk** services
- Customer has previously had an account **terminated for compliance reasons**

EDD requires written approval from the MLRO or Deputy MLRO before account activation.

## 5. Unhosted Wallet Interactions

Where a customer wishes to withdraw funds to an **unhosted wallet** (a wallet not associated with a regulated VASP):

1. Customer must provide the wallet address
2. Transaction Monitoring API performs a blockchain analytics check
3. Wallets associated with **high-risk typologies** (mixers, darknet markets, sanctions evasion) are blocked
4. Wallets with a risk score above **70/100** require MLRO approval before processing
5. All unhosted wallet interactions above **£1,000** are subject to Travel Rule collection procedures

## 6. Adverse Media Screening

All customers are screened against adverse media databases at:
- Point of onboarding
- Quarterly automated refresh
- Upon receipt of law enforcement or court orders

Adverse media hits are reviewed by the Compliance team within **48 hours** and escalated to the MLRO where material.

## 7. Rejected Applications

Applications rejected on AML grounds must be:
- Documented with specific reason code in the CRM
- Escalated to the MLRO for SAR consideration
- **Never communicated to the applicant** as being rejected for AML reasons (tipping-off risk)

---

*Document Reference: AML-PROC-002 | Owner: MLRO | Next Review: July 2027*`,
    },
    {
      id: 'doc-003',
      name: 'Annual AML Report 2025',
      type: DocumentType.REPORT,
      description: 'MLRO Annual Report to Board — FY2025',
      uploadedBy: complianceOfficer.id,
      content: `# MLRO Annual Report to the Board
## Financial Year 2025 — BlockChain Securities Ltd

> **Prepared by:** Sarah Chen, MLRO
> **Date:** 15 March 2026
> **Recipient:** Board of Directors
> **Classification:** Confidential — Board Only

---

## Executive Summary

This Annual Report is prepared in accordance with the requirements of **MLR 2017, Regulation 21** and covers the period **1 January 2025 to 31 December 2025**. The MLRO is satisfied that the Firm's AML/CTF framework remains broadly adequate, with the following key themes identified during the year:

1. **Travel Rule implementation** remains the primary compliance gap — remediation in progress
2. Blockchain analytics coverage has improved following Transaction Monitoring API upgrade
3. SAR volumes increased by 23% year-on-year, reflecting improved detection capability
4. Staff training completion rate reached 98% (up from 91% in 2024)

The MLRO recommends the Board approve an increased budget allocation for compliance technology in FY2026 to address the Travel Rule gap.

---

## 1. Statistical Summary

### 1.1 Customer Activity

| Metric | FY2025 | FY2024 | Change |
|---|---|---|---|
| Total active customers | 12,847 | 9,203 | +40% |
| New onboardings | 4,891 | 3,512 | +39% |
| Rejected applications (AML) | 127 | 89 | +43% |
| Accounts exited (AML grounds) | 34 | 21 | +62% |
| EDD customers (total) | 234 | 178 | +31% |

### 1.2 SAR Activity

| Metric | FY2025 | FY2024 |
|---|---|---|
| Internal SARs submitted | 312 | 254 |
| External SARs filed with NCA | 47 | 38 |
| DAML consents sought | 12 | 9 |
| DAML consents granted | 12 | 9 |
| Law enforcement requests received | 8 | 5 |

### 1.3 Transaction Monitoring

| Metric | FY2025 |
|---|---|
| Total transactions monitored | 2.4 million |
| Automated alerts generated | 8,934 |
| Alerts escalated to human review | 1,247 (14%) |
| Alerts escalated to MLRO | 312 (3.5%) |
| Transactions blocked | 89 |

## 2. Key Compliance Themes

### 2.1 Travel Rule — Ongoing Gap

The **UK Travel Rule (MLR 2017, Regulation 64A)** requires all VASP-to-VASP transfers ≥£1,000 to carry originator and beneficiary data. As at 31 December 2025, the Firm has implemented Travel Rule data collection for **outbound transfers** but is unable to receive Travel Rule data for **inbound transfers** due to technical limitations of counterparty VASPs.

**Remediation Status:** Technical solution under evaluation. Target completion Q3 2026. This remains the Firm's most significant regulatory risk.

### 2.2 Enhanced Due Diligence

EDD was conducted on **234 customers** during FY2025. Key triggers included:
- 89 PEP/RCA identifications at onboarding
- 67 high-risk jurisdiction exposures
- 48 complex corporate structures
- 30 elevated transaction volume triggers

No EDD accounts were retained where the risk could not be adequately mitigated.

### 2.3 Blockchain Analytics

Following the upgrade to the Transaction Monitoring API in Q2 2025, coverage of DeFi protocol interactions improved significantly. During the year:
- 34 wallet addresses blacklisted following blockchain analytics alerts
- 12 accounts referred to law enforcement following tracing of stolen funds
- Coverage of cross-chain bridges remains a known limitation — being addressed in Q1 2026

## 3. Staff Training

AML training was delivered to 287 staff members during FY2025. Completion rates by function:

| Function | Completion Rate |
|---|---|
| Customer Onboarding | 100% |
| Trading Operations | 97% |
| Technology & Engineering | 95% |
| Finance & Accounting | 100% |
| Senior Management | 100% |

**Overall completion rate: 98%** (target: 100% — gap relates to 6 staff on extended leave)

## 4. Regulatory Developments

The following material regulatory developments were identified and assessed during FY2025:

1. **FCA Cryptoassets Regime 2026** — Final rules published. Full implementation roadmap presented to Board in November 2025
2. **FATF Travel Rule Update** — Revised FATF guidance on unhosted wallets incorporated into procedures
3. **GENIUS Act (US)** — US stablecoin legislation assessed for impact on Firm's stablecoin handling — monitoring ongoing
4. **MiCA** — EU authorisation assessment for German operations completed; application preparation commenced

## 5. Recommendations

The MLRO makes the following recommendations to the Board:

1. **Approve Travel Rule solution budget** (estimated £180,000) for full implementation by Q3 2026
2. **Increase MLRO team headcount** by 1 FTE to support growing transaction volumes
3. **Commission proliferation finance risk assessment** — currently not formally documented
4. **Enhance cross-chain bridge monitoring** capability in Transaction Monitoring API by Q1 2026

---

*Signed: Sarah Chen, MLRO — 15 March 2026*
*Next annual report due: March 2027*`,
    },
    {
      id: 'doc-004',
      name: 'Penetration Test Report Q1 2026',
      type: DocumentType.REPORT,
      description: 'Third-party penetration testing report — CyberSec Partners Ltd',
      uploadedBy: adminUser.id,
      content: `# Penetration Test Report — Q1 2026
## BlockChain Securities Ltd | CyberSec Partners Ltd

> **Test Period:** 3–17 January 2026
> **Report Date:** 28 January 2026
> **Classification:** Confidential — Restricted Distribution
> **Reference:** CSP-2026-BSL-001

---

## Executive Summary

CyberSec Partners Ltd was engaged by BlockChain Securities Ltd to conduct an **external and internal penetration test** of its production infrastructure, customer-facing web and mobile applications, and custody management systems. Testing was conducted under a **white-box methodology** with full cooperation from the engineering team.

**Overall Risk Rating: MEDIUM**

Key findings: 2 High severity issues (both remediated during test window), 4 Medium severity, 7 Low/Informational. No critical vulnerabilities were identified in the custody infrastructure or private key management systems.

---

## 1. Scope of Testing

The following systems were in scope for this engagement:

| System | Type | Risk Classification |
|---|---|---|
| Customer web platform (app.blockchainsecurities.co.uk) | External web application | High |
| Mobile applications (iOS/Android) | Mobile application | High |
| Admin portal (internal) | Internal web application | Critical |
| Custody management system | Internal API + HSM interfaces | Critical |
| Transaction monitoring dashboard | Internal web application | High |
| Core exchange matching engine APIs | Internal API | High |
| AWS cloud infrastructure (EU-West-1) | Cloud infrastructure | High |

## 2. Findings Summary

### 2.1 High Severity

**Finding H-01: Session token not invalidated on logout (Web Platform)**

- **Description:** Session tokens remained valid for up to 2 hours after explicit logout, creating risk of session hijacking if a token was intercepted
- **Impact:** An attacker with access to a valid session token could continue accessing a customer account after the customer had logged out
- **Remediation:** Token invalidation implemented within 24 hours of finding. Verified remediated by Day 8 of test window
- **Status: RESOLVED**

**Finding H-02: Admin portal exposed on public internet without IP restriction**

- **Description:** The admin portal was accessible from any IP address with only username/password authentication, with no MFA enforced for admin users
- **Impact:** Brute-force or credential-stuffing attack against admin accounts possible without IP-based controls
- **Remediation:** IP allowlisting implemented; MFA enforced for all admin users within 48 hours
- **Status: RESOLVED**

### 2.2 Medium Severity

**Finding M-01 to M-04:** Detailed in Appendix A of the full report. Findings relate to verbose error messages, missing security headers on internal APIs (3 endpoints), and an outdated TLS 1.1 configuration on a legacy internal service (deprecated since 2021 but not yet decommissioned).

**Remediation Target:** All medium findings to be remediated by 28 February 2026.

### 2.3 Low / Informational

Seven low-severity and informational findings were identified, including configuration hardening recommendations for AWS S3 bucket policies and suggestions for enhanced logging on the custody API. Full details in Appendix B.

## 3. Custody Infrastructure Assessment

The custody management system and HSM interfaces were assessed by CyberSec's specialist custody team. **No vulnerabilities were identified** in the core custody infrastructure. Key positive findings:

- Private key material is stored exclusively in **HSM devices** (Thales Luna 7 series) — no software-based key storage identified
- **Multi-signature requirements** correctly enforced for all withdrawal transactions
- **Air-gapped signing environment** validated — no network connectivity to cold storage signing machines
- Separation of duties controls effectively prevent any single individual from authorising large withdrawals
- Audit logging of all custody operations is complete and tamper-resistant

## 4. Comparison with Previous Test (Q1 2025)

| Category | Q1 2025 | Q1 2026 | Trend |
|---|---|---|---|
| Critical findings | 1 | 0 | ✅ Improved |
| High findings | 4 | 2 | ✅ Improved |
| Medium findings | 6 | 4 | ✅ Improved |
| Low/Info findings | 12 | 7 | ✅ Improved |

The reduction in findings, particularly the elimination of critical vulnerabilities, demonstrates effective security programme maturity.

## 5. Recommendations

1. Complete remediation of all Medium findings by 28 February 2026
2. Decommission the legacy TLS 1.1 service (scheduled Q2 2026)
3. Implement automated dependency scanning in CI/CD pipeline
4. Conduct quarterly internal vulnerability assessments between annual pen tests
5. Consider CREST-accredited red team exercise in H2 2026

---

*Report prepared by: CyberSec Partners Ltd | CREST-accredited provider*
*Next annual penetration test due: January 2027*`,
    },
    {
      id: 'doc-005',
      name: 'FCA Pre-Application Meeting Notes',
      type: DocumentType.EVIDENCE,
      description: 'Notes from FCA supervisory meeting January 2026',
      uploadedBy: adminUser.id,
      content: `# FCA Pre-Application Meeting — Notes and Action Points
## BlockChain Securities Ltd | 15 January 2026

> **Meeting Type:** Pre-Application Supervisory Meeting
> **FCA Attendees:** Two FCA Authorisations Division officers (names withheld per FCA guidance)
> **Firm Attendees:** Alex Thompson (CEO), Sarah Chen (MLRO), External Legal Counsel
> **Status:** Internal Record — Privileged

---

## 1. Purpose of Meeting

This meeting was arranged at the Firm's request to discuss the upcoming FCA cryptoasset authorisation application under the **FCA Cryptoassets Regime 2026**. The FCA representatives confirmed this was an **informal supervisory engagement** and that no formal determinations were made at this stage.

The Firm presented an overview of its business model, current compliance framework, and proposed application timeline.

## 2. Key Messages from FCA

### 2.1 Application Readiness

The FCA emphasised that the quality of the application documentation is **critical to processing time**. Key areas where the FCA commonly identifies deficiencies in cryptoasset applications include:

- **Inadequate financial resources assessment** — firms must demonstrate capital adequacy commensurate with their specific cryptoasset risks, not just generic calculations
- **Incomplete AML/CTF framework** — the MLRO must be able to demonstrate that the framework is operating effectively, not just documented
- **Weak governance narrative** — SM&CR mapping must clearly demonstrate accountability chains for all regulated activities
- **Technology risk** — FCA expects detailed evidence of custody controls and cybersecurity arrangements, given the digital nature of the assets

### 2.2 Travel Rule

The FCA raised the **Travel Rule compliance gap** as a specific concern. The FCA representative noted that:
- This is an area of increasing supervisory focus for the FCA
- Applications where Travel Rule is not yet operational will receive additional scrutiny
- The Firm should be prepared to provide a detailed remediation timeline with committed milestones
- If Travel Rule is not operational by submission date, the Firm should consider whether to delay the application

**Firm response:** The MLRO confirmed that a Travel Rule solution evaluation is underway with a target implementation date of Q3 2026. The FCA representatives acknowledged this timeline as potentially acceptable if the application is submitted after implementation is complete.

### 2.3 Consumer Duty

The FCA emphasised that **Consumer Duty** is now a central pillar of the authorisation assessment for firms with retail customers. The Firm should be prepared to demonstrate:
- A completed gap analysis against FCA FG22/5
- Evidence of customer testing for communications and marketing materials
- A clear plan for how the four Consumer Duty outcomes will be delivered

### 2.4 Blockchain Analytics

The FCA noted that it expects applicants to demonstrate **operational blockchain analytics capability**, not merely a contractual arrangement. The Firm should be able to evidence:
- Real-time transaction scoring being used in operational decisions
- Staff trained to interpret blockchain analytics outputs
- Integration with the transaction monitoring workflow

## 3. Action Points

| # | Action | Owner | Target Date |
|---|---|---|---|
| 1 | Prepare detailed Travel Rule implementation timeline with committed milestones | MLRO | 28 February 2026 |
| 2 | Commission Consumer Duty gap analysis against FCA FG22/5 | MLRO | 31 March 2026 |
| 3 | Draft capital adequacy methodology document for review | CFO | 31 March 2026 |
| 4 | Compile evidence pack for blockchain analytics operational use | CTO | 28 February 2026 |
| 5 | Review and update SM&CR Statements of Responsibilities | CEO/General Counsel | 28 February 2026 |

## 4. Next Steps

The FCA representatives indicated that the Firm should submit its application once the Travel Rule gap is remediated. A follow-up meeting will be arranged in Q3 2026 to review application readiness.

External legal counsel confirmed that a **Form A application** will be required for the cryptoasset activities, submitted via FCA Connect. The application should include all supporting documents as a single package to avoid processing delays.

---

*Notes prepared by: External Legal Counsel | Reviewed by: Alex Thompson, CEO*
*These notes are an internal record only and do not constitute an FCA communication or determination.*`,
    },
    {
      id: 'doc-006',
      name: 'Board Governance Charter',
      type: DocumentType.POLICY,
      description: 'Board terms of reference and governance framework',
      uploadedBy: adminUser.id,
      content: `# Board Governance Charter
## BlockChain Securities Ltd

> **Adopted by:** Board of Directors
> **Effective Date:** 1 April 2026
> **Reference:** [SYSC 4.1] [SMCR] [FCA DEPP] [UK Corporate Governance Code]

---

## 1. Purpose

This Charter establishes the governance framework for the Board of Directors of BlockChain Securities Ltd (**"the Company"**). It defines the role, composition, responsibilities, and operating procedures of the Board in accordance with **FCA SYSC 4.1** requirements and the principles of good corporate governance.

## 2. Board Composition

### 2.1 Membership

The Board shall consist of a minimum of five directors:
- **Chief Executive Officer (CEO)** — Senior Manager Function (SMF1)
- **Chief Financial Officer (CFO)** — Senior Manager Function (SMF2)
- **Chief Risk Officer (CRO)** — Senior Manager Function (SMF4)
- **Non-Executive Chair** — Senior Manager Function (SMF9)
- **Senior Independent Director (SID)** — Non-Executive

At least **50% of Board members** (excluding the Chair) shall be independent Non-Executive Directors (NEDs).

### 2.2 FCA SM&CR Mapping

| Role | SMF | Prescribed Responsibility |
|---|---|---|
| CEO | SMF1 | Overall strategy and performance |
| CFO | SMF2 | Financial management and reporting |
| CRO | SMF4 | Risk management framework |
| Chair | SMF9 | Board leadership and governance |
| MLRO | SMF17 | AML/CTF compliance |
| Head of Compliance | SMF16 | Regulatory compliance |

## 3. Board Responsibilities

### 3.1 Core Responsibilities

The Board is collectively responsible for:

1. Setting and overseeing the **strategic direction** of the Company
2. Approving the **risk appetite** and overseeing the risk management framework
3. Approving the **annual budget** and monitoring financial performance
4. Ensuring **adequate internal controls** and compliance systems are in place
5. Overseeing the Company's **FCA authorisation** obligations and relationship with the regulator
6. Approving all **material policies** including the AML Policy, Risk Appetite Statement, and Remuneration Policy
7. Oversight of **SM&CR** implementation and certification regime

### 3.2 Matters Reserved for the Board

The following matters require Board approval and may not be delegated:
- Approval of annual accounts and interim financial statements
- Major capital expenditure exceeding £500,000
- Acquisitions, disposals, and strategic partnerships above materiality thresholds
- Appointment and removal of Senior Managers
- Approval of the firm's wind-down plan
- Material changes to the FCA application and regulatory permissions

## 4. Board Committees

### 4.1 Audit & Risk Committee

- **Chair:** Senior Independent Director
- **Members:** Two NEDs and CFO (non-voting)
- **Frequency:** Quarterly
- **Responsibilities:** Internal audit, external audit, risk management framework, internal controls

### 4.2 Compliance Committee

- **Chair:** Head of Compliance / MLRO
- **Members:** CEO, CRO, Head of Technology
- **Frequency:** Monthly
- **Responsibilities:** Regulatory change, compliance monitoring results, FCA application progress

### 4.3 Remuneration Committee

- **Chair:** NED
- **Members:** Two NEDs and CEO (advisory)
- **Frequency:** At least annually
- **Responsibilities:** Remuneration policy, senior management pay, malus/clawback provisions

## 5. Meeting Procedures

### 5.1 Frequency

The full Board shall meet at least **six times per year**, including at least one meeting dedicated to strategy. Additional meetings may be called by the Chair or CEO with 5 days' notice, or 24 hours' notice in an emergency.

### 5.2 Quorum

Quorum is constituted by a majority of Board members including at least one Non-Executive Director.

### 5.3 Information

Board papers shall be circulated at least **5 business days** before each meeting. The Company Secretary is responsible for ensuring papers are complete and informative. Directors may request additional information from management at any time.

## 6. Conflicts of Interest

Directors must declare actual or potential conflicts of interest to the Board at the earliest opportunity. The conflicted director will be excluded from any related discussion or vote. A **Conflicts of Interest Register** is maintained by the Company Secretary and reviewed annually.

---

*Document Reference: GOV-POL-001 | Version: 2.0 | Next Review: April 2027*`,
    },
    {
      id: 'doc-007',
      name: 'ISO 27001 Certificate',
      type: DocumentType.CERTIFICATE,
      description: 'ISO 27001:2022 certification — expires December 2026',
      uploadedBy: adminUser.id,
      content: `# ISO 27001:2022 Certification
## Certificate of Registration

> **Certification Body:** BSI Group (British Standards Institution)
> **Certificate Number:** IS 756432
> **Standard:** ISO/IEC 27001:2022 — Information Security Management Systems

---

## Certification Details

This is to certify that the Information Security Management System (ISMS) of:

**BlockChain Securities Ltd**
Suite 14, 200 Aldersgate Street, London EC1A 4HD, United Kingdom

has been assessed and found to conform to the requirements of:

**ISO/IEC 27001:2022**
*Information technology — Security techniques — Information security management systems — Requirements*

### Scope of Certification

The scope of this certification covers:

> The design, development, operation, and management of cryptoasset exchange, custody, OTC trading, and ancillary services provided via BlockChain Securities Ltd's technology platforms, including cloud infrastructure (AWS EU-West-1), customer-facing web and mobile applications, and internal systems used for compliance monitoring, transaction processing, and client asset management.

### Validity Period

| | |
|---|---|
| **Certificate Issue Date:** | 15 December 2024 |
| **Certificate Expiry Date:** | 14 December 2026 |
| **Surveillance Audit 1:** | December 2025 — Passed with zero major non-conformities |
| **Recertification Due:** | December 2026 |

---

## Key Control Areas Assessed

The certification assessment covered the following Annex A control domains:

| Control Domain | Controls Implemented | Finding |
|---|---|---|
| A.5 Organisational controls | 37/37 | Conforming |
| A.6 People controls | 8/8 | Conforming |
| A.7 Physical controls | 14/14 | Conforming |
| A.8 Technological controls | 34/34 | Conforming — 2 opportunities for improvement noted |

### Highlights from Surveillance Audit (December 2025)

The surveillance audit conducted in December 2025 found the ISMS to be **operating effectively**. Auditor observations included:

1. **Incident management process** is well-documented and tested — 4 tabletop exercises conducted during the certification period
2. **Access management controls** are robust, with MFA enforced across all critical systems
3. **Supplier management** programme has improved since initial certification — all critical suppliers now subject to annual security assessments
4. **Business continuity plans** were tested in Q3 2025 with successful recovery within defined RTO/RPO targets

**Opportunities for improvement (not non-conformities):**
- Formalise the internal vulnerability scanning schedule with documented review process
- Enhance cryptoasset-specific controls documentation to reference FCA operational resilience requirements

---

## Regulatory Significance

This certification supports the Firm's obligations under:
- **FCA SYSC 8** (Technology risk management)
- **FCA Operational Resilience Policy** (PS21/3)
- **UK GDPR / Data Protection Act 2018** (Article 32 — Security of processing)
- **FCA Cryptoassets Regime 2026** (Technology and cyber controls requirements)

The ISO 27001 certification is referenced in the Firm's FCA authorisation application as evidence of its information security management framework.

---

*Certificate No.: IS 756432 | BSI Group | www.bsigroup.com*
*Verify at: www.bsigroup.com/our-services/certification/certificate-and-client-directory*`,
    },
    {
      id: 'doc-008',
      name: 'Consumer Duty Implementation Plan',
      type: DocumentType.PROCEDURE,
      description: 'Board-approved Consumer Duty implementation roadmap',
      uploadedBy: complianceOfficer.id,
      content: `# Consumer Duty Implementation Plan
## BlockChain Securities Ltd | FCA Consumer Duty (PS22/9)

> **Reference:** [FCA PS22/9] [FCA FG22/5 — Final non-Handbook Guidance] [PRIN 6] [COBS 4] [FCA PS23/6]
> **Board Approved:** 1 February 2026 | **Target Completion:** 30 September 2026

---

## 1. Executive Summary

This document sets out BlockChain Securities Ltd's implementation plan for complying with the **FCA Consumer Duty** (PS22/9) across all retail-facing cryptoasset services. The Consumer Duty came into force for new and existing products and services on 31 July 2023, and the Firm is committed to achieving full compliance ahead of its FCA authorisation application.

The Firm has conducted a **gap analysis** against FCA FG22/5 (Final Guidance) and identified the following priority workstreams:

| Workstream | Priority | Target Date | Status |
|---|---|---|---|
| Products & Services outcome | HIGH | 30 June 2026 | In Progress |
| Price & Value outcome | HIGH | 30 June 2026 | In Progress |
| Consumer Understanding outcome | MEDIUM | 31 July 2026 | Not Started |
| Consumer Support outcome | MEDIUM | 31 August 2026 | Not Started |
| Governance & MI | HIGH | 31 May 2026 | In Progress |

---

## 2. The Four Consumer Duty Outcomes

### 2.1 Products and Services Outcome

**FCA Requirement [FCA PS22/9, PRIN 2A.3]:** Firms must ensure their products and services are designed to meet the needs of a defined target market and do not cause foreseeable harm.

**Current Position:**
- Target market definitions exist but have not been formally reviewed against Consumer Duty standards
- Product approval process does not yet include explicit Consumer Duty assessment
- No formal assessment of whether products meet needs of vulnerable customers

**Planned Actions:**
1. Conduct target market review for all retail products (exchange, staking, custody) — **May 2026**
2. Update product approval process to include Consumer Duty impact assessment — **June 2026**
3. Introduce vulnerable customer identification framework — **June 2026**
4. Document and Board-approve product and service assessments — **June 2026**

### 2.2 Price and Value Outcome

**FCA Requirement [FCA PS22/9, PRIN 2A.4]:** Firms must ensure the price customers pay represents fair value, taking into account benefits provided and costs incurred.

**Current Position:**
- Trading fees are published transparently on the Firm's website
- No formal value assessment has been conducted comparing fee levels to market comparators or customer outcomes
- FX spread on fiat-to-crypto conversions not clearly communicated at point of transaction

**Planned Actions:**
1. Commission price and value assessment across all fee types — **April 2026**
2. Benchmark fees against comparable regulated cryptoasset providers — **May 2026**
3. Improve FX spread disclosure — clear breakdown at point of transaction — **June 2026**
4. Establish annual price and value review process — **June 2026**

### 2.3 Consumer Understanding Outcome

**FCA Requirement [FCA PS22/9, PRIN 2A.5]:** Firms must ensure communications are clear, fair, and not misleading, enabling customers to make informed decisions.

**Current Position:**
- Marketing materials reviewed under COBS 4 but not specifically assessed for Consumer Duty
- FCA PS23/6 risk warnings implemented on website and in onboarding flow
- Appropriateness assessments conducted but not recently reviewed against FCA FG22/5 standards
- No evidence of customer comprehension testing for communications

**Planned Actions:**
1. Review all customer-facing communications against Consumer Understanding outcome — **July 2026**
2. Conduct customer comprehension testing for key communications (risk warnings, T&Cs, product descriptions) — **July 2026**
3. Refresh appropriateness test against FCA FG22/5 — **July 2026**
4. Implement 24-hour cooling-off period for first-time investors (already in place — verify compliance) — **May 2026**

### 2.4 Consumer Support Outcome

**FCA Requirement [FCA PS22/9, PRIN 2A.6]:** Firms must provide support that meets customers' needs across the product lifecycle.

**Current Position:**
- Customer support operates 9am–6pm weekdays only — FCA expects 24/7 availability for digital asset services given global market hours
- Complaints handling meets DISP requirements but has not been assessed for Consumer Duty
- No specific process for identifying and supporting vulnerable customers in complaints handling

**Planned Actions:**
1. Extend customer support hours to 24/5 (weekdays 24-hour coverage) — **August 2026**
2. Train customer support team on vulnerable customer identification and enhanced support — **August 2026**
3. Review complaints process for Consumer Duty alignment — **August 2026**
4. Implement FOS referral communication at point of complaint (currently at 8-week stage only) — **September 2026**

---

## 3. Risk Warnings — FCA PS23/6

The FCA introduced specific cryptoasset risk warning requirements in **PS23/6** (effective October 2023). The Firm has implemented the following:

**Mandatory Risk Warning (implemented October 2023):**
> *"Don't invest unless you're prepared to lose all the money you invest. This is a high-risk investment and you are unlikely to be protected if something goes wrong. Take 2 mins to learn more."*

**Implementation Status:**
- ✅ Risk warning displayed on homepage and product landing pages
- ✅ Risk warning displayed in onboarding flow before account creation
- ✅ Risk warning displayed at point of first investment
- ✅ 24-hour cooling-off for first-time investors
- ⚠️ Risk warning on mobile app requires visual design update to meet FCA prominence requirements

---

## 4. Governance and Management Information

To evidence Consumer Duty compliance, the Firm will establish:

1. **Consumer Duty Board Champion** — designated Board member responsible for Consumer Duty oversight (appointed: CFO, effective April 2026)
2. **Consumer Duty MI Dashboard** — monthly reporting to Board including customer outcome metrics, complaint root cause analysis, and vulnerable customer data
3. **Annual Consumer Duty Board Report** — first report due September 2026 covering outcomes achieved and gaps
4. **Consumer Duty Assessment** — documented assessment of each product/service against all four outcomes, reviewed annually

---

*Document Reference: CP-PROC-001 | Owner: MLRO/Head of Compliance | Board Approved: 1 February 2026*`,
    },
  ]

  for (const doc of documents) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: { content: doc.content },
      create: { ...doc, organisationId: org.id },
    })
  }

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const alerts = [
    { id: 'alert-001', type: AlertType.REGULATORY_CHANGE, title: 'FCA Crypto 2026 Final Rules Published', message: 'FCA has published final rules for the UK cryptoasset regime. Full implementation required by Q1 2026. Review your controls against PS24/1.', severity: RiskLevel.HIGH },
    { id: 'alert-002', type: AlertType.REGULATORY_CHANGE, title: 'FATF Travel Rule Update — UK Implementation', message: 'Updated UK Travel Rule guidance published. VASP-to-VASP transfers above £1,000 threshold effective from October 2025.', severity: RiskLevel.HIGH },
    { id: 'alert-003', type: AlertType.OVERDUE_ACTION, title: 'Travel Rule Compliance Overdue', message: 'Control AML-005 (Travel Rule Compliance) was due for remediation in Q1 2024. Current status: Non-Compliant. Immediate action required.', severity: RiskLevel.CRITICAL },
    { id: 'alert-004', type: AlertType.UPCOMING_REVIEW, title: 'Transaction Monitoring System Review Due', message: 'Quarterly review of transaction monitoring system due in 14 days. Ensure rule parameters are updated for new coin types.', severity: RiskLevel.MEDIUM },
    { id: 'alert-005', type: AlertType.REGULATORY_CHANGE, title: 'MiCA Passporting Requirements', message: 'EU MiCA passporting provisions now in effect. If you serve EU customers, review your CASP authorisation requirements.', severity: RiskLevel.MEDIUM },
    { id: 'alert-006', type: AlertType.UPCOMING_REVIEW, title: 'SM&CR Certification Window Opening', message: 'Annual SM&CR certification window opens in 30 days. Ensure all Certified Persons are assessed and records updated.', severity: RiskLevel.MEDIUM },
    { id: 'alert-007', type: AlertType.OVERDUE_ACTION, title: 'Proliferation Finance Risk Assessment Outstanding', message: 'Control FC-002 (Proliferation Finance Controls) has not been assessed. FATF updated guidance requires dedicated PF risk assessment.', severity: RiskLevel.HIGH },
  ]

  for (const alert of alerts) {
    await prisma.alert.upsert({
      where: { id: alert.id },
      update: {},
      create: { ...alert, organisationId: org.id },
    })
  }

  // ─── Action Items ─────────────────────────────────────────────────────────
  const actions = [
    { id: 'action-001', title: 'Implement Travel Rule Solution', description: 'Evaluate and implement a FATF Travel Rule solution (consider Notabene, Sygna, or TRISA) for VASP-to-VASP transfers. Complete technical integration and testing.', status: 'IN_PROGRESS', priority: RiskLevel.CRITICAL, dueDate: new Date('2026-07-31'), ownerId: complianceOfficer.id, controlRef: 'AML-005' },
    { id: 'action-002', title: 'Complete SM&CR Certification', description: 'Complete outstanding SM&CR Certification for 3 remaining Certified Persons. Update Conduct Rules training records.', status: 'IN_PROGRESS', priority: RiskLevel.HIGH, dueDate: new Date('2026-06-30'), ownerId: adminUser.id, controlRef: 'GOV-002' },
    { id: 'action-003', title: 'Proliferation Finance Risk Assessment', description: 'Conduct dedicated proliferation finance risk assessment per FATF guidance and FCA expectations. Document findings and controls.', status: 'OPEN', priority: RiskLevel.HIGH, dueDate: new Date('2026-07-15'), ownerId: complianceOfficer.id, controlRef: 'FC-002' },
    { id: 'action-004', title: 'Upgrade Blockchain Analytics Capability', description: 'Expand Transaction Monitoring API integration to cover DeFi protocol tracing. Enable real-time risk scoring for all inbound transactions.', status: 'IN_PROGRESS', priority: RiskLevel.MEDIUM, dueDate: new Date('2026-08-31'), ownerId: riskManager.id, controlRef: 'AML-008' },
    { id: 'action-005', title: 'Consumer Duty Gap Analysis', description: 'Conduct Consumer Duty gap analysis against FCA guidance FG22/5. Identify and prioritise remediation items.', status: 'OPEN', priority: RiskLevel.HIGH, dueDate: new Date('2026-06-15'), ownerId: complianceOfficer.id, controlRef: 'CP-001' },
    { id: 'action-006', title: 'Custody Insurance Review', description: 'Engage broker to review custody insurance coverage adequacy. Obtain quotes for increased cold storage and crime coverage.', status: 'OPEN', priority: RiskLevel.MEDIUM, dueDate: new Date('2026-07-01'), ownerId: riskManager.id, controlRef: 'CUST-004' },
    { id: 'action-007', title: 'Wind-Down Plan Finalisation', description: 'Finalise wind-down plan with treasury team. Ensure plan covers cryptoasset liquidation scenarios and client notification procedures.', status: 'OPEN', priority: RiskLevel.MEDIUM, dueDate: new Date('2026-08-01'), ownerId: adminUser.id, controlRef: 'FIN-003' },
    { id: 'action-008', title: 'Annual Penetration Test', description: 'Commission annual penetration test with FCA-approved provider. Scope to include new DeFi integrations and mobile app.', status: 'OPEN', priority: RiskLevel.MEDIUM, dueDate: new Date('2026-09-30'), ownerId: adminUser.id, controlRef: 'TECH-003' },
  ]

  for (const action of actions) {
    await prisma.actionItem.upsert({
      where: { id: action.id },
      update: {},
      create: { ...action, organisationId: org.id },
    })
  }

  // ─── Risk Register ────────────────────────────────────────────────────────
  const risks = [
    { id: 'risk-001', title: 'Travel Rule Non-Compliance', description: 'Failure to implement Travel Rule by FCA deadline could result in regulatory enforcement action and reputational damage.', category: 'Regulatory', likelihood: 3, impact: 5, riskScore: 15, riskLevel: RiskLevel.CRITICAL, mitigationPlan: 'Travel Rule solution being evaluated. Target implementation Q3 2026.', status: 'OPEN', owner: 'Sarah Chen' },
    { id: 'risk-002', title: 'Cyber Attack on Hot Wallet', description: 'Sophisticated cyber attack targeting hot wallet infrastructure could result in loss of client cryptoassets.', category: 'Technology', likelihood: 2, impact: 5, riskScore: 10, riskLevel: RiskLevel.HIGH, mitigationPlan: 'Multi-sig, MFA, and 95% cold storage policy in place. Annual pen testing programme.', status: 'OPEN', owner: 'Alex Thompson' },
    { id: 'risk-003', title: 'Regulatory Enforcement Action', description: 'FCA enforcement action arising from AML/CTF deficiencies identified during supervisory visit.', category: 'Regulatory', likelihood: 2, impact: 4, riskScore: 8, riskLevel: RiskLevel.HIGH, mitigationPlan: 'Enhanced AML programme implemented. MLRO appointed. Ongoing compliance monitoring.', status: 'OPEN', owner: 'Sarah Chen' },
    { id: 'risk-004', title: 'Key Person Dependency - MLRO', description: 'Over-reliance on single MLRO with limited deputy coverage creating operational risk.', category: 'Operational', likelihood: 3, impact: 3, riskScore: 9, riskLevel: RiskLevel.MEDIUM, mitigationPlan: 'Deputy MLRO appointment in progress. Knowledge transfer documentation underway.', status: 'IN_PROGRESS', owner: 'James Okafor' },
    { id: 'risk-005', title: 'Stablecoin De-peg Scenario', description: 'Major stablecoin de-peg event creating liquidity crisis and potential client asset shortfall.', category: 'Market', likelihood: 2, impact: 4, riskScore: 8, riskLevel: RiskLevel.HIGH, mitigationPlan: 'Stablecoin concentration limits implemented. Liquidity buffer maintained in fiat.', status: 'OPEN', owner: 'James Okafor' },
    { id: 'risk-006', title: 'Smart Contract Exploit', description: 'Vulnerability in integrated DeFi smart contracts leading to loss of funds or client data compromise.', category: 'Technology', likelihood: 2, impact: 4, riskScore: 8, riskLevel: RiskLevel.HIGH, mitigationPlan: 'Smart contract audit programme being established. DeFi integration limits in place.', status: 'OPEN', owner: 'Alex Thompson' },
  ]

  for (const risk of risks) {
    await prisma.riskRegister.upsert({
      where: { id: risk.id },
      update: {},
      create: { ...risk, organisationId: org.id },
    })
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  const now = new Date()
  const auditEntries = [
    { action: 'CONTROL_STATUS_UPDATE', entityType: 'ComplianceControl', entityId: 'ctrl-003', newValues: { status: 'PARTIALLY_COMPLIANT' }, userId: complianceOfficer.id },
    { action: 'STAGE_STATUS_UPDATE', entityType: 'FCAApplicationStage', entityId: 'stage-3', newValues: { status: 'COMPLETE' }, userId: adminUser.id },
    { action: 'DOCUMENT_UPLOAD', entityType: 'Document', entityId: 'doc-004', newValues: { name: 'Penetration Test Report Q1 2024' }, userId: adminUser.id },
    { action: 'ALERT_CREATED', entityType: 'Alert', entityId: 'alert-001', newValues: { title: 'FCA Crypto 2026 Final Rules Published' }, userId: null },
    { action: 'CONTROL_STATUS_UPDATE', entityType: 'ComplianceControl', entityId: 'ctrl-005', newValues: { status: 'NON_COMPLIANT' }, userId: complianceOfficer.id },
    { action: 'ACTION_CREATED', entityType: 'ActionItem', entityId: 'action-001', newValues: { title: 'Implement Travel Rule Solution' }, userId: complianceOfficer.id },
    { action: 'USER_LOGIN', entityType: 'User', entityId: adminUser.id, newValues: { email: 'admin@demo.com' }, userId: adminUser.id },
  ]

  for (let i = 0; i < auditEntries.length; i++) {
    const entry = auditEntries[i]
    const createdAt = new Date(now.getTime() - (auditEntries.length - i) * 3600000)
    await prisma.auditLog.upsert({
      where: { id: `audit-${i}` },
      update: {},
      create: {
        id: `audit-${i}`,
        ...entry,
        organisationId: org.id,
        createdAt,
      },
    })
  }

  console.log('✅ Seed complete!')
  console.log('─────────────────────────────────')
  console.log('Demo login: admin@demo.com / Demo2024!')
  console.log('─────────────────────────────────')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
