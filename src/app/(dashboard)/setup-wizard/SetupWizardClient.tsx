'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { id: 1, label: 'Company Details' },
  { id: 2, label: 'Operating Locations' },
  { id: 3, label: 'Workforce & Revenue' },
  { id: 4, label: 'Asset Classes' },
  { id: 5, label: 'Services' },
  { id: 6, label: 'Review & Generate' },
]

const G20_COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
]

const ASSET_CLASSES = [
  { code: 'EXCHANGE_TOKENS', label: 'Exchange Tokens', desc: 'Bitcoin, Ether and similar proof-of-work/stake tokens', icon: '₿' },
  { code: 'SECURITY_TOKENS', label: 'Security Tokens', desc: 'Tokenised securities, equity, debt instruments', icon: '📜' },
  { code: 'STABLECOINS', label: 'Stablecoins', desc: 'Fiat-backed, algo, or commodity-backed stablecoins', icon: '💲' },
  { code: 'UTILITY_TOKENS', label: 'Utility Tokens', desc: 'Platform access and governance tokens', icon: '🔧' },
  { code: 'NFTS', label: 'NFTs', desc: 'Non-fungible tokens and digital collectibles', icon: '🎨' },
  { code: 'DEFI_TOKENS', label: 'DeFi Tokens', desc: 'Liquidity, yield, and protocol governance tokens', icon: '🏦' },
  { code: 'CBDCS', label: 'CBDCs', desc: 'Central Bank Digital Currencies', icon: '🏛️' },
  { code: 'ASSET_BACKED', label: 'Asset-Backed Tokens', desc: 'Real estate, commodities, and other RWA tokens', icon: '🏘️' },
]

const SERVICES = [
  { code: 'EXCHANGE', label: 'Cryptoasset Exchange', desc: 'Spot trading, order books, market making', icon: '↔️' },
  { code: 'CUSTODY', label: 'Custody Services', desc: 'Safeguarding client cryptoassets', icon: '🔒' },
  { code: 'LENDING', label: 'Lending & Borrowing', desc: 'Crypto-backed loans and yield products', icon: '💰' },
  { code: 'STAKING', label: 'Staking Services', desc: 'Proof-of-stake validation and delegation', icon: '⚡' },
  { code: 'PAYMENTS', label: 'Crypto Payments', desc: 'Payment processing and merchant services', icon: '💳' },
  { code: 'ADVISORY', label: 'Investment Advisory', desc: 'Portfolio management and investment advice', icon: '📊' },
  { code: 'OTC', label: 'OTC Trading', desc: 'Over-the-counter institutional trading desk', icon: '🤝' },
  { code: 'ISSUANCE', label: 'Token Issuance', desc: 'Token creation, ICO, STO services', icon: '🪙' },
  { code: 'DEFI', label: 'DeFi Access', desc: 'DeFi protocol access and aggregation', icon: '🌐' },
]

const REVENUE_RANGES = ['Under £1m', '£1m–£5m', '£5m–£10m', '£10m–£50m', '£50m–£250m', 'Over £250m']
const HEADCOUNT_RANGES = ['1–10', '11–50', '51–200', '201–500', '501–1,000', 'Over 1,000']

// Regulation mapping per jurisdiction/service/asset
function computeApplicableRegulations(data: WizardData) {
  const regs: string[] = []
  const locs = new Set(data.locations)
  const svcs = new Set(data.services)
  const assets = new Set(data.assetClasses)

  if (locs.has('GB') || data.hqCountry === 'GB') {
    regs.push('FCA Cryptoassets Regime 2026', 'FSMA 2000', 'MLR 2017', 'SM&CR', 'UK GDPR', 'OFSI Sanctions', 'FCA Consumer Duty')
  }
  if (locs.has('DE') || locs.has('FR') || locs.has('IT') || locs.has('EU')) {
    regs.push('MiCA', 'AMLD6')
  }
  if (locs.has('US') || locs.has('SG')) {
    if (locs.has('US')) regs.push('BSA/FinCEN', 'FATCA', 'SEC Exchange Act')
    if (locs.has('SG')) regs.push('MAS Payment Services Act')
  }
  if (locs.has('JP')) regs.push('Japan PSA (JFSA)')
  if (locs.has('AU')) regs.push('ASIC Framework')
  if (locs.has('CA')) regs.push('CSA Framework')
  if (locs.has('KR')) regs.push('Korea VAUPA')
  if (assets.has('STABLECOINS') && (locs.has('US') || data.hqCountry === 'GB')) {
    if (!regs.includes('GENIUS Act (US Stablecoin)')) regs.push('GENIUS Act (US Stablecoin)')
  }
  if (svcs.has('EXCHANGE') || svcs.has('CUSTODY') || assets.size > 0) {
    regs.push('FATF Travel Rule', 'FATF 40 Recommendations', 'CRS/CARF')
  }
  return Array.from(new Set(regs))
}

