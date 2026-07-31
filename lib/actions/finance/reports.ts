'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { financeInvoices, financeExpenses, financePayments, financeExpenseCategories } from '@/db/schema'
import { sql, eq, and, gte, lte, isNull, inArray } from 'drizzle-orm'

const PAID_STATUSES = ['paid', 'partial']
const ALL_STATUSES = ['paid', 'partial', 'sent', 'overdue']

export async function getRevenueReport(organizationId: string, startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('finance_invoices')
    .select('issue_date, total, amount_paid, status')
    .eq('organization_id', organizationId)
    .in('status', PAID_STATUSES)
    .gte('issue_date', startDate)
    .lte('issue_date', endDate)
    .is('deleted_at', null)

  if (!data) return []

  const monthly: Record<string, number> = {}
  for (const inv of data) {
    const month = (inv.issue_date as string).slice(0, 7)
    monthly[month] = (monthly[month] || 0) + Number(inv.amount_paid || inv.total || 0)
  }

  return Object.entries(monthly).map(([month, total]) => ({ month, total }))
}

export async function getExpenseReport(organizationId: string, startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('finance_expenses')
    .select('amount, category_id, expense_date')
    .eq('organization_id', organizationId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
    .is('deleted_at', null)

  if (!data) return []

  const categoryIds = [...new Set(data.map(e => e.category_id).filter(Boolean))]

  const categories = categoryIds.length > 0
    ? await db.select({ id: financeExpenseCategories.id, name: financeExpenseCategories.name })
        .from(financeExpenseCategories)
        .where(inArray(financeExpenseCategories.id, categoryIds))
    : []

  const categoryMap = new Map(categories.map(c => [c.id, c.name]))

  const grouped: Record<string, number> = {}
  for (const exp of data) {
    const category = exp.category_id ? categoryMap.get(exp.category_id) || 'Uncategorized' : 'Uncategorized'
    grouped[category] = (grouped[category] || 0) + Number(exp.amount || 0)
  }

  return Object.entries(grouped).map(([category, total]) => ({ category, total }))
}

export async function getProfitLoss(organizationId: string, startDate: string, endDate: string) {
  const [revenue, expenses] = await Promise.all([
    getRevenueReport(organizationId, startDate, endDate),
    getExpenseReport(organizationId, startDate, endDate),
  ])

  const totalRevenue = revenue.reduce((s, r) => s + r.total, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.total, 0)

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    revenue,
    expenses,
  }
}

