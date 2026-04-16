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
    { id: 'ctrl-008', controlRef: 'AML-008', name: 'Blockchain Analytics Integration', description: 'Integration with blockchain analytics tools (e.g., Chainalysis, Elliptic) for cryptoasset tracing and risk scoring.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2025-09-15'), nextReviewDate: new Date('2026-09-15') },
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
      targetDate: new Date('2024-06-30'),
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
      targetDate: new Date('2024-07-31'),
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
      targetDate: new Date('2024-08-31'),
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
      targetDate: new Date('2024-10-31'),
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

  for (const stageData of stages) {
    const { requirements, ...stageFields } = stageData
    const stage = await prisma.fCAApplicationStage.upsert({
      where: { id: stageFields.id },
      update: { status: stageFields.status },
      create: { ...stageFields, organisationId: org.id },
    })

    for (let i = 0; i < requirements.length; i++) {
      await prisma.stageRequirement.upsert({
        where: { id: `req-${stageFields.id}-${i}` },
        update: { status: requirements[i].status },
        create: {
          id: `req-${stageFields.id}-${i}`,
          stageId: stage.id,
          title: requirements[i].title,
          status: requirements[i].status,
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

  for (const entry of mapEntries) {
    const { id, ...rest } = entry
    await prisma.complianceMapEntry.upsert({
      where: { id },
      update: {},
      create: { id, organisationId: org.id, ...rest },
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
    { id: 'doc-001', name: 'AML Policy v3.2', type: DocumentType.POLICY, description: 'Group AML/CTF Policy covering all business lines', uploadedBy: complianceOfficer.id },
    { id: 'doc-002', name: 'KYC Procedures Manual', type: DocumentType.PROCEDURE, description: 'Detailed KYC procedures for onboarding team', uploadedBy: complianceOfficer.id },
    { id: 'doc-003', name: 'Annual AML Report 2023', type: DocumentType.REPORT, description: 'MLRO Annual Report to Board — FY2023', uploadedBy: complianceOfficer.id },
    { id: 'doc-004', name: 'Penetration Test Report Q1 2024', type: DocumentType.REPORT, description: 'Third-party penetration testing report — CyberSec Partners Ltd', uploadedBy: adminUser.id },
    { id: 'doc-005', name: 'FCA Pre-Application Meeting Notes', type: DocumentType.EVIDENCE, description: 'Notes from FCA supervisory meeting January 2024', uploadedBy: adminUser.id },
    { id: 'doc-006', name: 'Board Governance Charter', type: DocumentType.POLICY, description: 'Board terms of reference and governance framework', uploadedBy: adminUser.id },
    { id: 'doc-007', name: 'ISO 27001 Certificate', type: DocumentType.CERTIFICATE, description: 'ISO 27001:2022 certification — expires December 2025', uploadedBy: adminUser.id },
    { id: 'doc-008', name: 'Consumer Duty Implementation Plan', type: DocumentType.PROCEDURE, description: 'Board-approved Consumer Duty implementation roadmap', uploadedBy: complianceOfficer.id },
  ]

  for (const doc of documents) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: {},
      create: { ...doc, organisationId: org.id },
    })
  }

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const alerts = [
    { id: 'alert-001', type: AlertType.REGULATORY_CHANGE, title: 'FCA Crypto 2026 Final Rules Published', message: 'FCA has published final rules for the UK cryptoasset regime. Full implementation required by Q1 2026. Review your controls against PS24/1.', severity: RiskLevel.HIGH },
    { id: 'alert-002', type: AlertType.REGULATORY_CHANGE, title: 'FATF Travel Rule Update — UK Implementation', message: 'Updated UK Travel Rule guidance published. VASP-to-VASP transfers above £1,000 threshold effective from October 2024.', severity: RiskLevel.HIGH },
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
    { id: 'action-004', title: 'Upgrade Blockchain Analytics Capability', description: 'Expand Chainalysis integration to cover DeFi protocol tracing. Enable real-time scoring for all inbound transactions.', status: 'IN_PROGRESS', priority: RiskLevel.MEDIUM, dueDate: new Date('2026-08-31'), ownerId: riskManager.id, controlRef: 'AML-008' },
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
    { id: 'risk-001', title: 'Travel Rule Non-Compliance', description: 'Failure to implement Travel Rule by FCA deadline could result in regulatory enforcement action and reputational damage.', category: 'Regulatory', likelihood: 3, impact: 5, riskScore: 15, riskLevel: RiskLevel.CRITICAL, mitigationPlan: 'Travel Rule solution being evaluated. Target implementation Q3 2024.', status: 'OPEN', owner: 'Sarah Chen' },
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
