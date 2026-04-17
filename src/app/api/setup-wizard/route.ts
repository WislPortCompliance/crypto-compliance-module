import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mirror of computeApplicableRegulations from SetupWizardClient — kept server-side
// so we can persist to ComplianceMapEntry without trusting the client.
function computeApplicableRegulations(body: any): string[] {
  const regs: string[] = []
  const locs = new Set<string>(body.locations ?? [])
  const svcs = new Set<string>(body.services ?? [])
  const assets = new Set<string>(body.assetClasses ?? [])
  const hq = body.hqCountry ?? 'GB'

  if (locs.has('GB') || hq === 'GB') {
    regs.push('FCA Cryptoassets Regime 2026', 'FSMA 2000', 'MLR 2017', 'SM&CR', 'UK GDPR', 'OFSI Sanctions', 'FCA Consumer Duty')
  }
  if (locs.has('DE') || locs.has('FR') || locs.has('IT') || locs.has('EU')) {
    regs.push('MiCA', 'AMLD6')
  }
  if (locs.has('US')) regs.push('BSA/FinCEN', 'FATCA', 'SEC Exchange Act')
  if (locs.has('SG')) regs.push('MAS PSA')
  if (locs.has('JP')) regs.push('Japan PSA')
  if (locs.has('AU')) regs.push('ASIC Framework')
  if (locs.has('CA')) regs.push('CSA Framework')
  if (locs.has('KR')) regs.push('Korea VAUPA')
  if (locs.has('GI')) regs.push('Gibraltar DLT Framework')
  if (locs.has('NG')) regs.push('Nigeria SEC Digital Assets Rules')
  if (locs.has('ZA')) regs.push('South Africa FSCA Crypto-Asset Framework')
  if (locs.has('SA')) regs.push('SAMA Digital Assets')
  if (locs.has('BR')) regs.push('Brazil Crypto Law')
  if (locs.has('IN')) regs.push('India VDA Framework')
  if (assets.has('STABLECOINS') && (locs.has('US') || hq === 'GB')) regs.push('GENIUS Act')
  if (svcs.has('EXCHANGE') || svcs.has('CUSTODY') || assets.size > 0) {
    regs.push('FATF Travel Rule')
  }
  return Array.from(new Set(regs))
}

// ─── Wizard-managed regulations ─────────────────────────────────────────────
// Regulations whose applicability is determined by the wizard's inputs
// (jurisdiction / service / asset selections). When a jurisdiction is removed,
// these entries are flipped to applicable=false. Regulations NOT on this list
// (ISO, FATF 40 Recs, CRS, Wolfsburg, Basel) are always-on for a crypto VASP
// and never demoted by the wizard.
const WIZARD_MANAGED_REGULATION_NAMES = new Set<string>([
  // UK
  'FCA Cryptoassets Regime 2026', 'FSMA 2000', 'MLR 2017', 'SM&CR', 'UK GDPR', 'OFSI Sanctions', 'FCA Consumer Duty',
  // EU
  'MiCA', 'AMLD6',
  // US
  'BSA/FinCEN', 'FATCA', 'SEC Exchange Act', 'GENIUS Act',
  // APAC
  'MAS PSA', 'Japan PSA', 'Korea VAUPA',
  // Other
  'ASIC Framework', 'CSA Framework',
  'Gibraltar DLT Framework', 'Nigeria SEC Digital Assets Rules', 'South Africa FSCA Crypto-Asset Framework',
  'SAMA Digital Assets', 'Brazil Crypto Law', 'India VDA Framework',
  // FATF Travel Rule — service/asset gated, so managed
  'FATF Travel Rule',
])

// ─── Tracker shell templates ────────────────────────────────────────────────
// When the wizard detects a jurisdiction that warrants FCA or MiCA authorisation,
// it provisions a skeletal tracker (8 stages, status NOT_STARTED) so the dashboard
// and sidebar surface the right frameworks. Rich requirement content is still
// sourced from the main seed for the demo org; for brand-new orgs, this gives
// them the scaffolding to begin populating.
const FCA_STAGE_SHELLS = [
  { stage: 'PRE_APPLICATION',     title: 'Pre-Application Assessment',        order: 1 },
  { stage: 'BUSINESS_PLAN',       title: 'Business Plan & Governance',        order: 2 },
  { stage: 'FINANCIAL_RESOURCES', title: 'Financial Resources Assessment',    order: 3 },
  { stage: 'SYSTEMS_CONTROLS',    title: 'Systems & Controls Setup',          order: 4 },
  { stage: 'AML_CTF',             title: 'AML/CTF Framework',                 order: 5 },
  { stage: 'CONSUMER_PROTECTION', title: 'Consumer Protection Measures',      order: 6 },
  { stage: 'SUBMISSION',          title: 'Application Submission',            order: 7 },
  { stage: 'POST_APPROVAL',       title: 'Post-Approval Monitoring',          order: 8 },
]
const MICA_STAGE_SHELLS = [
  { stage: 'PRE_APPLICATION',     title: 'Pre-Application & Regulatory Perimeter', order: 1 },
  { stage: 'BUSINESS_PLAN',       title: 'Programme of Operations & Governance',   order: 2 },
  { stage: 'FINANCIAL_RESOURCES', title: 'Prudential Requirements (Art. 67)',      order: 3 },
  { stage: 'SYSTEMS_CONTROLS',    title: 'ICT & Operational Resilience (DORA)',    order: 4 },
  { stage: 'AML_CTF',             title: 'AML/CTF under AMLD6 & TFR 2023/1113',    order: 5 },
  { stage: 'CONSUMER_PROTECTION', title: 'Client Protection & Asset Safeguarding', order: 6 },
  { stage: 'SUBMISSION',          title: 'NCA Application & White Paper',          order: 7 },
  { stage: 'POST_APPROVAL',       title: 'Passporting & Ongoing Obligations',      order: 8 },
]

