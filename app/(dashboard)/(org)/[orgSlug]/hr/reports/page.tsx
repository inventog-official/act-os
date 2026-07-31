'use client'

import { useState, useEffect, use } from 'react'
import { BarChart3, Users, TrendingUp, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getHeadcountByDepartment, getAttendanceTrend, getLeaveSummary, getRecruitmentFunnel, getPerformanceDistribution } from '@/lib/actions/hr'

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function ReportsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [headcount, setHeadcount] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [leave, setLeave] = useState<any[]>([])
  const [funnel, setFunnel] = useState<any[]>([])
  const [perf, setPerf] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization?.id) return
    Promise.all([
      getHeadcountByDepartment(currentOrganization.id).catch(() => []),
      getAttendanceTrend(currentOrganization.id, 30).catch(() => []),
      getLeaveSummary(currentOrganization.id).catch(() => []),
      getRecruitmentFunnel(currentOrganization.id).catch(() => []),
      getPerformanceDistribution(currentOrganization.id).catch(() => []),
    ])
      .then(([h, t, l, f, p]) => { setHeadcount(h); setTrend(t); setLeave(l); setFunnel(f); setPerf(p) })
      .finally(() => setLoading(false))
  }, [currentOrganization?.id])

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-6 grid-cols-2">
            <Card><CardContent className="p-5"><Skeleton className="h-[280px] w-full" /></CardContent></Card>
            <Card><CardContent className="p-5"><Skeleton className="h-[280px] w-full" /></CardContent></Card>
          </div>
        </HrShell>
      </DashboardShell>
    )
  }

  const trendData = trend.map((d: any) => ({ name: d.date.slice(5), rate: d.rate }))
  const perfData = perf.map((d: any) => ({ name: d.band, count: d.count }))

  return (
    <DashboardShell orgSlug={orgSlug}>
      <HrShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">HR Reports</h1>
            <p className="text-sm text-zinc-500 mt-1">Workforce analytics</p>
          </div>

          <div className="grid gap-6 grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Headcount by Department</CardTitle></CardHeader>
              <CardContent>
                {headcount.length > 0 ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={headcount.map((d: any) => ({ name: d.name, headcount: d.headcount }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="headcount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-sm text-zinc-500">No data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Attendance Trend (30 days)</CardTitle></CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="rate" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-sm text-zinc-500">No data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Recruitment Funnel</CardTitle></CardHeader>
              <CardContent>
                {funnel.some((d: any) => d.count > 0) ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={funnel.filter((d: any) => d.count > 0)} dataKey="count" nameKey="stage" cx="50%" cy="50%" outerRadius={90} label>
                          {funnel.filter((d: any) => d.count > 0).map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-sm text-zinc-500">No data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4" /> Performance Distribution</CardTitle></CardHeader>
              <CardContent>
                {perfData.some((d: any) => d.count > 0) ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={perfData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-sm text-zinc-500">No data</p>}
              </CardContent>
            </Card>
          </div>

          {leave.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Leave Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leave.map((l: any) => {
                    const pct = l.total ? Math.min(100, Math.round((l.used / l.total) * 100)) : 0
                    return (
                      <div key={l.code} className="flex items-center gap-3">
                        <span className="w-32 text-sm truncate">{l.leaveType}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: l.color || '#3b82f6' }} />
                        </div>
                        <span className="w-20 text-xs text-right text-zinc-500">{l.used}/{l.total} days</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </HrShell>
    </DashboardShell>
  )
}