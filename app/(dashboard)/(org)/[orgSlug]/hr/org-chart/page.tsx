'use client'

import { useState, useEffect, use } from 'react'
import { Building2, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getOrgChart } from '@/lib/actions/hr'

export default function OrgChartPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [chart, setChart] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization?.id) return
    getOrgChart(currentOrganization.id)
      .then(setChart)
      .finally(() => setLoading(false))
  }, [currentOrganization?.id])

  const manager = (emps: any[], managerId: string | null) => emps.find((e) => e.id === managerId)

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <Skeleton className="h-10 w-64 mb-6" />
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </HrShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <HrShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Org Chart</h1>
            <p className="text-sm text-zinc-500 mt-1">Visualize your organization structure</p>
          </div>

          {!chart || (chart.departments.length === 0 && chart.unassigned.length === 0) ? (
            <EmptyState icon={Building2} title="No departments or employees" description="Create departments and employees to see the org structure." />
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {chart.departments.map((d: any) => {
                const mgr = manager(d.employees, d.managerId)
                return (
                  <Card key={d.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
                            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{d.name}</h3>
                            <p className="text-xs text-zinc-500">{d.employees.length} employees</p>
                          </div>
                        </div>
                        {mgr && <Badge>Head: {mgr.name}</Badge>}
                      </div>
                      <div className="space-y-2">
                        {d.employees.map((e: any) => {
                          const line = e.managerId ? manager(d.employees, e.managerId) : null
                          return (
                            <div key={e.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 px-3 py-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{e.name}</p>
                                <p className="text-xs text-zinc-500">{e.jobTitle || '—'}</p>
                              </div>
                              {line && <span className="text-xs text-zinc-400">→ {line.name}</span>}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {chart.unassigned.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-3">Unassigned</h3>
                    <div className="space-y-2">
                      {chart.unassigned.map((e: any) => (
                        <div key={e.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 dark:border-zinc-900 px-3 py-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{e.name}</p>
                            <p className="text-xs text-zinc-500">{e.jobTitle || '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </HrShell>
    </DashboardShell>
  )
}