async function provisionTrackerIfMissing(orgId: string, framework: 'FCA' | 'MICA') {
  const existing = await prisma.fCAApplicationStage.count({ where: { organisationId: orgId, framework: framework as any } })
  if (existing > 0) return 0
  const shells = framework === 'FCA' ? FCA_STAGE_SHELLS : MICA_STAGE_SHELLS
  for (const s of shells) {
    await prisma.fCAApplicationStage.create({
      data: {
        stage: s.stage as any,
        framework: framework as any,
        title: s.title,
        order: s.order,
        status: 'NOT_STARTED',
        organisationId: orgId,
      },
    })
  }
  return shells.length
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organisationId
  const body = await req.json()
  const { companyName, frn, hqCity, incorporationDate, locations, headcount, revenue, clientCount, assetClasses, services } = body

  // Update organisation
  await prisma.organisation.update({
    where: { id: orgId },
    data: {
      name: companyName,
      fcaReferenceNumber: frn || null,
      incorporationDate: incorporationDate ? new Date(incorporationDate) : null,
    },
  })

  // Upsert profile
  const profile = await prisma.organisationProfile.upsert({
    where: { organisationId: orgId },
    update: {
      headcountRange: headcount,
      revenueRange: revenue,
    },
    create: {
      organisationId: orgId,
      headcountRange: headcount,
      revenueRange: revenue,
      customerTypes: ['retail', 'professional'],
    },
  })

  // Replace operating locations
  await prisma.operatingLocation.deleteMany({ where: { profileId: profile.id } })
  for (const code of (locations as string[])) {
    const countryNames: Record<string, string> = {
      GB: 'United Kingdom', US: 'United States', EU: 'European Union', DE: 'Germany',
      FR: 'France', IT: 'Italy', JP: 'Japan', CN: 'China', AU: 'Australia', CA: 'Canada',
      SG: 'Singapore', KR: 'South Korea', BR: 'Brazil', IN: 'India', SA: 'Saudi Arabia',
      ZA: 'South Africa', MX: 'Mexico', AR: 'Argentina', TR: 'Turkey', ID: 'Indonesia',
      AE: 'UAE', CH: 'Switzerland', HK: 'Hong Kong',
      GI: 'Gibraltar', NG: 'Nigeria',
    }
    await prisma.operatingLocation.create({
      data: {
        country: countryNames[code] ?? code,
        countryCode: code,
        isPrimary: code === (body.hqCountry ?? 'GB'),
        profileId: profile.id,
      },
    })
  }

  // Replace asset types
  await prisma.assetType.deleteMany({ where: { profileId: profile.id } })
  for (const code of (assetClasses as string[])) {
    const labels: Record<string, string> = {
      EXCHANGE_TOKENS: 'Exchange Tokens', SECURITY_TOKENS: 'Security Tokens',
      STABLECOINS: 'Stablecoins', UTILITY_TOKENS: 'Utility Tokens', NFTS: 'NFTs',
      DEFI_TOKENS: 'DeFi Tokens', CBDCS: 'CBDCs', ASSET_BACKED: 'Asset-Backed Tokens',
    }
    await prisma.assetType.create({
      data: { name: labels[code] ?? code, code, profileId: profile.id },
    })
  }

  // Replace service types
  await prisma.serviceType.deleteMany({ where: { profileId: profile.id } })
  for (const code of (services as string[])) {
    const labels: Record<string, string> = {
      EXCHANGE: 'Cryptoasset Exchange', CUSTODY: 'Custody Services', LENDING: 'Lending & Borrowing',
      STAKING: 'Staking Services', PAYMENTS: 'Crypto Payments', ADVISORY: 'Investment Advisory',
      OTC: 'OTC Trading', ISSUANCE: 'Token Issuance', DEFI: 'DeFi Access',
    }
    await prisma.serviceType.create({
      data: { name: labels[code] ?? code, code, profileId: profile.id },
    })
  }

  // ─── Compliance Map: sync applicable regulations (add + demote) ─────────
  // Two-pass update:
  //   1. Promote: upsert ComplianceMapEntry rows for every regulation the
  //      wizard determines applicable (applicable=true).
  //   2. Demote: for every wizard-managed regulation that is NOT in the new
  //      applicable list, if an existing entry says applicable=true, flip
  //      it to applicable=false (preserving the status field so prior
  //      compliance assessment isn't lost).
  // Non-managed regulations (ISO 27001, ISO 23635, FATF 40, CRS, Wolfsburg,
  // Basel) are never touched here — they remain as the user/seed set them.
  const applicableNames = computeApplicableRegulations(body)

  // Pull all wizard-managed regulations from DB in a single query.
  const managedNames = Array.from(WIZARD_MANAGED_REGULATION_NAMES)
  const managedRegs = await prisma.regulation.findMany({ where: { name: { in: managedNames } } })
  const applicableIdSet = new Set(managedRegs.filter(r => applicableNames.includes(r.name)).map(r => r.id))

  // Promote — upsert applicable=true for each currently-applicable regulation.
  let promoted = 0
  for (const reg of managedRegs) {
    if (!applicableIdSet.has(reg.id)) continue
    await prisma.complianceMapEntry.upsert({
      where: { organisationId_regulationId: { organisationId: orgId, regulationId: reg.id } },
      update: {
        applicable: true,
        notes: `Auto-mapped from setup wizard: applies based on operating locations, services, or asset classes selected.`,
      },
      create: {
        organisationId: orgId,
        regulationId: reg.id,
        applicable: true,
        status: 'NOT_ASSESSED',
        notes: `Auto-mapped from setup wizard: applies based on operating locations, services, or asset classes selected.`,
      },
    })
    promoted++
  }

  // Demote — flip existing entries to applicable=false for managed regs that
  // are NO LONGER in the applicable list. Preserve status so any prior
  // compliance work isn't lost; user can restore by re-selecting jurisdiction.
  const toDemote = managedRegs.filter(r => !applicableIdSet.has(r.id))
  let demoted = 0
  if (toDemote.length > 0) {
    const result = await prisma.complianceMapEntry.updateMany({
      where: {
        organisationId: orgId,
        regulationId: { in: toDemote.map(r => r.id) },
        applicable: true,
      },
      data: {
        applicable: false,
        notes: `Flipped to not-applicable by setup wizard: the originating jurisdiction/service/asset selection was removed.`,
      },
    })
    demoted = result.count
  }

  // ─── Authorisation Trackers: auto-provision shells when applicable ──────
  // If the user selects UK (or HQ=GB) and has no FCA stages, create the 8-stage
  // FCA tracker shell. Likewise for EU selections and the MiCA tracker.
  // Existing stages are never overwritten — this only provisions if missing.
  const locs = new Set<string>(locations ?? [])
  const hq = body.hqCountry ?? 'GB'
  let fcaStagesCreated = 0
  let micaStagesCreated = 0
  if (locs.has('GB') || hq === 'GB') {
    fcaStagesCreated = await provisionTrackerIfMissing(orgId, 'FCA')
  }
  if (locs.has('DE') || locs.has('FR') || locs.has('IT') || locs.has('EU')) {
    micaStagesCreated = await provisionTrackerIfMissing(orgId, 'MICA')
  }

  // Unmatched = regulations the wizard said apply but which we don't have in DB.
  // Useful for surfacing seed gaps during development; harmless otherwise.
  const mappedNames = new Set(managedRegs.map(r => r.name))
  const unmatched = applicableNames.filter(n => !mappedNames.has(n))

  await prisma.auditLog.create({
    data: {
      action: 'SETUP_WIZARD_COMPLETED',
      entityType: 'Organisation',
      entityId: orgId,
      newValues: {
        locations: locations?.length,
        assetClasses: assetClasses?.length,
        services: services?.length,
        complianceMapPromoted: promoted,
        complianceMapDemoted: demoted,
        fcaStagesProvisioned: fcaStagesCreated,
        micaStagesProvisioned: micaStagesCreated,
        applicableRegulations: applicableNames,
      },
      userId: (session.user as any).id,
      organisationId: orgId,
    },
  })

  return NextResponse.json({
    success: true,
    complianceMapPromoted: promoted,
    complianceMapDemoted: demoted,
    fcaStagesProvisioned: fcaStagesCreated,
    micaStagesProvisioned: micaStagesCreated,
    applicableRegulations: applicableNames,
    unmatchedRegulations: unmatched,
  })
}