interface WizardData {
  // Step 1
  companyName: string
  frn: string
  hqCountry: string
  hqCity: string
  incorporationDate: string
  // Step 2
  locations: string[]
  // Step 3
  headcount: string
  revenue: string
  clientCount: string
  // Step 4
  assetClasses: string[]
  // Step 5
  services: string[]
}

export function SetupWizardClient({ org }: { org: any }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [complete, setComplete] = useState(false)
  const [generatedSummary, setGeneratedSummary] = useState<{ regulations: string[]; controls: number; jurisdictions: number } | null>(null)

  // Pre-fill from existing org data
  const [data, setData] = useState<WizardData>({
    companyName: org?.name ?? 'BlockChain Securities Ltd',
    frn: org?.fcaReferenceNumber ?? 'FRN 987654',
    hqCountry: 'GB',
    hqCity: 'London',
    incorporationDate: org?.incorporationDate?.slice(0, 10) ?? '2019-06-15',
    locations: org?.profile?.operatingLocations?.map((l: any) => l.countryCode) ?? ['GB', 'DE', 'SG'],
    headcount: org?.profile?.headcountRange ?? '51-200',
    revenue: org?.profile?.revenueRange ?? '10-50m',
    clientCount: '1500',
    assetClasses: org?.profile?.assetTypes?.map((a: any) => a.code) ?? ['EXCHANGE_TOKENS', 'STABLECOINS', 'UTILITY_TOKENS', 'SECURITY_TOKENS', 'NFTS'],
    services: org?.profile?.serviceTypes?.map((s: any) => s.code) ?? ['EXCHANGE', 'CUSTODY', 'STAKING', 'OTC'],
  })

  function update(patch: Partial<WizardData>) {
    setData(prev => ({ ...prev, ...patch }))
  }

  function toggleArr(key: 'locations' | 'assetClasses' | 'services', val: string) {
    setData(prev => {
      const arr = prev[key] as string[]
      return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  async function handleGenerate() {
    setSaving(true)
    try {
      await fetch('/api/setup-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const regs = computeApplicableRegulations(data)
      setGeneratedSummary({
        regulations: regs,
        controls: 50,
        jurisdictions: new Set([data.hqCountry, ...data.locations]).size,
      })
      setComplete(true)
    } finally {
      setSaving(false)
    }
  }

  if (complete && generatedSummary) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Framework Generated</h1>
          <p className="text-gray-500 text-lg mb-8">
            {data.companyName}&apos;s tailored compliance framework has been created
          </p>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="card p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-1">{generatedSummary.controls}</div>
              <div className="text-sm font-medium text-gray-700">Controls Generated</div>
              <div className="text-xs text-gray-400 mt-0.5">across 9 compliance domains</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-4xl font-bold text-purple-600 mb-1">{generatedSummary.regulations.length}</div>
              <div className="text-sm font-medium text-gray-700">Regulations Mapped</div>
              <div className="text-xs text-gray-400 mt-0.5">applicable to your profile</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-4xl font-bold text-green-600 mb-1">{generatedSummary.jurisdictions}</div>
              <div className="text-sm font-medium text-gray-700">Jurisdictions Covered</div>
              <div className="text-xs text-gray-400 mt-0.5">based on your operations</div>
            </div>
          </div>

          <div className="card p-5 text-left mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Applicable Regulations Identified</h3>
            <div className="flex flex-wrap gap-2">
              {generatedSummary.regulations.map(r => (
                <span key={r} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => router.push('/controls')} className="btn-primary">
              View Compliance Controls
            </button>
            <button onClick={() => router.push('/compliance-map')} className="btn-secondary">
              View Compliance Map
            </button>
            <button onClick={() => { setComplete(false); setStep(1) }} className="btn-secondary">
              Run Wizard Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Organisation Setup Wizard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Complete your organisation profile to generate a tailored compliance framework</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => s.id < step ? setStep(s.id) : undefined}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${
                s.id < step ? 'bg-green-500 text-white cursor-pointer' :
                s.id === step ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}
            >
              {s.id < step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : s.id}
            </button>
            <div className={`ml-2 text-xs font-medium hidden sm:block ${s.id === step ? 'text-blue-600' : s.id < step ? 'text-green-600' : 'text-gray-400'}`}>
              {s.label}
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${s.id < step ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card p-6">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Company Details</h2>
              <p className="text-sm text-gray-500">Basic information about your organisation</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" value={data.companyName} onChange={e => update({ companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FCA Reference Number (FRN)</label>
                <input type="text" placeholder="FRN 000000" value={data.frn} onChange={e => update({ frn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incorporation Date</label>
                <input type="date" value={data.incorporationDate} onChange={e => update({ incorporationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HQ Country *</label>
                <select value={data.hqCountry} onChange={e => update({ hqCountry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {G20_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HQ City *</label>
                <input type="text" value={data.hqCity} onChange={e => update({ hqCity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Operating Locations</h2>
              <p className="text-sm text-gray-500">Select all countries where you have offices or operations</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {G20_COUNTRIES.map(c => {
                const selected = data.locations.includes(c.code)
                return (
                  <button key={c.code} type="button" onClick={() => toggleArr('locations', c.code)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                    <span className="text-lg">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                    {selected && <svg className="w-4 h-4 ml-auto flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                )
              })}
            </div>
            {data.locations.length > 0 && (
              <p className="text-xs text-blue-600 font-medium">{data.locations.length} location{data.locations.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Workforce & Revenue</h2>
              <p className="text-sm text-gray-500">Used to determine applicable regulatory thresholds</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Staff</label>
              <div className="grid grid-cols-3 gap-2">
                {HEADCOUNT_RANGES.map(r => (
                  <button key={r} type="button" onClick={() => update({ headcount: r })}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${data.headcount === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Revenue Range</label>
              <div className="grid grid-cols-3 gap-2">
                {REVENUE_RANGES.map(r => (
                  <button key={r} type="button" onClick={() => update({ revenue: r })}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${data.revenue === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approximate Number of Clients</label>
              <input type="number" placeholder="e.g. 1500" value={data.clientCount} onChange={e => update({ clientCount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Asset Classes</h2>
              <p className="text-sm text-gray-500">Select all crypto asset classes your organisation works with</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ASSET_CLASSES.map(a => {
                const selected = data.assetClasses.includes(a.code)
                return (
                  <button key={a.code} type="button" onClick={() => toggleArr('assetClasses', a.code)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <span className="text-2xl mt-0.5">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-gray-900'}`}>{a.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{a.desc}</div>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Services</h2>
              <p className="text-sm text-gray-500">What services does your organisation provide?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map(s => {
                const selected = data.services.includes(s.code)
                return (
                  <button key={s.code} type="button" onClick={() => toggleArr('services', s.code)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <span className="text-2xl mt-0.5">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-gray-900'}`}>{s.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Review & Generate</h2>
              <p className="text-sm text-gray-500">Review your organisation profile before generating your compliance framework</p>
            </div>

            <div className="space-y-4">
              <ReviewSection title="Company Details" onEdit={() => setStep(1)}>
                <ReviewRow label="Company Name" value={data.companyName} />
                <ReviewRow label="FRN" value={data.frn || 'Not provided'} />
                <ReviewRow label="Headquarters" value={`${data.hqCity}, ${G20_COUNTRIES.find(c => c.code === data.hqCountry)?.name ?? data.hqCountry}`} />
                <ReviewRow label="Incorporation Date" value={data.incorporationDate} />
              </ReviewSection>

              <ReviewSection title="Operating Locations" onEdit={() => setStep(2)}>
                <div className="flex flex-wrap gap-1.5">
                  {data.locations.map(code => {
                    const c = G20_COUNTRIES.find(x => x.code === code)
                    return c ? (
                      <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {c.flag} {c.name}
                      </span>
                    ) : null
                  })}
                </div>
              </ReviewSection>

              <ReviewSection title="Workforce & Revenue" onEdit={() => setStep(3)}>
                <ReviewRow label="Staff" value={data.headcount} />
                <ReviewRow label="Revenue" value={data.revenue} />
                <ReviewRow label="Clients" value={data.clientCount ? `~${Number(data.clientCount).toLocaleString()}` : 'Not provided'} />
              </ReviewSection>

              <ReviewSection title="Asset Classes" onEdit={() => setStep(4)}>
                <div className="flex flex-wrap gap-1.5">
                  {data.assetClasses.map(code => {
                    const a = ASSET_CLASSES.find(x => x.code === code)
                    return a ? (
                      <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        {a.icon} {a.label}
                      </span>
                    ) : null
                  })}
                </div>
              </ReviewSection>

              <ReviewSection title="Services" onEdit={() => setStep(5)}>
                <div className="flex flex-wrap gap-1.5">
                  {data.services.map(code => {
                    const s = SERVICES.find(x => x.code === code)
                    return s ? (
                      <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                        {s.icon} {s.label}
                      </span>
                    ) : null
                  })}
                </div>
              </ReviewSection>

              {/* Preview of what will be generated */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-sm font-semibold text-blue-800 mb-2">Estimated Framework Output</div>
                <div className="text-sm text-blue-700">
                  Based on your profile, we will generate:
                </div>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>• <strong>50 compliance controls</strong> across 9 domains</li>
                  <li>• <strong>{computeApplicableRegulations(data).length} applicable regulations</strong> mapped to your activities</li>
                  <li>• <strong>{new Set([data.hqCountry, ...data.locations]).size} jurisdiction{new Set([data.hqCountry, ...data.locations]).size !== 1 ? 's' : ''}</strong> coverage</li>
                  <li>• Tailored FCA application tracker with 8 stages</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <div className="text-xs text-gray-400">Step {step} of {STEPS.length}</div>
        {step < 6 ? (
          <button onClick={() => setStep(s => s + 1)} className="btn-primary">
            Next →
          </button>
        ) : (
          <button onClick={handleGenerate} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Generating...' : 'Generate Compliance Framework'}
          </button>
        )}
      </div>
    </div>
  )
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-700">{title}</div>
        <button onClick={onEdit} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value}</span>
    </div>
  )
}