export async function getCashFlowReport(organizationId: string, startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient()

  const [paymentResult, expenseResult] = await Promise.all([
    supabase
      .from('finance_payments')
      .select('amount, payment_date')
      .eq('organization_id', organizationId)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .eq('status', 'completed')
      .is('deleted_at', null),
    supabase
      .from('finance_expenses')
      .select('amount, expense_date')
      .eq('organization_id', organizationId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .is('deleted_at', null),
  ])

  const monthlyIn: Record<string, number> = {}
  for (const p of paymentResult.data || []) {
    const month = (p.payment_date as string).slice(0, 7)
    monthlyIn[month] = (monthlyIn[month] || 0) + Number(p.amount || 0)
  }

  const monthlyOut: Record<string, number> = {}
  for (const e of expenseResult.data || []) {
    const month = (e.expense_date as string).slice(0, 7)
    monthlyOut[month] = (monthlyOut[month] || 0) + Number(e.amount || 0)
  }

  const allMonths = new Set([...Object.keys(monthlyIn), ...Object.keys(monthlyOut)])
  return [...allMonths].sort().map(month => ({
    month,
    paymentsIn: monthlyIn[month] || 0,
    expensesOut: monthlyOut[month] || 0,
    net: (monthlyIn[month] || 0) - (monthlyOut[month] || 0),
  }))
}

export async function getRevenueByClient(organizationId: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('finance_invoices')
    .select('client_name, amount_paid, total')
    .eq('organization_id', organizationId)
    .in('status', PAID_STATUSES)
    .is('deleted_at', null)

  if (!data) return []

  const grouped: Record<string, number> = {}
  for (const inv of data) {
    const name = inv.client_name || 'Unknown'
    grouped[name] = (grouped[name] || 0) + Number(inv.amount_paid || inv.total || 0)
  }

  return Object.entries(grouped).map(([clientName, total]) => ({ clientName, total }))
}

export async function getRevenueByProject(organizationId: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('finance_invoices')
    .select('project_id, amount_paid, total')
    .eq('organization_id', organizationId)
    .in('status', PAID_STATUSES)
    .is('deleted_at', null)

  if (!data) return []

  const grouped: Record<string, number> = {}
  for (const inv of data) {
    const projectId = inv.project_id || 'unassigned'
    grouped[projectId] = (grouped[projectId] || 0) + Number(inv.amount_paid || inv.total || 0)
  }

  return Object.entries(grouped).map(([projectId, total]) => ({ projectId, total }))
}

export async function getOutstandingReport(organizationId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: invoices } = await supabase
    .from('finance_invoices')
    .select('*')
    .eq('organization_id', organizationId)
    .in('status', ['sent', 'overdue', 'partial'])
    .is('deleted_at', null)

  if (!invoices) return []

  const now = new Date().toISOString().slice(0, 10)

  return invoices.map(inv => {
    const total = Number(inv.total || 0)
    const amountPaid = Number(inv.amount_paid || 0)
    const balanceDue = total - amountPaid
    const isOverdue = inv.status !== 'partial' && inv.due_date && inv.due_date < now
    return {
      ...inv,
      balanceDue,
      isOverdue,
      daysOverdue: isOverdue ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000) : 0,
    }
  })
}

export async function getMonthlySummary(organizationId: string, year: number) {
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const supabase = await createServerSupabaseClient()

  const [invoicesResult, expensesResult] = await Promise.all([
    supabase
      .from('finance_invoices')
      .select('issue_date, total, amount_paid, status')
      .eq('organization_id', organizationId)
      .in('status', ALL_STATUSES)
      .gte('issue_date', startDate)
      .lte('issue_date', endDate)
      .is('deleted_at', null),
    supabase
      .from('finance_expenses')
      .select('amount, expense_date')
      .eq('organization_id', organizationId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .is('deleted_at', null),
  ])

  const monthly: Record<string, { revenue: number; expenses: number; invoiced: number }> = {}

  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
  for (const m of months) monthly[m] = { revenue: 0, expenses: 0, invoiced: 0 }

  for (const inv of invoicesResult.data || []) {
    const month = (inv.issue_date as string).slice(0, 7)
    if (monthly[month]) {
      monthly[month].invoiced += Number(inv.total || 0)
      if (PAID_STATUSES.includes(inv.status)) {
        monthly[month].revenue += Number(inv.amount_paid || inv.total || 0)
      }
    }
  }

  for (const exp of expensesResult.data || []) {
    const month = (exp.expense_date as string).slice(0, 7)
    if (monthly[month]) {
      monthly[month].expenses += Number(exp.amount || 0)
    }
  }

  return Object.entries(monthly).map(([month, data]) => ({
    month,
    ...data,
    profit: data.revenue - data.expenses,
  }))
}

export async function getYearlySummary(organizationId: string, year: number) {
  const monthly = await getMonthlySummary(organizationId, year)

  return {
    year,
    totalRevenue: monthly.reduce((s, m) => s + m.revenue, 0),
    totalExpenses: monthly.reduce((s, m) => s + m.expenses, 0),
    totalInvoiced: monthly.reduce((s, m) => s + m.invoiced, 0),
    netProfit: monthly.reduce((s, m) => s + m.revenue, 0) - monthly.reduce((s, m) => s + m.expenses, 0),
    months: monthly,
  }
}