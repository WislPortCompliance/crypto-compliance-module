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
    { id: 'ctrl-001', controlRef: 'AML-001', name: 'Customer Due Diligence (CDD) Policy', description: 'Documented CDD policy covering standard, simplified, and enhanced due diligence procedures for all customer types.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-15'), nextReviewDate: new Date('2025-01-15') },
    { id: 'ctrl-002', controlRef: 'AML-002', name: 'Enhanced Due Diligence (EDD) Procedures', description: 'Documented EDD procedures for high-risk customers including PEPs, high-risk countries, and complex structures.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-15'), nextReviewDate: new Date('2025-01-15') },
    { id: 'ctrl-003', controlRef: 'AML-003', name: 'Transaction Monitoring System', description: 'Automated transaction monitoring system capable of detecting suspicious patterns including mixing, layering, and structuring.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-02-20'), nextReviewDate: new Date('2025-02-20') },
    { id: 'ctrl-004', controlRef: 'AML-004', name: 'Suspicious Activity Reporting (SAR)', description: 'Procedures for identifying, escalating, and reporting suspicious activity to the National Crime Agency (NCA).', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p1', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-20'), nextReviewDate: new Date('2025-01-20') },
    { id: 'ctrl-005', controlRef: 'AML-005', name: 'Travel Rule Compliance', description: 'FATF Travel Rule implementation for crypto transactions above threshold — collecting and transmitting originator/beneficiary information.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.NON_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-03-01'), nextReviewDate: new Date('2024-09-01') },
    { id: 'ctrl-006', controlRef: 'AML-006', name: 'Sanctions Screening', description: 'Real-time sanctions screening against OFSI, OFAC, UN, and EU sanctions lists for all customers and transactions.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p1', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-02-01'), nextReviewDate: new Date('2025-02-01') },
    { id: 'ctrl-007', controlRef: 'AML-007', name: 'Politically Exposed Persons (PEP) Screening', description: 'PEP screening at onboarding and ongoing for all customers, with enhanced monitoring for identified PEPs.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-15'), nextReviewDate: new Date('2025-01-15') },
    { id: 'ctrl-008', controlRef: 'AML-008', name: 'Blockchain Analytics Integration', description: 'Integration with specialist blockchain analytics and transaction monitoring tools for cryptoasset tracing, wallet risk scoring, and suspicious activity detection.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-03-15'), nextReviewDate: new Date('2024-09-15') },
    { id: 'ctrl-009', controlRef: 'AML-009', name: 'AML Risk Assessment', description: 'Firm-wide AML/CTF risk assessment covering products, customers, geographies, delivery channels, and cryptoasset-specific risks.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-01-10'), nextReviewDate: new Date('2025-01-10') },
    { id: 'ctrl-010', controlRef: 'AML-010', name: 'AML Training Programme', description: 'Mandatory AML training for all staff with role-specific modules and annual refreshers. Records maintained.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p2', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-30'), nextReviewDate: new Date('2025-01-30') },
    // Governance Controls
    { id: 'ctrl-011', controlRef: 'GOV-001', name: 'Board Governance Framework', description: 'Documented governance framework including board composition, responsibilities, committee structures, and decision-making authorities.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-01-05'), nextReviewDate: new Date('2025-01-05') },
    { id: 'ctrl-012', controlRef: 'GOV-002', name: 'Senior Managers & Certification Regime (SM&CR)', description: 'Full SM&CR implementation including Senior Manager Function mapping, Statements of Responsibilities, and Certification regime.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-02-15'), nextReviewDate: new Date('2024-08-15') },
    { id: 'ctrl-013', controlRef: 'GOV-003', name: 'Compliance Monitoring Programme', description: 'Annual compliance monitoring programme covering all regulatory obligations with risk-based testing schedule.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-08'), nextReviewDate: new Date('2025-01-08') },
    { id: 'ctrl-014', controlRef: 'GOV-004', name: 'Regulatory Reporting Framework', description: 'Processes for timely and accurate submission of all FCA regulatory reports including REP-CRIM, annual AML reports.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p11', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-02-01'), nextReviewDate: new Date('2025-02-01') },
    { id: 'ctrl-015', controlRef: 'GOV-005', name: 'Conflicts of Interest Policy', description: 'Policy identifying, managing, and disclosing conflicts of interest including crypto-specific conflicts (proprietary trading, market making).', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p8', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-01-20'), nextReviewDate: new Date('2025-01-20') },
    { id: 'ctrl-016', controlRef: 'GOV-006', name: 'Whistleblowing Framework', description: 'FCA-compliant whistleblowing policy with designated whistleblowing champion and protected disclosure procedures.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p1', status: ControlStatus.NOT_ASSESSED, ownerId: adminUser.id, lastReviewed: null, nextReviewDate: new Date('2024-07-01') },
    // Consumer Protection Controls
    { id: 'ctrl-017', controlRef: 'CP-001', name: 'Consumer Duty Implementation', description: 'FCA Consumer Duty implementation plan covering four outcomes: products/services, price/value, understanding, support.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p6', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-03-01'), nextReviewDate: new Date('2024-09-01') },
    { id: 'ctrl-018', controlRef: 'CP-002', name: 'Risk Warnings & Disclosures', description: 'FCA-compliant risk warnings for cryptoassets prominently displayed in all customer-facing materials and at point of investment.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p7', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-25'), nextReviewDate: new Date('2025-01-25') },
    { id: 'ctrl-019', controlRef: 'CP-003', name: 'Client Categorisation', description: 'Procedures for correctly categorising clients as Retail, Professional, or Eligible Counterparty with appropriateness assessments.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p9', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-02-10'), nextReviewDate: new Date('2025-02-10') },
    { id: 'ctrl-020', controlRef: 'CP-004', name: 'Complaints Handling Procedure', description: 'FCA-compliant complaints handling procedure with 8-week resolution target, FOS referral rights, and root cause analysis.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p6', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-15'), nextReviewDate: new Date('2025-01-15') },
    { id: 'ctrl-021', controlRef: 'CP-005', name: 'Cooling-off Period Implementation', description: '24-hour cooling-off period for first-time cryptoasset purchases per FCA PS23/6 requirements.', categoryId: 'cat-cp', fcaPrincipleId: 'fca-p6', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-02-20'), nextReviewDate: new Date('2025-02-20') },
    // Custody Controls
    { id: 'ctrl-022', controlRef: 'CUST-001', name: 'Client Asset Segregation', description: 'Strict segregation of client cryptoassets from firm assets with daily reconciliation and independent verification.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p10', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-01-20'), nextReviewDate: new Date('2025-01-20') },
    { id: 'ctrl-023', controlRef: 'CUST-002', name: 'Cold Storage Policy', description: 'Policy requiring minimum 95% of client cryptoassets held in cold/offline storage with documented key management procedures.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p10', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-01-20'), nextReviewDate: new Date('2025-01-20') },
    { id: 'ctrl-024', controlRef: 'CUST-003', name: 'Private Key Management', description: 'Documented private key management procedures including multi-sig, key ceremony processes, and hardware security modules.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p10', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-03-10'), nextReviewDate: new Date('2024-09-10') },
    { id: 'ctrl-025', controlRef: 'CUST-004', name: 'Custody Insurance', description: 'Insurance coverage for cryptoassets in custody including hot wallet coverage and crime insurance.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p4', status: ControlStatus.NOT_ASSESSED, ownerId: riskManager.id, lastReviewed: null, nextReviewDate: new Date('2024-06-01') },
    { id: 'ctrl-026', controlRef: 'CUST-005', name: 'Third-Party Custodian Due Diligence', description: 'Due diligence framework for selecting, appointing, and monitoring third-party sub-custodians.', categoryId: 'cat-cust', fcaPrincipleId: 'fca-p10', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-02-01'), nextReviewDate: new Date('2025-02-01') },
    // Technology & Cyber Controls
    { id: 'ctrl-027', controlRef: 'TECH-001', name: 'Information Security Policy', description: 'ISO 27001-aligned information security policy covering all systems, data, and cryptoasset infrastructure.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-01-10'), nextReviewDate: new Date('2025-01-10') },
    { id: 'ctrl-028', controlRef: 'TECH-002', name: 'Cyber Incident Response Plan', description: 'Documented cyber incident response plan with defined RTO/RPO, escalation procedures, and FCA notification requirements.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-02-01'), nextReviewDate: new Date('2025-02-01') },
    { id: 'ctrl-029', controlRef: 'TECH-003', name: 'Penetration Testing Programme', description: 'Annual penetration testing of all customer-facing systems and internal infrastructure by approved third-party testers.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-03-15'), nextReviewDate: new Date('2024-09-15') },
    { id: 'ctrl-030', controlRef: 'TECH-004', name: 'Multi-Factor Authentication (MFA)', description: 'MFA enforced for all staff access to critical systems, admin panels, and all customer accounts above threshold values.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-01-20'), nextReviewDate: new Date('2025-01-20') },
    { id: 'ctrl-031', controlRef: 'TECH-005', name: 'Smart Contract Audit Programme', description: 'Third-party smart contract audits for all DeFi integrations and tokenisation products before deployment.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p2', status: ControlStatus.NOT_ASSESSED, ownerId: adminUser.id, lastReviewed: null, nextReviewDate: new Date('2024-08-01') },
    { id: 'ctrl-032', controlRef: 'TECH-006', name: 'Business Continuity Plan (BCP)', description: 'Tested BCP covering cryptoasset trading disruption, custody system failures, and key person dependencies.', categoryId: 'cat-tech', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-01-25'), nextReviewDate: new Date('2025-01-25') },
    // Operational Resilience
    { id: 'ctrl-033', controlRef: 'OR-001', name: 'Important Business Services Mapping', description: 'Identification and mapping of Important Business Services (IBS) per FCA operational resilience requirements.', categoryId: 'cat-or', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-03-01'), nextReviewDate: new Date('2024-09-01') },
    { id: 'ctrl-034', controlRef: 'OR-002', name: 'Impact Tolerances', description: 'Defined and tested impact tolerances for each Important Business Service within FCA guidance.', categoryId: 'cat-or', fcaPrincipleId: 'fca-p3', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-03-01'), nextReviewDate: new Date('2024-09-01') },
    { id: 'ctrl-035', controlRef: 'OR-003', name: 'Third Party and Outsourcing Risk', description: 'Third-party risk management framework covering cloud providers, custody sub-contractors, and critical service providers.', categoryId: 'cat-or', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-02-15'), nextReviewDate: new Date('2025-02-15') },
    // Market Integrity
    { id: 'ctrl-036', controlRef: 'MI-001', name: 'Market Abuse Policy', description: 'Policy and controls to prevent market manipulation, insider dealing, and abusive practices in cryptoasset markets.', categoryId: 'cat-mi', fcaPrincipleId: 'fca-p5', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-30'), nextReviewDate: new Date('2025-01-30') },
    { id: 'ctrl-037', controlRef: 'MI-002', name: 'Order Surveillance System', description: 'Automated surveillance of order flow and trading patterns to detect potential market manipulation.', categoryId: 'cat-mi', fcaPrincipleId: 'fca-p5', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-03-20'), nextReviewDate: new Date('2024-09-20') },
    { id: 'ctrl-038', controlRef: 'MI-003', name: 'Pre/Post Trade Controls', description: 'Pre-trade risk controls including position limits, velocity checks, and post-trade reporting obligations.', categoryId: 'cat-mi', fcaPrincipleId: 'fca-p5', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-02-01'), nextReviewDate: new Date('2025-02-01') },
    // Financial Crime
    { id: 'ctrl-039', controlRef: 'FC-001', name: 'Fraud Prevention Framework', description: 'Comprehensive fraud prevention controls covering account takeover, payment fraud, and cryptoasset-specific fraud vectors.', categoryId: 'cat-fc', fcaPrincipleId: 'fca-p1', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-02-10'), nextReviewDate: new Date('2025-02-10') },
    { id: 'ctrl-040', controlRef: 'FC-002', name: 'Proliferation Finance Controls', description: 'Controls specifically addressing proliferation finance risks per FATF Recommendation 1 and FCA guidance.', categoryId: 'cat-fc', fcaPrincipleId: 'fca-p1', status: ControlStatus.NOT_ASSESSED, ownerId: complianceOfficer.id, lastReviewed: null, nextReviewDate: new Date('2024-07-01') },
    { id: 'ctrl-041', controlRef: 'FC-003', name: 'Tax Evasion Prevention', description: 'Corporate criminal offence (CCO) controls and FATCA/CRS reporting for cryptoasset transactions.', categoryId: 'cat-fc', fcaPrincipleId: 'fca-p1', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-20'), nextReviewDate: new Date('2025-01-20') },
    // Data Protection
    { id: 'ctrl-042', controlRef: 'DP-001', name: 'GDPR Compliance Programme', description: 'UK GDPR compliance programme including privacy notices, consent management, DSAR procedures, and DPIA process.', categoryId: 'cat-dp', fcaPrincipleId: 'fca-p6', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-01-15'), nextReviewDate: new Date('2025-01-15') },
    { id: 'ctrl-043', controlRef: 'DP-002', name: 'Data Retention Policy', description: 'Documented data retention schedules for all customer and transactional data meeting AML 5-year retention requirements.', categoryId: 'cat-dp', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-01-15'), nextReviewDate: new Date('2025-01-15') },
    { id: 'ctrl-044', controlRef: 'DP-003', name: 'Data Breach Response Plan', description: 'ICO-compliant data breach response plan with 72-hour notification procedure and affected party communication process.', categoryId: 'cat-dp', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-02-01'), nextReviewDate: new Date('2025-02-01') },
    // Financial Resources
    { id: 'ctrl-045', controlRef: 'FIN-001', name: 'Capital Adequacy Assessment', description: 'ICAAP-equivalent assessment of capital requirements including cryptoasset-specific risk capital buffers.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p4', status: ControlStatus.COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-01-10'), nextReviewDate: new Date('2025-01-10') },
    { id: 'ctrl-046', controlRef: 'FIN-002', name: 'Liquidity Risk Management', description: 'Liquidity risk framework covering crypto market liquidity, stablecoin de-peg scenarios, and fiat liquidity buffers.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p4', status: ControlStatus.PARTIALLY_COMPLIANT, ownerId: riskManager.id, lastReviewed: new Date('2024-03-01'), nextReviewDate: new Date('2024-09-01') },
    { id: 'ctrl-047', controlRef: 'FIN-003', name: 'Wind-Down Plan', description: 'Documented wind-down plan ensuring orderly return of client assets and cessation of regulated activities if required.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p4', status: ControlStatus.NOT_ASSESSED, ownerId: riskManager.id, lastReviewed: null, nextReviewDate: new Date('2024-08-01') },
    { id: 'ctrl-048', controlRef: 'FIN-004', name: 'Financial Crime Risk Appetite', description: 'Board-approved financial crime risk appetite statement with quantified risk tolerances and escalation thresholds.', categoryId: 'cat-fc', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: adminUser.id, lastReviewed: new Date('2024-01-10'), nextReviewDate: new Date('2025-01-10') },
    { id: 'ctrl-049', controlRef: 'GOV-007', name: 'Regulatory Change Management', description: 'Process for monitoring, assessing, and implementing regulatory changes including FCA consultations and policy statements.', categoryId: 'cat-gov', fcaPrincipleId: 'fca-p11', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-02-15'), nextReviewDate: new Date('2025-02-15') },
    { id: 'ctrl-050', controlRef: 'AML-011', name: 'MLRO Appointment & Oversight', description: 'Appointed Money Laundering Reporting Officer (MLRO) with appropriate experience, resources, and board-level access.', categoryId: 'cat-aml', fcaPrincipleId: 'fca-p3', status: ControlStatus.COMPLIANT, ownerId: complianceOfficer.id, lastReviewed: new Date('2024-01-05'), nextReviewDate: new Date('2025-01-05') },
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
        { title: 'Regulatory perimeter analysis', status: StageStatus.COMPLETE, documentId: 'doc-001' },
        { title: 'Business model assessment', status: StageStatus.COMPLETE, documentId: 'doc-002' },
        { title: 'Gap analysis against FCA requirements', status: StageStatus.COMPLETE, documentId: 'doc-001' },
        { title: 'Pre-application meeting with FCA', status: StageStatus.COMPLETE, documentId: 'doc-001' },
        { title: 'Project plan and resource allocation', status: StageStatus.COMPLETE, documentId: 'doc-002' },
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
        { title: 'Regulatory business plan (5-year)', status: StageStatus.COMPLETE, documentId: 'doc-002' },
        { title: 'Governance framework and board composition', status: StageStatus.COMPLETE, documentId: 'doc-002' },
        { title: 'SM&CR Senior Manager Function mapping', status: StageStatus.COMPLETE, documentId: 'doc-002' },
        { title: 'Statements of Responsibilities (SoR)', status: StageStatus.COMPLETE, documentId: 'doc-002' },
        { title: 'Responsibility Map', status: StageStatus.COMPLETE, documentId: 'doc-002' },
        { title: 'Conflicts of interest register', status: StageStatus.COMPLETE, documentId: 'doc-002' },
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
        { title: 'Capital adequacy calculation', status: StageStatus.COMPLETE, documentId: 'doc-005' },
        { title: 'Financial projections (3-year)', status: StageStatus.COMPLETE, documentId: 'doc-005' },
        { title: 'Liquidity risk assessment', status: StageStatus.COMPLETE, documentId: 'doc-005' },
        { title: 'Wind-down plan (draft)', status: StageStatus.COMPLETE, documentId: 'doc-005' },
        { title: 'Professional indemnity insurance review', status: StageStatus.COMPLETE, documentId: 'doc-005' },
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
        { title: 'Compliance monitoring system implementation', status: StageStatus.COMPLETE, documentId: 'doc-006' },
        { title: 'Transaction monitoring system deployment', status: StageStatus.IN_PROGRESS, documentId: 'doc-006' },
        { title: 'Surveillance system configuration', status: StageStatus.IN_PROGRESS, documentId: 'doc-006' },
        { title: 'Reporting infrastructure setup', status: StageStatus.COMPLETE, documentId: 'doc-006' },
        { title: 'Operational resilience testing', status: StageStatus.NOT_STARTED, documentId: 'doc-006' },
        { title: 'IT security assessment (pen test)', status: StageStatus.IN_PROGRESS, documentId: 'doc-006' },
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
        { title: 'AML policy suite finalisation', status: StageStatus.COMPLETE, documentId: 'doc-003' },
        { title: 'KYC/CDD procedures documentation', status: StageStatus.COMPLETE, documentId: 'doc-003' },
        { title: 'Travel Rule solution implementation', status: StageStatus.IN_PROGRESS, documentId: 'doc-003' },
        { title: 'Blockchain analytics tool integration', status: StageStatus.IN_PROGRESS, documentId: 'doc-003' },
        { title: 'MLRO appointment and mandate', status: StageStatus.COMPLETE, documentId: 'doc-003' },
        { title: 'AML training programme rollout', status: StageStatus.COMPLETE, documentId: 'doc-003' },
        { title: 'SAR reporting procedures', status: StageStatus.COMPLETE, documentId: 'doc-003' },
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
        { title: 'Consumer Duty implementation plan', status: StageStatus.NOT_STARTED, documentId: 'doc-007' },
        { title: 'Risk warning framework implementation', status: StageStatus.NOT_STARTED, documentId: 'doc-007' },
        { title: 'Client categorisation review', status: StageStatus.NOT_STARTED, documentId: 'doc-007' },
        { title: 'Appropriateness test design', status: StageStatus.NOT_STARTED, documentId: 'doc-007' },
        { title: 'Complaints handling review', status: StageStatus.NOT_STARTED, documentId: 'doc-007' },
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
        { title: 'Ongoing compliance monitoring programme', status: StageStatus.NOT_STARTED, documentId: 'doc-008' },
        { title: 'Annual regulatory returns setup', status: StageStatus.NOT_STARTED, documentId: 'doc-008' },
        { title: 'Change in control notification process', status: StageStatus.NOT_STARTED },
        { title: 'Regulatory change monitoring', status: StageStatus.NOT_STARTED, documentId: 'doc-008' },
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
      const req = requirements[i] as { title: string; status: StageStatus; documentId?: string }
      await prisma.stageRequirement.upsert({
        where: { id: `req-${stageFields.id}-${i}` },
        update: { status: req.status, documentId: req.documentId ?? null },
        create: {
          id: `req-${stageFields.id}-${i}`,
          stageId: stage.id,
          title: req.title,
          status: req.status,
          documentId: req.documentId ?? null,
        },
      })
    }
  }

  // ─── Regulations ──────────────────────────────────────────────────────────
  const regulations = [
    { id: 'reg-fca-crypto', code: 'FCA_CRYPTO_2026', name: 'FCA Cryptoassets Regime 2026', fullName: 'FCA Cryptoassets Regulations 2026 (FSMA)', jurisdiction: 'UK', regulator: 'FCA', description: 'UK regulatory framework for cryptoasset businesses under FSMA, including exchange, custody, and stablecoin issuance.' },
    { id: 'reg-fsma', code: 'FSMA_2000', name: 'FSMA 2000', fullName: 'Financial Services and Markets Act 2000', jurisdiction: 'UK', regulator: 'FCA/PRA', description: 'Primary UK financial services legislation governing authorisation, conduct, and prudential requirements.' },
    { id: 'reg-mlr', code: 'MLR_2017', name: 'MLR 2017', fullName: 'Money Laundering Regulations 2017 (as amended)', jurisdiction: 'UK', regulator: 'HMRC/FCA', description: 'UK AML/CTF regulations implementing the EU 4th/5th AML Directives into UK law.' },
    { id: 'reg-mica', code: 'MICA', name: 'MiCA', fullName: 'Markets in Crypto-Assets Regulation (EU) 2023/1114', jurisdiction: 'EU', regulator: 'ESMA/NCAs', description: 'EU comprehensive crypto-asset regulatory framework covering CASPs, EMTs, and ARTs.' },
    { id: 'reg-fatf-tr', code: 'FATF_TRAVEL_RULE', name: 'FATF Travel Rule', fullName: 'FATF Recommendation 16 - Virtual Assets Travel Rule', jurisdiction: 'Global', regulator: 'FATF', description: 'FATF requirement for VASPs to collect and transmit originator and beneficiary information for crypto transfers.' },
    { id: 'reg-smcr', code: 'SMCR', name: 'SM&CR', fullName: 'Senior Managers and Certification Regime', jurisdiction: 'UK', regulator: 'FCA', description: 'UK accountability regime for financial services firms requiring senior manager accountability and certification.' },
    { id: 'reg-gdpr', code: 'UK_GDPR', name: 'UK GDPR', fullName: 'UK General Data Protection Regulation', jurisdiction: 'UK', regulator: 'ICO', description: 'UK data protection law post-Brexit, governing processing of personal data.' },
    { id: 'reg-ofsi', code: 'OFSI', name: 'OFSI Sanctions', fullName: 'Office of Financial Sanctions Implementation', jurisdiction: 'UK', regulator: 'OFSI/HMT', description: 'UK financial sanctions regime administered by OFSI including crypto-specific sanctions guidance.' },
    { id: 'reg-genius', code: 'GENIUS_ACT', name: 'GENIUS Act (US)', fullName: 'Guiding and Establishing National Innovation for US Stablecoins Act', jurisdiction: 'US', regulator: 'OCC/Fed', description: 'US federal stablecoin legislation establishing regulatory framework for payment stablecoin issuers.' },
    { id: 'reg-fatca', code: 'FATCA', name: 'FATCA', fullName: 'Foreign Account Tax Compliance Act', jurisdiction: 'US/Global', regulator: 'IRS', description: 'US tax reporting requirements for foreign financial institutions, extended to crypto in guidance.' },
    { id: 'reg-crs', code: 'CRS', name: 'CRS/CARF', fullName: 'Common Reporting Standard / Crypto-Asset Reporting Framework', jurisdiction: 'Global', regulator: 'OECD', description: 'OECD automatic exchange of information standard, now extended to crypto via CARF framework.' },
    { id: 'reg-amld6', code: 'AMLD6', name: 'AMLD6', fullName: '6th EU Anti-Money Laundering Directive', jurisdiction: 'EU', regulator: 'EBA/NCAs', description: 'EU AML directive extending predicate offences and strengthening criminal liability for money laundering.' },
    { id: 'reg-wolfsburg', code: 'WOLFSBURG', name: 'Wolfsburg Principles', fullName: 'Wolfsburg Group AML/CTF Principles for Correspondent Banking', jurisdiction: 'Global', regulator: 'Wolfsburg Group', description: 'Industry standards for AML/CTF in correspondent banking relationships, increasingly applied to crypto.' },
    { id: 'reg-bsa', code: 'BSA_FINCEN', name: 'BSA/FinCEN', fullName: 'Bank Secrecy Act / FinCEN VASP Requirements', jurisdiction: 'US', regulator: 'FinCEN', description: 'US AML framework for Virtual Asset Service Providers including MSB registration and SAR filing.' },
    { id: 'reg-consumer-duty', code: 'CONSUMER_DUTY', name: 'FCA Consumer Duty', fullName: 'FCA Consumer Duty (PS22/9)', jurisdiction: 'UK', regulator: 'FCA', description: 'FCA Consumer Duty requiring firms to deliver good outcomes for retail customers across four key areas.' },
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
    { regulationId: 'reg-fca-crypto', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT },
    { regulationId: 'reg-fsma', applicable: true, status: ControlStatus.COMPLIANT },
    { regulationId: 'reg-mlr', applicable: true, status: ControlStatus.COMPLIANT },
    { regulationId: 'reg-mica', applicable: true, status: ControlStatus.NOT_ASSESSED },
    { regulationId: 'reg-fatf-tr', applicable: true, status: ControlStatus.NON_COMPLIANT },
    { regulationId: 'reg-smcr', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT },
    { regulationId: 'reg-gdpr', applicable: true, status: ControlStatus.COMPLIANT },
    { regulationId: 'reg-ofsi', applicable: true, status: ControlStatus.COMPLIANT },
    { regulationId: 'reg-genius', applicable: false, status: ControlStatus.NOT_ASSESSED },
    { regulationId: 'reg-fatca', applicable: true, status: ControlStatus.COMPLIANT },
    { regulationId: 'reg-crs', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT },
    { regulationId: 'reg-amld6', applicable: false, status: ControlStatus.NOT_ASSESSED },
    { regulationId: 'reg-wolfsburg', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT },
    { regulationId: 'reg-bsa', applicable: false, status: ControlStatus.NOT_ASSESSED },
    { regulationId: 'reg-consumer-duty', applicable: true, status: ControlStatus.PARTIALLY_COMPLIANT },
  ]

  for (let i = 0; i < mapEntries.length; i++) {
    const entry = mapEntries[i]
    await prisma.complianceMapEntry.upsert({
      where: { id: `cme-${i}` },
      update: {},
      create: {
        id: `cme-${i}`,
        organisationId: org.id,
        ...entry,
      },
    })
  }

  // ─── Documents ────────────────────────────────────────────────────────────
  const documents = [
    {
      id: 'doc-001',
      name: 'Regulatory Perimeter Analysis',
      type: DocumentType.EVIDENCE,
      version: '1.0',
      description: 'Initial assessment of regulatory perimeter, confirming FCA authorisation requirement for proposed cryptoasset activities',
      uploadedBy: complianceOfficer.id,
      content: `# REGULATORY PERIMETER ANALYSIS

## BlockChain Securities Ltd

**Version:** 1.0 | **Date:** 15 January 2024 | **Classification:** CONFIDENTIAL
**Prepared by:** Sarah Chen, Chief Compliance Officer | **Approved by:** Alex Thompson, CEO

---

## 1. EXECUTIVE SUMMARY

This Regulatory Perimeter Analysis has been prepared by BlockChain Securities Ltd ("BSL" or "the Company") in connection with its planned application for authorisation under the UK Financial Services and Markets Act 2000 (FSMA), as extended to cryptoasset activities by the Financial Services and Markets Act 2023.

The analysis concludes that BSL's proposed business activities fall squarely within the regulated perimeter under the UK cryptoasset regime and that FCA authorisation is required before the Company may commence operations. This document sets out the basis for that conclusion and recommends the appropriate regulatory pathway.

---

## 2. BUSINESS ACTIVITIES REVIEW

### 2.1 Proposed Activities

BSL proposes to operate the following services upon receipt of authorisation:

- **Cryptoasset Exchange:** Operating a multilateral trading platform enabling the exchange of cryptoassets for fiat currency (GBP, EUR, USD) and cryptoasset-to-cryptoasset transactions
- **Custody Services:** Safeguarding and administering cryptoassets on behalf of retail and professional clients, including private key management
- **Staking Services:** Facilitating delegation staking of proof-of-stake cryptoassets (ETH, SOL, ADA) on behalf of clients
- **OTC Trading Desk:** Bilateral over-the-counter trading of cryptoassets with professional and institutional counterparties for block transactions above £50,000

### 2.2 Asset Classes in Scope

The Company proposes to offer services in respect of the following cryptoasset categories:

- Bitcoin (BTC), Ether (ETH), and other established exchange tokens
- Fiat-backed stablecoins (USDC, USDT) where regulatory clarity permits
- Utility tokens listed on the Company's exchange following due diligence
- Excluded: Security tokens (regulated separately under FSMA), NFTs (not in scope at launch)

---

## 3. REGULATORY CLASSIFICATION

### 3.1 Applicable UK Regulatory Framework

Under the Financial Services and Markets Act 2000 (as amended by the Financial Services and Markets Act 2023), specified cryptoasset activities constitute regulated activities requiring FCA authorisation under Part IV FSMA. The FCA published its final rules in PS24/1 (April 2024) with a compliance deadline of 1 January 2026.

### 3.2 Activity-by-Activity Assessment

| Proposed Activity | Regulated? | Applicable Legislation | FCA Sourcebook |
|---|---|---|---|
| Cryptoasset Exchange | Yes | FSMA 2000, RAO 2001 (as amended 2023) | CRYPTO |
| Custody / Safeguarding | Yes | FSMA 2000, CASS Rules (as extended) | CASS / CRYPTO |
| Staking Services | Yes (conditional) | FCA PS24/1 | CRYPTO |
| OTC Trading (principal) | Yes | FSMA 2000, MAR | CRYPTO / MAR |

### 3.3 Money Laundering Regulations

All proposed activities also constitute "cryptoasset exchange provider" and "custodian wallet provider" activities under the Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 (MLR 2017, as amended). Separate MLR registration is required alongside FSMA authorisation.

---

## 4. PERIMETER ASSESSMENT — ACTIVITIES WITHIN SCOPE

### 4.1 Confirmed In-Scope Activities

The following activities have been assessed as unambiguously within the regulated perimeter:

1. **Exchange of cryptoassets for fiat currency** — Article 25D, Financial Services and Markets Act 2000 (Regulated Activities) Order 2001 (RAO)
2. **Exchange of cryptoassets for other cryptoassets** — Article 25D RAO
3. **Safe custody and administration of cryptoassets** — Article 40A RAO
4. **Operating a cryptoasset trading platform** — Article 25DA RAO
5. **Arranging deals in cryptoassets** — Article 25E RAO

### 4.2 Exemptions Considered and Rejected

| Exemption | Assessment |
|---|---|
| Own-account dealing (Article 15 RAO) | Not applicable — BSL provides services to third parties |
| Intra-group exemption | Not applicable — BSL has an external customer base |
| Technology-only exemption | Not applicable — BSL holds client assets |

---

## 5. REGULATORY PATHWAY AND NEXT STEPS

### 5.1 Conclusion

BSL requires FCA authorisation under Part IV FSMA before conducting any regulated cryptoasset activities. Commencement of regulated activities without authorisation constitutes a criminal offence under Section 19 FSMA (the "General Prohibition").

### 5.2 Recommended Pathway

1. Submit pre-application engagement request to FCA Innovation Hub (Q1 2024 — **Complete**)
2. Attend pre-application meeting with FCA supervisory team (January 2024 — **Complete**)
3. Prepare comprehensive regulatory business plan and application pack (Q1–Q2 2024)
4. Appoint Senior Manager Function holders and obtain FCA approval
5. Submit formal application via FCA Connect portal (target: Q4 2024)

### 5.3 Key Regulatory Contacts

- **FCA Supervision Team:** Cryptoassets Supervision, 12 Endeavour Square, London E20 1JN
- **FCA Innovation Hub:** innovate@fca.org.uk
- **Internal Lead:** Sarah Chen, Chief Compliance Officer (compliance@blockchainsecurities.co.uk)

---

*This document is subject to legal privilege and should not be disclosed to third parties without Board approval. Next review date: 15 January 2025.*`,
    },
    {
      id: 'doc-002',
      name: 'Business Model Assessment',
      type: DocumentType.POLICY,
      version: '2.1',
      description: 'Regulatory business plan and business model assessment for FCA application',
      uploadedBy: adminUser.id,
      content: `# BUSINESS MODEL ASSESSMENT

## BlockChain Securities Ltd

**Version:** 2.1 | **Date:** 29 February 2024 | **Classification:** CONFIDENTIAL
**Prepared by:** Alex Thompson, CEO | **Reviewed by:** Sarah Chen, CCO | **Board Approved:** 28 February 2024

---

## 1. COMPANY OVERVIEW

BlockChain Securities Ltd ("BSL") was incorporated in England and Wales on 15 June 2019 (Company Number: 12345678). The Company is headquartered in London and operates as a cryptoasset exchange provider and custodian, serving both retail and professional clients across the United Kingdom.

Since its founding, BSL has grown to employ between 51 and 200 staff across technology, compliance, operations, and customer services functions. The Company has operated under HMRC MLR registration since 2020 and is now seeking full FCA authorisation under the UK cryptoasset regime.

**Key Corporate Facts:**
- Registered Office: 42 Fintech Quarter, London, EC2V 8RF
- Incorporated: 15 June 2019
- Headcount: 51–200 employees
- FCA Reference Number (MLR): FRN 987654
- Auditors: Grant Thornton LLP
- Legal Counsel: Fieldfisher LLP

---

## 2. BUSINESS ACTIVITIES AND SERVICE OFFERING

### 2.1 Core Business Lines

**Cryptoasset Exchange Platform**
BSL operates a proprietary exchange platform enabling retail and professional clients to buy, sell, and exchange cryptoassets. The platform currently supports 47 trading pairs across 23 cryptoassets. Average daily trading volume: £4.2 million (FY2023).

**Custodian Services**
BSL provides regulated custody for client cryptoassets, maintaining a minimum of 95% of assets in air-gapped cold storage. The custody book currently holds £38 million in assets under custody (AUC) across approximately 12,400 active accounts.

**Staking Services**
BSL facilitates Ethereum, Solana, and Cardano staking on behalf of clients, earning protocol rewards net of a 12% management fee. Total staked value: £6.1 million.

**OTC Trading Desk**
BSL operates a bilateral OTC desk for block transactions above £50,000, serving approximately 45 institutional and professional counterparties. Average monthly OTC volume: £8.7 million.

### 2.2 Target Market

| Segment | Description | % of Revenue |
|---|---|---|
| Retail (UK) | Individual investors, 18+, appropriateness-assessed | 42% |
| HNW / Self-Certified Professional | High-net-worth individuals | 23% |
| Institutional | Family offices, hedge funds, corporate treasuries | 31% |
| B2B / API | Technology companies integrating BSL's exchange | 4% |

---

## 3. REVENUE MODEL

BSL generates revenue through the following streams:

- **Trading Fees:** Maker fee 0.10%, taker fee 0.20% on all exchange trades
- **Custody Fees:** Annual custody fee of 0.15% on AUC above £10,000
- **Staking Fees:** 12% of gross staking rewards
- **OTC Spread:** Negotiated spread on bilateral OTC transactions (avg. 0.35%)
- **FX Conversion:** 0.50% fee on fiat/crypto conversion
- **API Access Fees:** Monthly SaaS fees for B2B integrations (£500–£5,000/month)

**Revenue Summary (FY2023):** £12.4 million total revenue, EBITDA margin: 18%

---

## 4. REGULATORY CLASSIFICATION OF ACTIVITIES

| Activity | Regulatory Classification | Status |
|---|---|---|
| Exchange Platform | Regulated cryptoasset activity (Article 25D RAO) | Requires FCA authorisation |
| Custody Services | Regulated cryptoasset activity (Article 40A RAO) | Requires FCA authorisation |
| Staking Services | Regulated cryptoasset activity (PS24/1) | Requires FCA authorisation |
| OTC Trading | Regulated cryptoasset activity (Article 25D RAO) | Requires FCA authorisation |

---

## 5. GOVERNANCE STRUCTURE

BSL has established a governance framework appropriate for a firm of its size and complexity:

- **Board of Directors:** 3 executive directors, 2 independent non-executive directors
- **Risk & Compliance Committee:** Quarterly meetings, CCO chairs, NED majority
- **Audit Committee:** Quarterly meetings, chaired by independent NED
- **MLRO:** Sarah Chen (appointed 2021, SMF17)
- **CEO (SMF1):** Alex Thompson
- **CFO (SMF2):** Maria Santos

---

## 6. KEY RISK FACTORS

1. **Regulatory Risk:** Changes to FCA cryptoasset rules may require material operational changes
2. **Market Risk:** Cryptoasset price volatility affects revenue and client demand
3. **Cyber/Technology Risk:** Exchange platforms are high-value targets for sophisticated attackers
4. **Liquidity Risk:** Stablecoin de-peg or market stress events could create liquidity demands
5. **Key Person Risk:** Dependence on specialist compliance and technology staff in a competitive market
6. **AML/Financial Crime Risk:** Cryptoassets present elevated money laundering and sanctions evasion risks

---

*This Business Model Assessment forms part of BSL's FCA application documentation. It is subject to board approval and should be read in conjunction with the Financial Resources Assessment, Systems & Controls Documentation, and AML/CTF Policy. Next review: 29 February 2025.*`,
    },
    {
      id: 'doc-003',
      name: 'AML/CTF Policy Document',
      type: DocumentType.POLICY,
      version: '3.2',
      description: 'Group AML/CTF Policy covering all business lines — approved by Board',
      uploadedBy: complianceOfficer.id,
      content: `# AML/CTF POLICY DOCUMENT

## BlockChain Securities Ltd

**Version:** 3.2 | **Date:** 1 March 2024 | **Classification:** CONFIDENTIAL — INTERNAL
**Policy Owner:** Sarah Chen, MLRO / Chief Compliance Officer
**Board Approved:** 28 February 2024 | **Next Review:** 1 March 2025

---

## 1. POLICY STATEMENT

BlockChain Securities Ltd ("BSL" or "the Firm") is committed to the prevention, detection, and reporting of money laundering, terrorist financing, and proliferation financing. This policy establishes the Firm's obligations and standards in accordance with the Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 (MLR 2017), the Proceeds of Crime Act 2002 (POCA), the Terrorism Act 2000 (TA 2000), and FCA rules and guidance.

BSL recognises that, as a cryptoasset exchange provider and custodian, it presents elevated inherent money laundering and terrorist financing risk due to the pseudonymous nature of cryptoassets, the speed and global reach of blockchain transactions, and the evolving regulatory environment. The Firm is committed to maintaining robust controls proportionate to this risk profile.

**Zero-Tolerance Statement:** BSL has zero tolerance for knowingly facilitating money laundering, terrorist financing, or proliferation financing, and for wilful blindness to such activity.

---

## 2. SCOPE

This Policy applies to:

- All employees, contractors, and agents of BSL
- All business lines: Exchange, Custody, Staking, and OTC Trading
- All customer types: Retail, Professional, and Institutional
- All jurisdictions in which BSL operates or has clients
- All cryptoasset types supported on the BSL platform

---

## 3. GOVERNANCE AND OVERSIGHT

### 3.1 Money Laundering Reporting Officer (MLRO)

BSL has appointed Sarah Chen as its Money Laundering Reporting Officer (MLRO) under Regulation 21 MLR 2017. The MLRO holds SMF17 (Money Laundering Reporting Officer) status under the Senior Managers and Certification Regime.

**MLRO Responsibilities:**
- Oversight of the AML/CTF compliance programme
- Receipt and assessment of internal Suspicious Activity Reports (SARs)
- Decision on external SAR submission to the National Crime Agency (NCA)
- Annual AML report to the Board of Directors
- Liaison with FCA and law enforcement agencies

### 3.2 Board Oversight

The Board of Directors is responsible for setting the Firm's risk appetite, approving this Policy, and providing adequate resources for AML/CTF compliance. The Board receives a quarterly compliance dashboard and annual MLRO report.

### 3.3 Three Lines of Defence

- **First Line:** Business units — ownership of AML controls in daily operations
- **Second Line:** Compliance team (MLRO and 4 FTEs) — policy, monitoring, and oversight
- **Third Line:** Internal Audit — annual independent review of AML framework effectiveness

---

## 4. RISK ASSESSMENT

### 4.1 Firm-Wide Risk Assessment

BSL has conducted a Firm-Wide Risk Assessment (FWRA) in accordance with Regulation 18 MLR 2017. The FWRA assesses inherent AML/CTF/PF risk across four dimensions:

- **Customer Risk:** Retail clients (medium), Professional/Institutional (medium-high), PEPs (high), High-risk country clients (high)
- **Product/Service Risk:** Exchange (medium-high), Custody (medium), Staking (low-medium), OTC (high)
- **Geographic Risk:** UK-domiciled clients (low-medium), EEA clients (medium), Non-EEA clients (high)
- **Delivery Channel Risk:** Online onboarding (medium), Introducer relationships (high)

**Overall Inherent Risk Rating: HIGH**
**Residual Risk Rating (post-controls): MEDIUM**

### 4.2 Cryptoasset-Specific Risks

- Pseudonymity and privacy coins (Monero, Zcash) — prohibited on BSL platform
- Peer-to-peer (P2P) transfers from unhosted wallets
- DeFi protocol interactions and cross-chain bridges
- NFT-related money laundering (not in scope for BSL)
- Mixing and tumbling services — flagged as high-risk indicators

---

## 5. CUSTOMER DUE DILIGENCE (CDD)

### 5.1 Standard CDD

All new customers must complete Standard CDD before trading or depositing funds. Standard CDD comprises:

- Full name, date of birth, and residential address verification
- Government-issued photo ID (passport or driving licence)
- Proof of address (bank statement or utility bill, dated within 3 months)
- Source of funds declaration for initial deposits above £2,000
- Appropriateness assessment for retail customers

### 5.2 Enhanced Due Diligence (EDD)

EDD is required for:
- Politically Exposed Persons (PEPs) and their associates
- Customers from high-risk third countries (FATF blacklist/greylist)
- Customers with complex ownership structures
- Customers conducting large or unusual transactions
- Correspondent relationships with other Virtual Asset Service Providers (VASPs)

EDD measures include: senior management approval, enhanced source of funds/wealth verification, increased monitoring frequency, and annual relationship reviews.

### 5.3 Simplified Due Diligence (SDD)

SDD may apply to low-risk institutional counterparties (e.g., UK-regulated banks) subject to MLRO approval.

---

## 6. TRANSACTION MONITORING

BSL operates an automated transaction monitoring system that analyses all cryptoasset transactions in real time. The system applies rule-based alerts and machine-learning models to detect:

- Structuring and smurfing below reporting thresholds
- Rapid fund movement (layering indicators)
- Transactions to/from sanctioned wallet addresses
- Interactions with mixers, tumblers, or high-risk exchanges
- Unusual transaction patterns relative to customer profile
- FATF Travel Rule violations

All alerts are reviewed by the compliance team within 24 hours. Escalated cases are reviewed by the MLRO within 48 hours.

---

## 7. SANCTIONS SCREENING

BSL screens all customers and transactions against the following sanctions lists in real time:

- HM Treasury / OFSI (UK Consolidated List)
- OFAC (US) — Specially Designated Nationals (SDN) List
- UN Security Council Consolidated List
- EU Consolidated Financial Sanctions List

Wallet address screening is conducted using specialist blockchain analytics tooling against known sanctioned wallet addresses. Any match triggers an immediate account freeze and MLRO notification.

---

## 8. SUSPICIOUS ACTIVITY REPORTING

### 8.1 Internal Reporting

All staff must submit an internal SAR to the MLRO via the secure compliance portal when they know, suspect, or have reasonable grounds to suspect that a person is engaged in money laundering or terrorist financing. Tipping-off is strictly prohibited.

### 8.2 External Reporting

The MLRO will submit an external SAR to the National Crime Agency (NCA) via the UKFIU online portal where there are grounds to suspect money laundering or terrorist financing, subject to the "consent regime" where applicable.

**Reporting Timeline:** Internal SARs submitted within 24 hours of suspicion arising; NCA SAR submitted within 7 working days of internal SAR receipt.

---

## 9. TRAVEL RULE COMPLIANCE

BSL is implementing compliance with the FATF Recommendation 16 Travel Rule as implemented in UK law under the MLR 2017 (as amended by the Money Laundering and Terrorist Financing (Amendment) (No. 2) Regulations 2022).

For VASP-to-VASP transfers above £1,000:
- Originator information (name, account number, address) must be collected and transmitted
- Beneficiary information must be verified before releasing funds
- BSL uses a TRISA-compatible messaging protocol for Travel Rule data exchange

**Current Status:** Implementation in progress — target completion Q3 2024.

---

## 10. TRAINING

All staff complete mandatory AML/CTF training upon joining and annually thereafter. Role-specific training is provided for:
- Customer-facing staff: CDD and transaction monitoring (4 hours)
- Compliance team: Advanced AML/CTF (8 hours)
- Senior Managers: AML governance and accountability (2 hours)

Training completion is tracked in the Learning Management System (LMS). Non-completion triggers escalation to line managers and HR.

---

*This Policy is reviewed annually and updated to reflect changes in legislation, FCA guidance, and the Firm's risk profile. Queries should be directed to the Compliance team at compliance@blockchainsecurities.co.uk.*`,
    },
    {
      id: 'doc-004',
      name: 'Risk Assessment Framework',
      type: DocumentType.PROCEDURE,
      version: '1.3',
      description: 'Enterprise risk assessment methodology, risk appetite, and risk scoring framework',
      uploadedBy: riskManager.id,
      content: `# RISK ASSESSMENT FRAMEWORK

## BlockChain Securities Ltd

**Version:** 1.3 | **Date:** 1 March 2024 | **Classification:** INTERNAL
**Document Owner:** James Okafor, Risk Manager
**Approved by:** Board Risk & Compliance Committee | **Next Review:** 1 September 2024

---

## 1. PURPOSE AND SCOPE

This Risk Assessment Framework ("the Framework") establishes the methodology by which BlockChain Securities Ltd ("BSL") identifies, assesses, monitors, and mitigates risks across its business operations. The Framework applies to all risk types including regulatory, operational, financial, technology, and reputational risks.

The Framework is designed to meet the requirements of:
- FCA Principles for Businesses (PRIN 3: Management and Control)
- FCA Senior Management Arrangements, Systems and Controls (SYSC) Sourcebook
- FCA Cryptoasset Regime (PS24/1) — Operational Resilience requirements
- ISO 31000:2018 Risk Management Guidelines

---

## 2. RISK GOVERNANCE

### 2.1 Risk Governance Structure

| Role | Responsibility |
|---|---|
| Board of Directors | Sets risk appetite; approves Risk Framework; ultimate accountability |
| Risk & Compliance Committee | Quarterly risk review; escalation from management |
| Chief Risk Officer (James Okafor) | Day-to-day risk management; Risk Register ownership |
| Business Unit Managers | First-line risk identification and control |
| Internal Audit | Independent annual review of risk framework effectiveness |

### 2.2 Three Lines of Defence

- **First Line (Business):** Identify, own, and manage risks within their operations
- **Second Line (Risk/Compliance):** Framework, policies, monitoring, and reporting
- **Third Line (Internal Audit):** Independent assurance on risk management effectiveness

---

## 3. RISK METHODOLOGY

### 3.1 Risk Identification

Risks are identified through:
- Annual business unit risk workshops facilitated by the Risk team
- Horizon scanning of regulatory and industry developments
- Incident and near-miss reporting
- External threat intelligence (cyber, fraud, regulatory)
- Senior management and Board discussions
- Peer benchmarking and industry forums

### 3.2 Risk Assessment Criteria

Each identified risk is assessed on two dimensions:

**Likelihood (L):** Probability of the risk materialising within 12 months

| Score | Level | Description |
|---|---|---|
| 1 | Remote | Less than 5% probability |
| 2 | Unlikely | 5–20% probability |
| 3 | Possible | 20–50% probability |
| 4 | Likely | 50–80% probability |
| 5 | Almost Certain | Greater than 80% probability |

**Impact (I):** Consequence to BSL if the risk materialises

| Score | Level | Financial Impact | Regulatory Impact |
|---|---|---|---|
| 1 | Negligible | < £50,000 | Informal guidance |
| 2 | Minor | £50,000–£250,000 | Supervisory letter |
| 3 | Moderate | £250,000–£1,000,000 | Requirement / Variation |
| 4 | Significant | £1,000,000–£5,000,000 | Enforcement action |
| 5 | Catastrophic | > £5,000,000 | Withdrawal of authorisation |

**Risk Score = Likelihood × Impact**

### 3.3 Risk Rating Matrix

| Score | Risk Level | Colour | Response |
|---|---|---|---|
| 1–4 | Low | Green | Monitor annually |
| 5–9 | Medium | Amber | Quarterly monitoring; management action plan |
| 10–14 | High | Orange | Monthly monitoring; Risk Committee escalation |
| 15–25 | Critical | Red | Immediate Board escalation; urgent remediation |

---

## 4. RISK APPETITE

### 4.1 Board-Approved Risk Appetite Statement

BSL's Board has approved the following risk appetite:

> *"BSL seeks to operate as a compliant, secure, and customer-centric cryptoasset firm. We have zero appetite for breaches of regulatory requirements or for financial crime. We accept moderate technology and market risks where appropriate controls are in place and returns are commensurate. We have low appetite for reputational risk that could undermine customer trust."*

### 4.2 Risk Appetite Thresholds

| Risk Category | Appetite | Threshold |
|---|---|---|
| Regulatory/Compliance | Zero | No tolerance for regulatory breaches |
| Financial Crime | Zero | No tolerance for AML/CTF failures |
| Cyber/Technology | Low | Maximum residual score: 8 |
| Market/Liquidity | Moderate | Maximum residual score: 12 |
| Operational | Moderate | Maximum residual score: 10 |
| Reputational | Low | Maximum residual score: 8 |

---

## 5. RISK REGISTER

BSL maintains a live Risk Register, updated quarterly and reviewed by the Risk & Compliance Committee. The Register captures:

- Risk ID and description
- Risk category and subcategory
- Inherent risk score (L × I)
- Current controls and their effectiveness
- Residual risk score (post-controls)
- Risk owner and escalation path
- Target risk score and target date
- Action plans for risks above appetite

The Risk Register is stored in the Compliance Management System and accessible to all Risk & Compliance Committee members.

---

## 6. CRYPTOASSET-SPECIFIC RISK CATEGORIES

Given BSL's business model, the following cryptoasset-specific risk categories are monitored:

1. **Travel Rule Non-Compliance Risk** — Failure to implement FATF Travel Rule by FCA deadline
2. **Smart Contract Exploit Risk** — Vulnerabilities in DeFi integrations exploited by attackers
3. **Stablecoin De-peg Risk** — Major stablecoin de-peg creating liquidity crisis
4. **Hot Wallet Cyber Risk** — Sophisticated attack on internet-connected wallet infrastructure
5. **Regulatory Change Risk** — New FCA rules requiring material operational changes
6. **Liquidity Fragmentation Risk** — Thin market liquidity in niche cryptoassets affecting client execution

---

## 7. MONITORING AND REPORTING

- **Monthly:** Risk Manager reviews all High/Critical risks; updates actions
- **Quarterly:** Risk & Compliance Committee reviews full Risk Register
- **Annually:** Board reviews and approves updated Risk Appetite and Framework
- **Ad hoc:** Immediate escalation for any new Critical risk or risk above appetite

---

*This Framework should be read in conjunction with the AML/CTF Policy, Compliance Monitoring Plan, and Systems & Controls Documentation. Queries: risk@blockchainsecurities.co.uk*`,
    },
    {
      id: 'doc-005',
      name: 'Financial Resources Assessment',
      type: DocumentType.REPORT,
      version: '1.0',
      description: 'Capital adequacy assessment, financial projections, and liquidity analysis for FCA application',
      uploadedBy: riskManager.id,
      content: `# FINANCIAL RESOURCES ASSESSMENT

## BlockChain Securities Ltd

**Version:** 1.0 | **Date:** 15 March 2024 | **Classification:** STRICTLY CONFIDENTIAL
**Prepared by:** James Okafor, Risk Manager & Maria Santos, CFO
**Board Approved:** 14 March 2024 | **Next Review:** 15 September 2024

---

## 1. EXECUTIVE SUMMARY

This Financial Resources Assessment ("FRA") has been prepared to demonstrate that BlockChain Securities Ltd ("BSL") holds adequate financial resources to meet its obligations under the FCA's cryptoasset regime and to support its authorisation application.

**Key Findings:**
- BSL holds £4.2 million in own funds, exceeding the required minimum capital requirement of £750,000
- The liquidity stress test shows BSL can withstand a 90-day stress scenario without capital shortfall
- Three-year financial projections demonstrate profitability and capital adequacy through 2026
- Wind-down cost analysis confirms BSL can execute an orderly wind-down with available resources

---

## 2. CAPITAL REQUIREMENTS

### 2.1 Minimum Capital Requirement

Under FCA PS24/1, cryptoasset firms are required to maintain minimum own funds. BSL's applicable minimum capital requirement is:

| Requirement Type | Amount |
|---|---|
| Base Capital Requirement (Cryptoasset Exchange) | £150,000 |
| Base Capital Requirement (Custody) | £100,000 |
| Variable Capital (1.5% of annual gross revenue) | £186,000 |
| **Total Minimum Capital Requirement** | **£436,000** |

### 2.2 Own Funds Position

As at 28 February 2024, BSL's own funds position is:

| Capital Component | Amount |
|---|---|
| Paid-up share capital | £2,500,000 |
| Retained earnings | £1,432,000 |
| Current year profits (unaudited) | £312,000 |
| Less: Intangible assets | (£42,000) |
| **Total Own Funds** | **£4,202,000** |

**Capital Surplus:** £3,766,000 (864% above minimum requirement)

---

## 3. FINANCIAL PROJECTIONS (2024–2026)

### 3.1 Revenue Projections

| Revenue Stream | FY2024E | FY2025E | FY2026E |
|---|---|---|---|
| Trading Fees | £8,400,000 | £10,200,000 | £13,100,000 |
| Custody Fees | £625,000 | £840,000 | £1,100,000 |
| Staking Revenue | £890,000 | £1,350,000 | £2,100,000 |
| OTC Trading | £2,100,000 | £2,600,000 | £3,400,000 |
| B2B / API | £320,000 | £580,000 | £950,000 |
| **Total Revenue** | **£12,335,000** | **£15,570,000** | **£20,650,000** |

### 3.2 Expense Projections

| Expense Category | FY2024E | FY2025E | FY2026E |
|---|---|---|---|
| Staff Costs | £5,800,000 | £7,100,000 | £8,900,000 |
| Technology & Infrastructure | £1,900,000 | £2,300,000 | £2,800,000 |
| Compliance & Legal | £1,200,000 | £1,400,000 | £1,700,000 |
| Regulatory Fees (FCA) | £185,000 | £220,000 | £280,000 |
| Other Operating Costs | £850,000 | £1,050,000 | £1,300,000 |
| **Total Expenses** | **£9,935,000** | **£12,070,000** | **£14,980,000** |
| **EBITDA** | **£2,400,000** | **£3,500,000** | **£5,670,000** |

### 3.3 Capital Adequacy Forecast

Projected own funds remain well above minimum requirements throughout the forecast period, with the capital surplus growing from £3.8 million (2024) to £8.2 million (2026) as retained earnings accumulate.

---

## 4. LIQUIDITY RISK MANAGEMENT

### 4.1 Liquidity Policy

BSL maintains a minimum liquidity buffer of £1,500,000 in immediately accessible fiat currency at all times. This is supplemented by a £750,000 revolving credit facility with Barclays Bank.

### 4.2 Liquidity Stress Testing

BSL has conducted liquidity stress testing across three scenarios:

| Scenario | Description | Impact | Pass/Fail |
|---|---|---|---|
| Base | Normal operations | £2.1M surplus | PASS |
| Moderate Stress | 30% client withdrawals, major exchange outage (72 hours) | £890K surplus | PASS |
| Severe Stress | 50% client withdrawals, stablecoin de-peg, 7-day outage | £210K surplus | PASS |
| Extreme Stress | 80% withdrawals, complete platform failure, regulatory action | (£340K deficit) | MITIGANT REQUIRED |

**Mitigant for Extreme Scenario:** £750K revolving credit facility provides additional buffer; Board pre-approved asset liquidation protocol.

### 4.3 Client Asset Segregation

All client cryptoassets and fiat funds are strictly segregated from BSL's own assets in accordance with the FCA's CASS Rules. Independent reconciliation is performed daily.

---

## 5. WIND-DOWN PLAN

BSL has prepared a Wind-Down Plan demonstrating the ability to execute an orderly cessation of regulated activities within 6 months:

**Phase 1 (Month 1–2):** Cease new onboarding; notify FCA; issue client communications
**Phase 2 (Month 2–4):** Facilitate client asset transfers; close trading positions
**Phase 3 (Month 4–6):** Return all client assets; settle creditors; de-register with FCA

**Estimated Wind-Down Cost:** £1,850,000 (staff redundancy, legal costs, client communications, regulatory fees)

BSL's available wind-down resources (£4.2M own funds) comfortably cover the estimated wind-down cost, providing a 227% coverage ratio.

---

## 6. PROFESSIONAL INDEMNITY INSURANCE

BSL holds Professional Indemnity Insurance covering regulatory investigations, legal defence costs, and client compensation claims with a limit of £5,000,000 per claim and £10,000,000 in aggregate. Policy details: AIG Policy #PI-2024-00847.

---

*This Financial Resources Assessment is prepared on the basis of management accounts and forward-looking assumptions. Actual results may differ from projections. This document forms part of BSL's FCA authorisation application pack.*`,
    },
    {
      id: 'doc-006',
      name: 'Systems & Controls Documentation',
      type: DocumentType.PROCEDURE,
      version: '2.0',
      description: 'Compliance systems, technology controls, and operational resilience framework',
      uploadedBy: adminUser.id,
      content: `# SYSTEMS & CONTROLS DOCUMENTATION

## BlockChain Securities Ltd

**Version:** 2.0 | **Date:** 30 June 2024 | **Classification:** CONFIDENTIAL — INTERNAL
**Document Owner:** Alex Thompson, CEO / CISO
**Reviewed by:** Sarah Chen, CCO | **Board Approved:** 28 June 2024

---

## 1. PURPOSE

This document provides a comprehensive overview of BlockChain Securities Ltd's ("BSL's") compliance systems, technology infrastructure, operational controls, and resilience framework. It forms part of the FCA authorisation application, demonstrating that BSL has adequate systems and controls under SYSC and FCA PS24/1.

---

## 2. COMPLIANCE MANAGEMENT SYSTEM

### 2.1 Platform Overview

BSL operates a dedicated Compliance Management System (CMS) — CryptoComply Enterprise — which provides:

- **Control Monitoring:** 50 compliance controls mapped to FCA Principles and regulatory obligations
- **FCA Application Tracker:** Stage-by-stage tracking of authorisation progress
- **Document Management:** Centralised repository for all compliance documentation
- **Alert Management:** Real-time compliance alerts and action item tracking
- **Risk Register:** Dynamic risk register with automated risk scoring
- **Audit Trail:** Immutable audit log of all compliance activities

### 2.2 Access Controls

The CMS operates a role-based access control (RBAC) model:

| Role | Access Level |
|---|---|
| Super Admin (CEO/CCO) | Full read/write across all modules |
| Compliance Officer | Read/write on controls, documents, alerts |
| Risk Manager | Read/write on risk register; read on controls |
| Auditor | Read-only across all modules |
| Viewer | Read-only on non-sensitive modules |

Multi-factor authentication (MFA) is mandatory for all CMS users. Session timeout after 30 minutes of inactivity.

---

## 3. TRANSACTION MONITORING SYSTEM

### 3.1 System Overview

BSL's transaction monitoring system (TMS) operates in real-time across all exchange, custody, and OTC transactions. The TMS combines:

- **Rule-based detection:** 47 preconfigured rules covering structuring, velocity, geographic risk, and counterparty risk
- **Machine learning models:** Anomaly detection models trained on 18 months of transaction data
- **Blockchain analytics integration:** Real-time wallet risk scoring for all inbound/outbound cryptoasset transactions

### 3.2 Alert Handling Process

1. Alert generated by TMS (real-time)
2. Tier 1 triage by compliance analyst (target: within 4 hours)
3. Tier 2 investigation by senior compliance officer (within 24 hours)
4. MLRO decision on SAR filing (within 48 hours of Tier 1 escalation)
5. Audit log entry created at each stage

### 3.3 Travel Rule Integration

The TMS integrates with BSL's Travel Rule solution (TRISA protocol) to:
- Automatically collect originator information for outbound VASP transfers above £1,000
- Request beneficiary information for inbound transfers above £1,000
- Flag non-compliant transfers for manual review
- Maintain Travel Rule data for the required 5-year retention period

---

## 4. CYBERSECURITY CONTROLS

### 4.1 Information Security Framework

BSL is certified to ISO 27001:2022 (Certificate No. ISO-27001-2024-BSL-001, expires December 2025). The information security programme includes:

- **Penetration Testing:** Annual third-party penetration test by CyberSec Partners Ltd (CHECK-certified)
- **Vulnerability Management:** Monthly automated vulnerability scans; critical patches within 24 hours
- **Endpoint Protection:** EDR solution deployed on all endpoints; automatic threat containment
- **Network Security:** Zero-trust architecture; microsegmentation of exchange, custody, and admin networks
- **Data Encryption:** AES-256 encryption at rest; TLS 1.3 in transit

### 4.2 Custody Technology Controls

| Control | Implementation |
|---|---|
| Cold Storage | Air-gapped hardware wallets; 95% of client assets offline |
| Hot Wallet Limits | Maximum £500,000 equivalent in hot wallets at any time |
| Multi-Signature | 3-of-5 multi-sig for all hot wallet transactions above £10,000 |
| Key Ceremony | Hardware Security Module (HSM)-based key generation; 5-person key ceremony |
| Backup | Encrypted geographically distributed key backups; tested quarterly |

### 4.3 Multi-Factor Authentication

MFA is enforced for:
- All staff access to production systems
- All customer accounts (TOTP app or hardware key)
- All admin panel access (hardware key required)
- API access (client certificate + API key)

---

## 5. OPERATIONAL RESILIENCE

### 5.1 Important Business Services

BSL has identified the following Important Business Services (IBS) under FCA operational resilience requirements:

| Business Service | Impact Tolerance | Current Status |
|---|---|---|
| Client Cryptoasset Custody | 4-hour maximum outage | Within tolerance |
| Cryptoasset Exchange | 2-hour maximum outage | Within tolerance |
| Fiat Deposit/Withdrawal | 8-hour maximum outage | Within tolerance |
| AML Screening | Continuous (no outage acceptable) | Compliant |

### 5.2 Business Continuity

BSL's Business Continuity Plan (BCP) provides for:

- **Hot standby** data centre (AWS EU-West-2) with automatic failover within 15 minutes
- **Recovery Time Objective (RTO):** 4 hours for exchange; 15 minutes for custody
- **Recovery Point Objective (RPO):** 0 seconds for custody (real-time replication); 5 minutes for exchange
- Annual BCP test (tabletop + live failover) — last tested: November 2023, result: PASS

### 5.3 Third-Party Risk Management

Critical third-party providers are subject to BSL's Third-Party Risk Management (TPRM) framework:

- **AWS (cloud infrastructure):** Tier 1 Critical — quarterly reviews; contractual SLA of 99.99% uptime
- **Banking partner (Barclays):** Tier 1 Critical — monthly reviews
- **Travel Rule provider:** Tier 2 Important — bi-annual reviews
- All critical providers subject to annual due diligence and SLA monitoring

---

## 6. SURVEILLANCE SYSTEM

BSL operates a market surveillance system to detect potential market abuse in accordance with the Market Abuse Regulation (MAR) as applied to cryptoassets:

- Real-time monitoring of order flow and trading patterns
- Automated detection of spoofing, layering, and wash trading
- Alert generation for investigation by compliance team
- Regulatory reporting capability for suspicious transaction reports

**Current Status:** Configuration underway; target go-live: Q3 2024.

---

## 7. REPORTING INFRASTRUCTURE

### 7.1 Regulatory Reporting

BSL has established reporting infrastructure for:

- **REP-CRIM:** Annual financial crime report to FCA (October each year)
- **CMAR:** Cryptoasset Market Activity Return (quarterly)
- **SAR reporting:** Via UKFIU online portal
- **FATCA/CRS reporting:** Annual via HMRC online service

### 7.2 Internal Compliance Reporting

| Report | Frequency | Audience |
|---|---|---|
| Compliance Dashboard | Weekly | CEO, CCO |
| Risk Register Update | Monthly | Risk Committee |
| MLRO Report | Annual | Board |
| Control Status Report | Quarterly | Compliance Committee |

---

*This document is reviewed annually and updated to reflect system upgrades, regulatory changes, and control enhancements. For queries, contact compliance@blockchainsecurities.co.uk*`,
    },
    {
      id: 'doc-007',
      name: 'Consumer Protection Policy',
      type: DocumentType.POLICY,
      version: '1.1',
      description: 'FCA Consumer Duty implementation, risk warnings framework, and client protection measures',
      uploadedBy: complianceOfficer.id,
      content: `# CONSUMER PROTECTION POLICY

## BlockChain Securities Ltd

**Version:** 1.1 | **Date:** 31 August 2024 | **Classification:** INTERNAL
**Policy Owner:** Sarah Chen, Chief Compliance Officer
**Board Approved:** 30 August 2024 | **Next Review:** 31 August 2025

---

## 1. POLICY STATEMENT

BlockChain Securities Ltd ("BSL") is committed to delivering good outcomes for all retail consumers and to complying with the FCA Consumer Duty (PS22/9) in its entirety. This Policy establishes BSL's approach to consumer protection across four Consumer Duty outcomes: Products & Services, Price & Value, Consumer Understanding, and Consumer Support.

BSL recognises that cryptoassets are high-risk, speculative investments. Our consumer protection framework is designed to ensure that:
- Retail consumers fully understand the risks before investing
- BSL's products are suitable for the intended target market
- Our fees and charges represent fair value
- Consumers receive the support they need to make informed decisions

**FCA Consumer Duty Effective Date:** 31 July 2023 (existing products/services)

---

## 2. SCOPE

This Policy applies to all services provided to **retail consumers** as defined under the FCA's Consumer Duty. It does not apply to professional clients or eligible counterparties, although BSL applies equivalent standards of fairness and transparency to all client types.

---

## 3. OUTCOME 1: PRODUCTS AND SERVICES

### 3.1 Target Market Assessment

BSL has conducted a comprehensive Target Market Assessment for each product in accordance with FCA guidance FG22/5:

| Product | Target Market | Excluded Clients |
|---|---|---|
| Spot Exchange | Retail consumers with medium-high risk appetite; investment experience with assets |Retail consumers with no investment experience; those in financial difficulty |
| Staking | Retail consumers with medium risk appetite; understanding of lockup risks | Retail consumers requiring liquidity access; those in financial difficulty |
| OTC Trading | Professional clients and experienced retail investors only | Standard retail consumers |

### 3.2 Product Governance

BSL's Product Governance framework requires:
- Formal Target Market Assessment for all new products before launch
- Quarterly review of product performance against consumer outcomes
- Annual review of Target Market Assessment for existing products
- Board sign-off for any product materially outside the defined target market

### 3.3 Appropriateness Assessment

All new retail clients are required to complete an appropriateness assessment before accessing cryptoasset services, in accordance with FCA PS22/10. The assessment covers:

- Understanding that cryptoassets are high-risk investments that may lose all value
- Awareness that BSL is not covered by the Financial Services Compensation Scheme (FSCS)
- Experience with investing in volatile assets
- Financial circumstances and investment objectives

Retail clients who fail the appropriateness assessment are prohibited from using BSL's services. A 24-hour cooling-off period applies to all first-time cryptoasset purchases.

---

## 4. OUTCOME 2: PRICE AND VALUE

### 4.1 Fair Value Assessment

BSL has conducted a Fair Value Assessment across all its retail products and services:

| Fee/Charge | Amount | Assessment |
|---|---|---|
| Trading Fee (Maker) | 0.10% | In line with market; fair value confirmed |
| Trading Fee (Taker) | 0.20% | In line with market; fair value confirmed |
| Custody Fee | 0.15% p.a. | Competitive; transparent disclosure |
| FX Conversion | 0.50% | Disclosed prominently at point of transaction |
| Staking Fee | 12% of rewards | Competitive vs. self-staking; fair value confirmed |
| Withdrawal Fee | £2.50 flat | Cost recovery basis; fair value confirmed |

### 4.2 Fee Transparency

All fees are disclosed:
- On the BSL website pricing page (plain language summary)
- In the Account Agreement at onboarding
- On each transaction confirmation
- In monthly account statements

BSL does not charge hidden fees or receive payment for order flow.

---

## 5. OUTCOME 3: CONSUMER UNDERSTANDING

### 5.1 Risk Warning Framework

BSL has implemented a comprehensive risk warning framework in accordance with FCA PS23/6 and the Cryptoasset Promotions Regime (effective 8 October 2023):

**Statutory Risk Warning (displayed on all marketing materials and at point of investment):**
> *"Don't invest unless you're prepared to lose all the money you invest. This is a high-risk investment and you are unlikely to be protected if something goes wrong. Take 2 minutes to learn more."*

**Additional Risk Disclosures:**
- Volatility warning: Cryptoassets can lose 50%+ of their value rapidly
- No FSCS protection: BSL deposits are not covered by FSCS
- Unregulated custody: Cryptoassets do not benefit from CASS protection in the same way as cash
- Tax implications: Capital gains tax may apply to cryptoasset sales

### 5.2 Customer Communications

All customer communications are assessed against BSL's Communications Policy to ensure they are:
- **Fair, clear, and not misleading** (COBS 4.2)
- **Balanced:** Benefits and risks presented equally
- **Accessible:** Plain language; readability score of 70+ (Flesch-Kincaid)
- **Prominent:** Risk warnings displayed no less prominently than any potential benefits

### 5.3 Financial Promotions

All financial promotions are reviewed by Compliance before publication and approved by the MLRO for AML-related representations. Historical promotional materials have been reviewed for compliance with FCA PS23/6 and corrected where required.

---

## 6. OUTCOME 4: CONSUMER SUPPORT

### 6.1 Customer Support Standards

BSL provides customer support via:
- **Live chat:** Available 09:00–21:00 Monday–Friday; 10:00–18:00 weekends
- **Email support:** compliance@blockchainsecurities.co.uk — response within 2 business days
- **Phone:** 0800 123 4567 — available 09:00–17:00 Monday–Friday
- **Help Centre:** Comprehensive FAQ and tutorial library at help.blockchainsecurities.co.uk

Customer support response times are monitored monthly. Target: 90% of queries responded to within SLA.

### 6.2 Complaints Handling

BSL's complaints handling procedure complies with FCA DISP Rules:

- Complaints may be submitted via email, phone, live chat, or post
- Acknowledgement within 24 hours; final response within 8 weeks
- Where BSL cannot resolve within 8 weeks, the complainant is referred to the Financial Ombudsman Service (FOS)
- All complaints are recorded, reviewed monthly by Compliance, and root-cause-analysed quarterly

**Complaints Statistics (FY2023):** 47 formal complaints received; 45 resolved within 8 weeks; 2 referred to FOS; 0 upheld by FOS.

### 6.3 Vulnerable Customers

BSL has implemented a Vulnerable Customer Policy recognising that some retail consumers may be in circumstances that make them more susceptible to harm:

- Front-line staff trained to identify signs of vulnerability (financial distress, bereavement, health issues)
- Vulnerable customer flag available in customer accounts with enhanced support measures
- Referral pathway to MoneyHelper and BeGambleAware for customers showing signs of financial harm

---

## 7. CONSUMER DUTY MONITORING

BSL monitors Consumer Duty outcomes through:
- **Monthly:** Customer satisfaction scores (target NPS > 40); complaint rates
- **Quarterly:** Fair value assessment review; target market performance
- **Annually:** Consumer Duty Board Champion report; Product reviews

The Board has appointed Alex Thompson as Consumer Duty Board Champion, responsible for ensuring Consumer Duty is embedded in BSL's strategy and culture.

---

*Queries regarding this Policy should be directed to compliance@blockchainsecurities.co.uk. This Policy is reviewed annually and following any material FCA guidance.*`,
    },
    {
      id: 'doc-008',
      name: 'Compliance Monitoring Plan',
      type: DocumentType.PROCEDURE,
      version: '2024/1',
      description: 'Annual compliance monitoring programme — risk-based testing schedule and reporting framework',
      uploadedBy: complianceOfficer.id,
      content: `# COMPLIANCE MONITORING PLAN

## BlockChain Securities Ltd — 2024 Annual Programme

**Version:** 2024/1 | **Date:** 8 January 2024 | **Classification:** INTERNAL
**Document Owner:** Sarah Chen, Chief Compliance Officer
**Approved by:** Board Risk & Compliance Committee | **Period:** January–December 2024

---

## 1. INTRODUCTION AND OBJECTIVES

This Compliance Monitoring Plan ("the Plan") sets out BSL's programme of compliance monitoring activity for the period January to December 2024. The Plan is designed to provide the Board and Senior Management with reasonable assurance that:

1. BSL complies with applicable regulatory obligations under MLR 2017, FSMA 2000, and FCA rules
2. BSL's compliance controls are operating effectively
3. Regulatory risks are identified and escalated in a timely manner
4. BSL's AML/CTF framework is proportionate to its risk profile

The Plan adopts a **risk-based approach**, prioritising monitoring activity in areas of greatest regulatory risk and where previous reviews have identified weaknesses.

---

## 2. GOVERNANCE

### 2.1 Responsibilities

| Role | Responsibility |
|---|---|
| Chief Compliance Officer (Sarah Chen) | Ownership of the Plan; allocation of monitoring resource; reporting to Board |
| Compliance Team (4 FTEs) | Execution of monitoring reviews; preparation of reports |
| Risk Manager (James Okafor) | Input on risk prioritisation; joint reviews where risk and compliance overlap |
| Internal Audit (Emma Williams) | Independent review of monitoring programme effectiveness (Q4) |
| Risk & Compliance Committee | Quarterly review of monitoring findings; approval of remediation plans |

### 2.2 Monitoring Methodology

Reviews are conducted using the following methodology:

1. **Planning:** Define scope, objectives, and sampling approach
2. **Fieldwork:** Document review, system testing, staff interviews, file sampling
3. **Reporting:** Draft findings and recommendations; management response
4. **Tracking:** Actions logged in compliance system; progress reviewed quarterly
5. **Closure:** Actions signed off by CCO when remediated

---

## 3. 2024 MONITORING PROGRAMME

### Q1 (January–March 2024)

| Review | Scope | Risk Basis | Owner |
|---|---|---|---|
| CDD Quality Review | Sample of 150 customer files from Q4 2023 onboarding | High — AML risk | Compliance Team |
| Sanctions Screening Effectiveness | End-to-end testing of real-time screening; match resolution process | High — Regulatory risk | Compliance Team |
| FCA Application Stage Review | Assessment of PRE_APPLICATION and BUSINESS_PLAN stages | High — Authorisation risk | CCO |
| Consumer Duty Readiness Assessment | Gap analysis against FCA FG22/5 outcomes | High — FCA priority | CCO + Risk Manager |

### Q2 (April–June 2024)

| Review | Scope | Risk Basis | Owner |
|---|---|---|---|
| Transaction Monitoring Effectiveness | Rules testing; alert disposition quality; backtesting | Critical — AML risk | Compliance Team |
| Travel Rule Gap Assessment | Assessment of Travel Rule compliance readiness | Critical — Regulatory risk | CCO |
| SM&CR Conduct Rules Training | Training completion rates; Conduct Rules awareness testing | High — Regulatory risk | Compliance Team |
| Systems & Controls Documentation | Review of S&C documentation for FCA application | High — Authorisation risk | CCO |

### Q3 (July–September 2024)

| Review | Scope | Risk Basis | Owner |
|---|---|---|---|
| AML/CTF Framework Review | Policies, procedures, and controls effectiveness | High — AML risk | CCO |
| Custody Controls Audit | Cold/hot storage controls; key management procedures | High — Operational risk | Risk Manager |
| Financial Promotions Review | Review of all promotions for compliance with FCA PS23/6 | High — Consumer protection | Compliance Team |
| Consumer Duty Progress Review | Assessment against Consumer Duty implementation plan | High — FCA priority | CCO |

### Q4 (October–December 2024)

| Review | Scope | Risk Basis | Owner |
|---|---|---|---|
| Annual AML/CTF Risk Assessment Review | Update FWRA; reassess customer and product risk ratings | Annual requirement | CCO |
| REP-CRIM Preparation | Data gathering and review for annual financial crime report | Regulatory requirement | Compliance Team |
| Annual Compliance Review | Overall assessment of compliance posture; Board presentation | Governance requirement | CCO |
| Internal Audit: Compliance Monitoring | Review of monitoring programme effectiveness | Governance requirement | Internal Audit (Emma Williams) |

---

## 4. RISK-BASED PRIORITISATION

The monitoring programme is prioritised based on the following risk factors:

- **Regulatory Priority Areas (FCA):** AML/CTF, Consumer Duty, Travel Rule, Financial Promotions
- **Internal Risk Register:** High/Critical risk areas receive enhanced monitoring
- **Prior Findings:** Areas with open remediation actions receive follow-up reviews
- **Regulatory Developments:** New rules (FCA PS24/1) assessed for compliance impact

### 4.1 Risk Ratings for 2024 Monitoring

| Area | Inherent Risk | Control Effectiveness | Residual Risk | Monitoring Frequency |
|---|---|---|---|---|
| AML/CTF | High | Adequate | Medium | Quarterly |
| Consumer Duty | High | Developing | High | Monthly KPIs; quarterly deep dive |
| Travel Rule | Critical | Inadequate | Critical | Monthly until resolved |
| Financial Promotions | Medium | Good | Low | Annual |
| Custody Controls | High | Good | Medium | Semi-annual |
| SM&CR | Medium | Adequate | Low-Medium | Annual |

---

## 5. REPORTING FRAMEWORK

### 5.1 Internal Reporting

| Report | Frequency | Audience | Format |
|---|---|---|---|
| Compliance Monitoring Dashboard | Weekly | CCO, CEO | Digital dashboard |
| Monitoring Review Reports | Per review | Risk Committee | Written report with RAG ratings |
| Quarterly Compliance Report | Quarterly | Board | Executive summary + detailed appendix |
| Annual MLRO Report | Annual | Board | Formal report per MLR 2017 requirement |

### 5.2 RAG Rating Framework

All monitoring findings are rated using a standard Red/Amber/Green (RAG) framework:

- **Red (Critical):** Regulatory breach or significant risk of regulatory breach; immediate action required; Board escalation
- **Amber (Significant):** Control weakness requiring prompt remediation; Risk Committee escalation; 30-day action plan
- **Green (Minor):** Enhancement opportunity; 90-day action plan; tracked through compliance system

### 5.3 Action Tracking

All monitoring findings are logged as actions in the CryptoComply compliance system with:
- Assigned owner and due date
- Priority rating (Critical/High/Medium/Low)
- Progress notes and evidence of completion
- Escalation pathway if overdue

---

## 6. RESOURCES

### 6.1 Monitoring Resource Allocation (2024)

| Team Member | Role | Monitoring Days Allocated |
|---|---|---|
| Sarah Chen | CCO / Programme Owner | 25 days |
| Compliance Analyst 1 | Primary reviewer | 45 days |
| Compliance Analyst 2 | Support reviewer | 30 days |
| Compliance Analyst 3 | AML specialist | 35 days |
| Risk Manager | Joint reviews | 15 days |
| Internal Audit | Q4 programme review | 10 days |

**Total Monitoring Investment: 160 days (£320,000 staff cost equivalent)**

---

## 7. ANNUAL REVIEW

This Plan will be reviewed at the end of Q4 2024 and updated for the 2025 monitoring year, taking into account:

- Findings from 2024 monitoring activity
- Changes in regulatory requirements (FCA PS24/1 implementation, Consumer Duty updates)
- Changes in BSL's business model, risk profile, or customer base
- Internal Audit recommendations on monitoring programme effectiveness

---

*This Plan is approved by the Board Risk & Compliance Committee and is subject to change if material regulatory developments require re-prioritisation. Queries: compliance@blockchainsecurities.co.uk*`,
    },
  ]

  for (const doc of documents) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: { name: doc.name, description: doc.description, type: doc.type, version: doc.version, content: doc.content },
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
    { id: 'action-001', title: 'Implement Travel Rule Solution', description: 'Evaluate and implement a FATF Travel Rule solution (consider Notabene, Sygna, or TRISA) for VASP-to-VASP transfers. Complete technical integration and testing.', status: 'IN_PROGRESS', priority: RiskLevel.CRITICAL, dueDate: new Date('2024-07-31'), ownerId: complianceOfficer.id, controlRef: 'AML-005' },
    { id: 'action-002', title: 'Complete SM&CR Certification', description: 'Complete outstanding SM&CR Certification for 3 remaining Certified Persons. Update Conduct Rules training records.', status: 'IN_PROGRESS', priority: RiskLevel.HIGH, dueDate: new Date('2024-06-30'), ownerId: adminUser.id, controlRef: 'GOV-002' },
    { id: 'action-003', title: 'Proliferation Finance Risk Assessment', description: 'Conduct dedicated proliferation finance risk assessment per FATF guidance and FCA expectations. Document findings and controls.', status: 'OPEN', priority: RiskLevel.HIGH, dueDate: new Date('2024-07-15'), ownerId: complianceOfficer.id, controlRef: 'FC-002' },
    { id: 'action-004', title: 'Upgrade Blockchain Analytics Capability', description: 'Expand blockchain analytics integration to cover DeFi protocol tracing and cross-chain asset flows. Enable real-time risk scoring for all inbound transactions above £1,000.', status: 'IN_PROGRESS', priority: RiskLevel.MEDIUM, dueDate: new Date('2024-08-31'), ownerId: riskManager.id, controlRef: 'AML-008' },
    { id: 'action-005', title: 'Consumer Duty Gap Analysis', description: 'Conduct Consumer Duty gap analysis against FCA guidance FG22/5. Identify and prioritise remediation items.', status: 'OPEN', priority: RiskLevel.HIGH, dueDate: new Date('2024-06-15'), ownerId: complianceOfficer.id, controlRef: 'CP-001' },
    { id: 'action-006', title: 'Custody Insurance Review', description: 'Engage broker to review custody insurance coverage adequacy. Obtain quotes for increased cold storage and crime coverage.', status: 'OPEN', priority: RiskLevel.MEDIUM, dueDate: new Date('2024-07-01'), ownerId: riskManager.id, controlRef: 'CUST-004' },
    { id: 'action-007', title: 'Wind-Down Plan Finalisation', description: 'Finalise wind-down plan with treasury team. Ensure plan covers cryptoasset liquidation scenarios and client notification procedures.', status: 'OPEN', priority: RiskLevel.MEDIUM, dueDate: new Date('2024-08-01'), ownerId: adminUser.id, controlRef: 'FIN-003' },
    { id: 'action-008', title: 'Annual Penetration Test', description: 'Commission annual penetration test with FCA-approved provider. Scope to include new DeFi integrations and mobile app.', status: 'OPEN', priority: RiskLevel.MEDIUM, dueDate: new Date('2024-09-30'), ownerId: adminUser.id, controlRef: 'TECH-003' },
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
