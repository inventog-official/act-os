'use client'

import { useState, useEffect, use } from 'react'
import {
  DollarSign, ArrowDown, CheckCircle, Clock, AlertTriangle,
  TrendingUp, TrendingDown, CircleDollarSign, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { FinanceShell } from '@/components/finance/finance-shell'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useOrganizationStore } from '@/lib/store'
import { getFinancialSummary } from '@/lib/actions/finance/ai'
import { getPayments } from '@/lib/actions/finance/payments'
import { getExpenses } from '@/lib/actions/finance/expenses'
import { getInvoices } from '@/lib/actions/finance/invoices'
import { getMonthlySummary } from '@/lib/actions/finance/reports'

const COLORS = {
  draft: '#6b7280',
  sent: '#3b82f6',
  paid: '#10b981',
  overdue: '#ef4444',
}

const PIE_COLORS = [COLORS.draft, COLORS.sent, COLORS.paid, COLORS.overdue]

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-5 mb-3" />
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 grid-cols-2">
        <Card><CardContent className="p-5"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
        <Card><CardContent className="p-5"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
      </div>
    </div>
  )
}

export default function FinanceDashboardPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const { currentOrganization } = useOrganizationStore()

  const [summary, setSummary] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization?.id) return
    const orgId = currentOrganization.id
    const year = new Date().getFullYear()

    setLoading(true)
    Promise.all([
      getFinancialSummary(orgId),
      getMonthlySummary(orgId, year),
      getInvoices(orgId).catch(() => []),
      getPayments(orgId).catch(() => []),
      getExpenses(orgId).catch(() => []),
    ])
      .then(([s, m, invs, pays, exps]) => {
        setSummary(s)
        setMonthlyData(m)
        setInvoices(invs)
        setPayments(pays)
        setExpenses(exps)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentOrganization?.id])

  const upcomingPayments = invoices
    .filter((inv: any) => {
      if (!inv.due_date) return false
      return new Date(inv.due_date) >= new Date() && ['sent', 'partial'].includes(inv.status)
    })
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)

  const invoiceStatusData = [
    { name: 'Draft', value: invoices.filter((i: any) => i.status === 'draft').length },
    { name: 'Sent', value: invoices.filter((i: any) => i.status === 'sent').length },
    { name: 'Paid', value: invoices.filter((i: any) => i.status === 'paid').length },
    { name: 'Overdue', value: invoices.filter((i: any) => i.status === 'overdue').length },
  ]

  const statCards = [
    {
      title: 'Total Revenue',
      value: summary ? formatCurrency(summary.totalRevenue) : '-',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-950',
    },
    {
      title: 'Outstanding Payments',
      value: summary ? formatCurrency(summary.outstanding) : '-',
      icon: ArrowDown,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-950',
    },
    {
      title: 'Paid Invoices',
      value: summary ? String(summary.paidCount) : '-',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-950',
    },
    {
      title: 'Unpaid Invoices',
      value: summary ? String(Math.max(0, summary.invoiceCount - summary.paidCount)) : '-',
      icon: Clock,
      color: 'text-red-600',
      bg: 'bg-red-100 dark:bg-red-950',
    },
    {
      title: 'Overdue Invoices',
      value: summary ? String(summary.overdueCount) : '-',
      icon: AlertTriangle,
      color: 'text-red-700',
      bg: 'bg-red-100 dark:bg-red-950',
    },
    {
      title: 'Monthly Revenue',
      value: monthlyData.length > 0 ? formatCurrency(monthlyData[new Date().getMonth()]?.revenue || 0) : '-',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: 'Monthly Expenses',
      value: monthlyData.length > 0 ? formatCurrency(monthlyData[new Date().getMonth()]?.expenses || 0) : '-',
      icon: TrendingDown,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-950',
    },
    {
      title: 'Net Profit',
      value: summary ? formatCurrency(summary.profit) : '-',
      icon: CircleDollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-950',
    },
  ]

  const chartData = monthlyData.map((m: any) => ({
    name: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    revenue: m.revenue,
    expenses: m.expenses,
    profit: m.profit,
  }))

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <FinanceShell orgSlug={orgSlug}>
          <LoadingSkeleton />
        </FinanceShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <FinanceShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Finance Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Overview of your financial performance and metrics
            </p>
          </div>

          <div className="grid gap-4 grid-cols-4">
            {statCards.map(stat => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-3 ${stat.bg}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
                    <p className="text-sm text-zinc-500">{stat.title}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-6 grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                        formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                        formatter={(value: any) => [formatCurrency(Number(value)), 'Expenses']}
                      />
                      <Area type="monotone" dataKey="expenses" stroke="#f97316" fill="url(#expGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7' }}
                        formatter={(value: any) => [formatCurrency(Number(value))]}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7' }}
                        formatter={(value: any) => [formatCurrency(Number(value))]}
                      />
                      <Line type="monotone" dataKey="profit" name="Net Cash Flow" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={invoiceStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                        {invoiceStatusData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [value, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-1 flex-wrap">
                  {invoiceStatusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span>{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Link href={`/${orgSlug}/finance/payments`}>
                  <Button variant="ghost" size="sm">
                    View All <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.payment_method_name || 'Payment'}</p>
                          <p className="text-xs text-zinc-500">{p.payment_date ? formatDate(p.payment_date) : ''}</p>
                        </div>
                        <span className="text-sm font-medium text-emerald-600">
                          {formatCurrency(Number(p.amount || 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 py-8 text-center">No payments recorded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingPayments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingPayments.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{inv.client_name}</p>
                          <p className="text-xs text-zinc-500">Due {inv.due_date ? formatDate(inv.due_date) : ''}</p>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(Number(inv.total || 0) - Number(inv.amount_paid || 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 py-8 text-center">No upcoming payments</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Expenses</CardTitle>
                <Link href={`/${orgSlug}/finance/expenses`}>
                  <Button variant="ghost" size="sm">
                    View All <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {expenses.length > 0 ? (
                  <div className="space-y-3">
                    {expenses.slice(0, 5).map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{e.title}</p>
                          <p className="text-xs text-zinc-500">{e.expense_date ? formatDate(e.expense_date) : ''}</p>
                        </div>
                        <span className="text-sm font-medium text-red-600">
                          -{formatCurrency(Number(e.amount || 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 py-8 text-center">No expenses recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </FinanceShell>
    </DashboardShell>
  )
}
