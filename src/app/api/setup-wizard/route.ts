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
  if (assets.has('STABLECOINS') && (locs.has('US') || hq === 'GB')) regs.push('GENIUS Act')
  if (svcs.has('EXCHANGE') || svcs.has('CUSTODY') || assets.size > 0) {
    regs.push('FATF Travel Rule')
  }
  return Array.from(new Set(regs))
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

  // ─── Compliance Map: materialise applicable regulations ─────────────────
  // For each jurisdiction/service combination the wizard identifies, upsert a
  // ComplianceMapEntry for this org so the Compliance Map page reflects the
  // regulatory surface area the firm just declared.
  const applicableNames = computeApplicableRegulations(body)
  const matchedRegs = applicableNames.length
    ? await prisma.regulation.findMany({ where: { name: { in: applicableNames } } })
    : []

  for (const reg of matchedRegs) {
    await prisma.complianceMapEntry.upsert({
      where: { organisationId_regulationId: { organisationId: orgId, regulationId: reg.id } },
      update: { applicable: true },
      create: {
        organisationId: orgId,
        regulationId: reg.id,
        applicable: true,
        status: 'NOT_ASSESSED',
        notes: `Auto-mapped from setup wizard: applies based on operating locations, services, or asset classes selected.`,
      },
    })
  }

  const mappedNames = new Set(matchedRegs.map(r => r.name))
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
        complianceMapEntriesMaterialised: matchedRegs.length,
        applicableRegulations: applicableNames,
      },
      userId: (session.user as any).id,
      organisationId: orgId,
    },
  })

  return NextResponse.json({
    success: true,
    complianceMapEntries: matchedRegs.length,
    applicableRegulations: applicableNames,
    // Warn client if the wizard surfaced regulation names we couldn't find in the DB
    unmatchedRegulations: unmatched,
  })
}
