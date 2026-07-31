'use client'

import { useState, use, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { getFinancialSummary } from '@/lib/actions/finance/ai'
import { getMonthlySummary } from '@/lib/actions/finance/reports'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts'

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}: {p.name === 'users' || p.name === 'active' || p.name === 'billable' ? formatNumber(p.value) : formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<{
    totalRevenue: number
    paidCount: number
    invoiceCount: number
  } | null>(null)
  const [monthly, setMonthly] = useState<{ month: string; revenue: number; expenses: number; profit: number }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string; status: string }[]>([])
  const [tasks, setTasks] = useState<{ id: string; status: string }[]>([])
  const [timeEntries, setTimeEntries] = useState<{ start_time: string | null; duration_minutes: number | null; billable: boolean }[]>([])

  useEffect(() => {
    if (!currentOrganization?.id) return
    const orgId = currentOrganization.id
    const year = new Date().getFullYear()
    setLoading(true)
    Promise.all([
      getFinancialSummary(orgId).catch(() => null),
      getMonthlySummary(orgId, year).catch(() => []),
      supabase.from('projects').select('id, name, status').eq('organization_id', orgId).is('deleted_at', null),
      supabase.from('tasks').select('id, status').eq('organization_id', orgId).is('deleted_at', null),
      supabase.from('time_entries').select('start_time, duration_minutes, billable').is('deleted_at', null),
    ])
      .then(([s, m, pRes, tRes, teRes]) => {
        setSummary(s)
        setMonthly(m)
        setProjects(pRes.data || [])
        setTasks(tRes.data || [])
        setTimeEntries(teRes.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentOrganization?.id, supabase])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const activeProjects = projects.filter(p => p.status === 'active').length

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60
  const billableHours = timeEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60

  const monthlyHours = timeEntries.reduce((acc: Record<string, { hours: number; billable: number }>, e) => {
    const key = (e.start_time || '').slice(0, 7)
    if (!key) return acc
    acc[key] = acc[key] || { hours: 0, billable: 0 }
    acc[key].hours += (e.duration_minutes || 0) / 60
    if (e.billable) acc[key].billable += (e.duration_minutes || 0) / 60
    return acc
  }, {})

  const hoursData = Object.entries(monthlyHours)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      users: Math.round(v.hours * 10) / 10,
      active: Math.round(v.billable * 10) / 10,
    }))

  const monthlyData = monthly.map(m => ({
    month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    revenue: Number(m.revenue) || 0,
    expenses: Number(m.expenses) || 0,
    profit: Number(m.profit) || 0,
  }))

  const projectStatusColors: Record<string, string> = {
    planning: '#3b82f6',
    active: '#10b981',
    on_hold: '#f59e0b',
    completed: '#8b5cf6',
    cancelled: '#ec4899',
  }
  const statusLabels: Record<string, string> = {
    planning: 'Planning',
    active: 'Active',
    on_hold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  const projectDistribution = ['planning', 'active', 'on_hold', 'completed', 'cancelled']
    .map(status => ({
      name: statusLabels[status],
      value: projects.filter(p => p.status === status).length,
      color: projectStatusColors[status],
    }))
    .filter(d => d.value > 0)
  const projectTotal = projectDistribution.reduce((sum, d) => sum + d.value, 0) || 1

  const totalRevenue = summary?.totalRevenue || 0
  const totalPaid = summary?.paidCount || 0
  const totalInvoices = summary?.invoiceCount || 0

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-5 w-5 mb-3" /><Skeleton className="h-8 w-24 mb-1" /><Skeleton className="h-4 w-20" /></CardContent></Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardContent className="p-5"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            <Card><CardContent className="p-5"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const statCards = [
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), change: `${totalInvoices} invoices`, trend: 'up', icon: DollarSign },
    { title: 'Paid Invoices', value: `${totalPaid}/${totalInvoices}`, change: `${completionRate}% task completion`, trend: 'up', icon: ShoppingCart },
    { title: 'Active Projects', value: String(activeProjects), change: `${projects.length} total`, trend: 'up', icon: Users },
    { title: 'Hours Tracked', value: `${totalHours.toFixed(1)}h`, change: `${billableHours.toFixed(1)}h billable`, trend: 'up', icon: Activity },
  ]

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-zinc-500">Track your business performance</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(stat => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                      <Icon className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.title}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#09090b" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#09090b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="#09090b" fill="url(#revenueGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-zinc-400">No revenue data</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hours Tracked by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hoursData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hoursData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="users" name="hours" stroke="#09090b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="active" name="billable" stroke="#a1a1aa" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-zinc-400">No time entries yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData.slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#09090b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#a1a1aa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-zinc-400">No data</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center">
                <div className="space-y-4 w-full">
                  {projectDistribution.length > 0 ? projectDistribution.map(project => (
                    <div key={project.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{project.name}</span>
                        <span className="text-zinc-500">{Math.round((project.value / projectTotal) * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(project.value / projectTotal) * 100}%`, backgroundColor: project.color }}
                        />
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-zinc-400 text-center">No projects yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-zinc-400">No data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
