'use client'

import { useState, useEffect, use } from 'react'
import { Gauge, Users, AlertTriangle, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getCapacityOverview, suggestResourceAllocation } from '@/lib/actions/hr'

function utilizationColor(u: number) {
  if (u >= 80) return 'bg-red-500'
  if (u >= 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export default function CapacityPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [overview, setOverview] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization?.id) return
    Promise.all([
      getCapacityOverview(currentOrganization.id).catch(() => null),
      suggestResourceAllocation(currentOrganization.id).catch(() => null),
    ])
      .then(([o, s]) => { setOverview(o); setSuggestions(s) })
      .finally(() => setLoading(false))
  }, [currentOrganization?.id])

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-4 grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </HrShell>
      </DashboardShell>
    )
  }

  if (!overview) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <EmptyState title="No capacity data" description="Add employees and attendance to see capacity metrics." />
        </HrShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <HrShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Workforce Capacity</h1>
            <p className="text-sm text-zinc-500 mt-1">Utilization and resource availability</p>
          </div>

          <div className="grid gap-4 grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-zinc-500"><Gauge className="h-4 w-4" /> Overall utilization</div>
                <p className="mt-1 text-2xl font-semibold">{overview.overallUtilization}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-zinc-500"><Users className="h-4 w-4" /> Available employees</div>
                <p className="mt-1 text-2xl font-semibold">{overview.availableEmployees.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-zinc-500"><AlertTriangle className="h-4 w-4" /> Over-allocated</div>
                <p className="mt-1 text-2xl font-semibold">{overview.overAllocated}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-zinc-500"><Users className="h-4 w-4" /> Total employees</div>
                <p className="mt-1 text-2xl font-semibold">{overview.rows.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Employee Utilization</CardTitle></CardHeader>
            <CardContent>
              {overview.rows.length === 0 ? (
                <p className="text-sm text-zinc-500">No active employees</p>
              ) : (
                <div className="space-y-3">
                  {overview.rows.map((r: any) => (
                    <div key={r.employeeId} className="flex items-center gap-3">
                      <div className="w-44">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{r.jobTitle || '—'}</p>
                      </div>
                      <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div className={`h-full rounded-full ${utilizationColor(r.utilization)}`} style={{ width: `${r.utilization}%` }} />
                      </div>
                      <span className="w-10 text-sm text-right font-medium">{r.utilization}%</span>
                      <Badge variant={r.availability > 30 ? 'default' : 'outline'}>avail {r.availability}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {suggestions && (suggestions.available.length > 0 || suggestions.suggestedForProjects.length > 0) && (
            <div className="grid gap-6 grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Available Resources</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suggestions.available.slice(0, 10).map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{s.name}</span>
                        <span className="text-zinc-500">{s.jobTitle || '—'} · {s.availability}% free</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4" /> Suggested Allocation</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suggestions.suggestedForProjects.slice(0, 5).map((p: any) => (
                      <div key={p.projectId} className="flex items-center justify-between text-sm">
                        <span>{p.projectName}</span>
                        <span className="text-zinc-500">{p.candidateCount} candidates</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </HrShell>
    </DashboardShell>
  )
}