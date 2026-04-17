export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TRACKER_METADATA } from '@/lib/authorisation/tracker-data'

export default async function AuthorisationIndexPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const orgId = (session?.user as any)?.organisationId

  // Fetch all stages for this org across all frameworks, grouped client-side
  const allStages = await prisma.fCAApplicationStage.findMany({
    where: { organisationId: orgId },
    include: { requirements: { select: { id: true, status: true } } },
    orderBy: { order: 'asc' },
  })

  // Group by framework
  const byFramework = new Map<string, typeof allStages>()
  for (const s of allStages) {
    const arr = byFramework.get(s.framework) ?? []
    arr.push(s)
    byFramework.set(s.framework, arr)
  }

  // Build tracker cards with progress
  const activeTrackers = TRACKER_METADATA
    .map(meta => {
      const stages = byFramework.get(meta.framework) ?? []
      if (stages.length === 0) return null
      const totalReqs = stages.reduce((sum, s) => sum + s.requirements.length, 0)
      const doneReqs = stages.reduce((sum, s) => sum + s.requirements.filter((r: any) => r.status === 'COMPLETE').length, 0)
      const progress = totalReqs > 0 ? Math.round((doneReqs / totalReqs) * 100) : 0
      const completedStages = stages.filter(s => s.status === 'COMPLETE').length
      const inProgress = stages.some(s => s.status === 'IN_PROGRESS')
      return { ...meta, totalStages: stages.length, completedStages, totalReqs, doneReqs, progress, inProgress }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.progress - a.progress)

  const inactiveTrackers = TRACKER_METADATA.filter(meta => !byFramework.has(meta.framework))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Authorisation Trackers</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {activeTrackers.length} active · {inactiveTrackers.length} available to activate via the setup wizard
        </p>
      </div>

      {/* Active trackers */}
      {activeTrackers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeTrackers.map(t => (
            <Link key={t.framework} href={t.path} className="card p-5 hover:shadow-md hover:border-blue-300 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{t.regulatorShortName}</div>
                  <h3 className="text-base font-semibold text-gray-900 mt-0.5 leading-tight">{t.displayName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{t.subtitle}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex-shrink-0 ml-2 ${
                  t.progress === 100 ? 'bg-green-100 text-green-700' :
                  t.inProgress ? 'bg-blue-100 text-blue-700' :
                  t.progress > 0 ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {t.progress === 100 ? 'Complete' : t.inProgress ? 'In Progress' : t.progress > 0 ? 'Started' : 'Not Started'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-bold text-gray-900">{t.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${t.progress === 100 ? 'bg-green-500' : t.inProgress ? 'bg-blue-500' : 'bg-amber-500'}`}
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>{t.completedStages} / {t.totalStages} stages</span>
                  <span>{t.doneReqs} / {t.totalReqs} requirements</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                View tracker →
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm">
            No authorisation trackers active yet.{' '}
            <Link href="/setup-wizard" className="text-blue-600 font-medium hover:underline">
              Run the setup wizard
            </Link>{' '}
            to generate trackers based on your jurisdictions.
          </p>
        </div>
      )}

      {/* Inactive trackers */}
      {inactiveTrackers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 mt-6">Available trackers</h2>
          <p className="text-xs text-gray-500 mb-3">
            Activate these by adding the relevant jurisdiction to your operating locations via the{' '}
            <Link href="/setup-wizard" className="text-blue-600 font-medium hover:underline">setup wizard</Link>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {inactiveTrackers.map(t => (
              <div key={t.framework} className="card p-4 opacity-60">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t.regulatorShortName}</div>
                <div className="text-sm font-semibold text-gray-700 mt-0.5 leading-tight">{t.displayName}</div>
                <div className="text-xs text-gray-400 mt-1">{t.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
