'use client'

import { useState, useEffect, use } from 'react'
import {
  Users, Building2, CalendarCheck, Clock, Coffee, Briefcase,
  UserPlus, Target, ClipboardCheck, TrendingUp, Sparkles,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getHrDashboardStats, getHeadcountByDepartment, getAttendanceTrend, getLeaveSummary, getRecruitmentFunnel } from '@/lib/actions/hr'

function StatCard({ title, value, icon: Icon, color, bg, sub }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">{title}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
            {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HrDashboardPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [stats, setStats] = useState<any>(null)
  const [headcount, setHeadcount] = useState<any[]>([])
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([])
  const [leaveSummary, setLeaveSummary] = useState<any[]>([])
  const [funnel, setFunnel] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization?.id) return
    const orgId = currentOrganization.id
    setLoading(true)
    Promise.all([
      getHrDashboardStats(orgId).catch(() => null),
      getHeadcountByDepartment(orgId).catch(() => []),
      getAttendanceTrend(orgId, 14).catch(() => []),
      getLeaveSummary(orgId).catch(() => []),
      getRecruitmentFunnel(orgId).catch(() => []),
    ])
      .then(([s, h, a, l, f]) => {
        setStats(s)
        setHeadcount(h)
        setAttendanceTrend(a)
        setLeaveSummary(l)
        setFunnel(f)
      })
      .finally(() => setLoading(false))
  }, [currentOrganization?.id])

  const maxHeadcount = Math.max(1, ...headcount.map((d: any) => d.headcount))
  const trendData = attendanceTrend.map((d: any) => ({
    name: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rate: d.rate,
  }))
  const funnelData = funnel.map((d: any) => ({ name: d.stage, candidates: d.count }))

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-5 w-5 mb-3" /><Skeleton className="h-8 w-24 mb-1" /><Skeleton className="h-4 w-20" /></CardContent></Card>
              ))}
            </div>
            <div className="grid gap-6 grid-cols-2">
              <Card><CardContent className="p-5"><Skeleton className="h-[280px] w-full" /></CardContent></Card>
              <Card><CardContent className="p-5"><Skeleton className="h-[280px] w-full" /></CardContent></Card>
            </div>
          </div>
        </HrShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <HrShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">HR Dashboard</h1>
              <p className="text-sm text-zinc-500 mt-1">Workforce overview and workforce management</p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> AI-ready tools
            </Badge>
          </div>

          <div className="grid gap-4 grid-cols-4">
            <StatCard title="Total Employees" value={stats?.totalEmployees ?? '-'} icon={Users} color="text-blue-600" bg="bg-blue-100 dark:bg-blue-950" sub={`${stats?.activeEmployees ?? 0} active`} />
            <StatCard title="Departments" value={stats?.departments ?? '-'} icon={Building2} color="text-indigo-600" bg="bg-indigo-100 dark:bg-indigo-950" />
            <StatCard title="Attendance Rate" value={stats ? `${stats.attendanceRate}%` : '-'} icon={CalendarCheck} color="text-emerald-600" bg="bg-emerald-100 dark:bg-emerald-950" sub={`${stats?.todayPresent ?? 0} present today`} />
            <StatCard title="Pending Leave" value={stats?.pendingLeave ?? '-'} icon={Coffee} color="text-amber-600" bg="bg-amber-100 dark:bg-amber-950" />
            <StatCard title="Open Positions" value={stats?.openPositions ?? '-'} icon={Briefcase} color="text-violet-600" bg="bg-violet-100 dark:bg-violet-950" />
            <StatCard title="Candidates" value={stats?.candidates ?? '-'} icon={UserPlus} color="text-rose-600" bg="bg-rose-100 dark:bg-rose-950" sub={`${stats?.candidatesInPipeline ?? 0} in pipeline`} />
            <StatCard title="Active Reviews" value={stats?.activeReviews ?? '-'} icon={ClipboardCheck} color="text-teal-600" bg="bg-teal-100 dark:bg-teal-950" />
            <StatCard title="Active Goals" value={stats?.activeGoals ?? '-'} icon={Target} color="text-orange-600" bg="bg-orange-100 dark:bg-orange-950" />
          </div>

          <div className="grid gap-6 grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Headcount by Department</CardTitle>
              </CardHeader>
              <CardContent>
                {headcount.length > 0 ? (
                  <div className="space-y-3">
                    {headcount.map((d: any) => (
                      <div key={d.id} className="flex items-center gap-3">
                        <span className="w-32 text-sm truncate">{d.name}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${(d.headcount / maxHeadcount) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-sm text-right font-medium">{d.headcount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No departments yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attendance Trend (14 days)</CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="rate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No attendance data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recruitment Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                {funnelData.some((d: any) => d.candidates > 0) ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="candidates" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No candidates yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leave Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveSummary.length > 0 ? (
                  <div className="space-y-3">
                    {leaveSummary.map((l: any) => {
                      const pct = l.total ? Math.min(100, Math.round((l.used / l.total) * 100)) : 0
                      return (
                        <div key={l.code} className="flex items-center gap-3">
                          <span className="w-32 text-sm truncate">{l.leaveType}</span>
                          <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: l.color || '#3b82f6' }}
                            />
                          </div>
                          <span className="w-20 text-xs text-right text-zinc-500">{l.used}/{l.total} days</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No leave balances set up</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </HrShell>
    </DashboardShell>
  )
}