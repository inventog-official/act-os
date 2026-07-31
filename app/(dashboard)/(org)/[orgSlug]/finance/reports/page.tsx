'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Loader2, Download, FileText, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { FinanceShell } from '@/components/finance/finance-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  getRevenueReport, getExpenseReport, getProfitLoss, getCashFlowReport,
  getRevenueByClient, getRevenueByProject, getOutstandingReport,
  getMonthlySummary, getYearlySummary,
} from '@/lib/actions/finance/reports'

const COLORS = ['#09090b', '#a1a1aa', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1']

const reportTypes = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'profit_loss', label: 'Profit & Loss' },
  { value: 'cash_flow', label: 'Cash Flow' },
  { value: 'client_revenue', label: 'Revenue by Client' },
  { value: 'project_revenue', label: 'Revenue by Project' },
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'monthly_summary', label: 'Monthly Summary' },
  { value: 'yearly_summary', label: 'Yearly Summary' },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function exportCSV(data: any[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(r => Object.values(r).map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n')
  const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function exportExcel(data: any[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])

  const headerRow = headers.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')
  const bodyRows = data.map(r =>
    `<Row>${headers.map(h => {
      const v = r[h]
      const str = v === null || v === undefined ? '' : String(v)
      const numeric = typeof v === 'number' && !isNaN(v)
      return `<Cell><Data ss:Type="${numeric ? 'Number' : 'String'}">${numeric ? v : escapeXml(str)}</Data></Cell>`
    }).join('')}</Row>`
  ).join('')

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="header"><Font ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="Report">
  <Table>
   <Row>${headerRow}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [reportType, setReportType] = useState('revenue')
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  })
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchReport = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      let result: any
      switch (reportType) {
        case 'revenue':
          result = await getRevenueReport(currentOrganization.id, dateRange.from, dateRange.to)
          break
        case 'expenses':
          result = await getExpenseReport(currentOrganization.id, dateRange.from, dateRange.to)
          break
        case 'profit_loss':
          result = await getProfitLoss(currentOrganization.id, dateRange.from, dateRange.to)
          break
        case 'cash_flow':
          result = await getCashFlowReport(currentOrganization.id, dateRange.from, dateRange.to)
          break
        case 'client_revenue':
          result = await getRevenueByClient(currentOrganization.id)
          break
        case 'project_revenue':
          result = await getRevenueByProject(currentOrganization.id)
          break
        case 'outstanding':
          result = await getOutstandingReport(currentOrganization.id)
          break
        case 'monthly_summary':
          result = await getMonthlySummary(currentOrganization.id, Number(year))
          break
        case 'yearly_summary':
          result = await getYearlySummary(currentOrganization.id, Number(year))
          break
      }
      setData(result)
    } catch (err) {
      console.error(err)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, reportType, dateRange, year])

  useEffect(() => { fetchReport() }, [fetchReport])

  const renderChart = () => {
    if (!data) return null

    switch (reportType) {
      case 'revenue':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#09090b" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#09090b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" stroke="#09090b" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )

      case 'expenses':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={(entry: any) => `${entry.category}: ${formatCurrency(entry.total)}`}
                    >
                      {data.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )

      case 'profit_loss':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(data?.totalRevenue || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">Total Expenses</p>
                  <p className="text-2xl font-semibold text-red-600">{formatCurrency(data?.totalExpenses || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">Net Profit</p>
                  <p className={`text-2xl font-semibold ${(data?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(data?.netProfit || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(data?.revenue || []).map((r: any) => {
                      const exp = (data?.expenses || []).find((e: any) => e.category === r.month)
                      return { month: r.month, Revenue: r.total, Expenses: exp?.total || 0 }
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'cash_flow':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="paymentsIn" fill="#10b981" radius={[4, 4, 0, 0]} name="Payments In" />
                    <Bar dataKey="expensesOut" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses Out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="py-2 text-left font-medium text-zinc-500">Month</th>
                      <th className="py-2 text-right font-medium text-zinc-500">Payments In</th>
                      <th className="py-2 text-right font-medium text-zinc-500">Expenses Out</th>
                      <th className="py-2 text-right font-medium text-zinc-500">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data || []).map((row: any) => (
                      <tr key={row.month} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="py-2">{row.month}</td>
                        <td className="py-2 text-right">{formatCurrency(row.paymentsIn)}</td>
                        <td className="py-2 text-right">{formatCurrency(row.expensesOut)}</td>
                        <td className={`py-2 text-right font-medium ${row.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(row.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )

      case 'client_revenue':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="total"
                      nameKey="clientName"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={(entry: any) => `${entry.clientName}: ${formatCurrency(entry.total)}`}
                    >
                      {data.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )

      case 'project_revenue':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="total"
                      nameKey="projectId"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={(entry: any) => `${entry.projectId.slice(0, 8)}: ${formatCurrency(entry.total)}`}
                    >
                      {data.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )

      case 'outstanding':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-2 text-left font-medium text-zinc-500">Invoice #</th>
                    <th className="py-2 text-left font-medium text-zinc-500">Client</th>
                    <th className="py-2 text-right font-medium text-zinc-500">Total</th>
                    <th className="py-2 text-right font-medium text-zinc-500">Balance Due</th>
                    <th className="py-2 text-left font-medium text-zinc-500">Status</th>
                    <th className="py-2 text-left font-medium text-zinc-500">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data || []).map((inv: any) => (
                    <tr key={inv.id} className={`border-b border-zinc-100 dark:border-zinc-800/50 ${inv.isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                      <td className="py-2 font-medium">{inv.invoice_number || inv.id.slice(0, 8)}</td>
                      <td className="py-2">{inv.client_name || '—'}</td>
                      <td className="py-2 text-right">{formatCurrency(Number(inv.total))}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(inv.balanceDue)}</td>
                      <td className="py-2">{inv.isOverdue ? 'Overdue' : inv.status}</td>
                      <td className="py-2">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )

      case 'monthly_summary':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary — {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="msRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="msExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#msRev)" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#msExp)" strokeWidth={2} name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="py-2 text-left font-medium text-zinc-500">Month</th>
                      <th className="py-2 text-right font-medium text-zinc-500">Invoiced</th>
                      <th className="py-2 text-right font-medium text-zinc-500">Revenue</th>
                      <th className="py-2 text-right font-medium text-zinc-500">Expenses</th>
                      <th className="py-2 text-right font-medium text-zinc-500">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data || []).map((row: any) => (
                      <tr key={row.month} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="py-2">{row.month}</td>
                        <td className="py-2 text-right">{formatCurrency(row.invoiced)}</td>
                        <td className="py-2 text-right text-emerald-600">{formatCurrency(row.revenue)}</td>
                        <td className="py-2 text-right text-red-600">{formatCurrency(row.expenses)}</td>
                        <td className={`py-2 text-right font-medium ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )

      case 'yearly_summary':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">Total Revenue</p>
                  <p className="text-xl font-semibold text-emerald-600">{formatCurrency(data?.totalRevenue || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">Total Expenses</p>
                  <p className="text-xl font-semibold text-red-600">{formatCurrency(data?.totalExpenses || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">Total Invoiced</p>
                  <p className="text-xl font-semibold">{formatCurrency(data?.totalInvoiced || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">Net Profit</p>
                  <p className={`text-xl font-semibold ${(data?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(data?.netProfit || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown — {year}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.months}>
                      <defs>
                        <linearGradient id="ysRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ysExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#ysRev)" strokeWidth={2} name="Revenue" />
                      <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#ysExp)" strokeWidth={2} name="Expenses" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return <p className="text-sm text-zinc-500">Select a report type</p>
    }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <FinanceShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Financial Reports</h1>
              <p className="text-sm text-zinc-500 mt-1">View and export financial reports</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (data) {
                    const arr = Array.isArray(data) ? data : data?.months || data?.revenue || []
                    exportCSV(arr, `finance-report-${reportType}-${Date.now()}`)
                  }
                }}
                disabled={!data}
              >
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(`/api/finance/pdf/report?type=${reportType}&organizationId=${currentOrganization?.id}`, '_blank')}>
                <FileText className="h-4 w-4 mr-1" />PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (data) {
                    const arr = Array.isArray(data) ? data : data?.months || data?.revenue || []
                    exportExcel(arr, `finance-report-${reportType}-${Date.now()}`)
                  }
                }}
                disabled={!data}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="space-y-1.5 min-w-[200px]">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportTypes.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!['client_revenue', 'project_revenue', 'outstanding', 'monthly_summary', 'yearly_summary'].includes(reportType) && (
              <>
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))}
                    className="w-[150px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))}
                    className="w-[150px]"
                  />
                </div>
              </>
            )}
            {['monthly_summary', 'yearly_summary'].includes(reportType) && (
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="w-[120px]"
                  min="2020"
                  max="2099"
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
          ) : data ? (
            renderChart()
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-sm text-zinc-500">No data available for the selected criteria.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </FinanceShell>
    </DashboardShell>
  )
}
