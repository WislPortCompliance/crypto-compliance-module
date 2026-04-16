import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  await prisma.auditLog.create({
    data: {
      action: 'SETUP_WIZARD_COMPLETED',
      entityType: 'Organisation',
      entityId: orgId,
      newValues: { locations: locations?.length, assetClasses: assetClasses?.length, services: services?.length },
      userId: (session.user as any).id,
      organisationId: orgId,
    },
  })

  return NextResponse.json({ success: true })
}
