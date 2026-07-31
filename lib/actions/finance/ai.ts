'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { crmDeals } from '@/db/schema'
import { eq, and, isNull, lt } from 'drizzle-orm'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Office Supplies': ['office', 'stationery', 'paper', 'printer', 'ink', 'toner'],
  'Software': ['software', 'subscription', 'saas', 'license', 'cloud', 'hosting'],
  'Travel': ['travel', 'flight', 'hotel', 'accommodation', 'uber', 'taxi', 'car rental'],
  'Meals & Entertainment': ['meal', 'lunch', 'dinner', 'coffee', 'entertainment', 'client lunch'],
  'Equipment': ['equipment', 'hardware', 'laptop', 'monitor', 'keyboard', 'desk', 'chair'],
  'Utilities': ['utility', 'electricity', 'water', 'internet', 'phone', 'gas'],
  'Professional Services': ['consulting', 'legal', 'accounting', 'audit', 'advisor'],
  'Marketing': ['marketing', 'advertising', 'social media', 'seo', 'campaign', 'promotion'],
  'Rent': ['rent', 'lease', 'office space'],
  'Insurance': ['insurance', 'liability', 'coverage'],
}

export async function generateQuotationDescription(dealId: string) {
  const [deal] = await db.select().from(crmDeals)
    .where(and(eq(crmDeals.id, dealId), isNull(crmDeals.deletedAt)))
    .limit(1)

  if (!deal) return ''

  const parts = [`Services related to: ${deal.name}`]
  if (deal.dealValue) parts.push(`Estimated value: $${deal.dealValue}`)
  if (deal.notes) parts.push(`Notes: ${deal.notes}`)

  return parts.join('\n')
}

export async function suggestExpenseCategory(title: string) {
  const lower = title.toLowerCase()

  let bestCategory = 'General'
  let bestScore = 0

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0)
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }

  return bestCategory
}

export async function detectUnpaidInvoices(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('finance_invoices')
    .select('*')
    .eq('organization_id', organizationId)
    .in('status', ['sent', 'overdue', 'partial'])
    .lt('due_date', now)
    .is('deleted_at', null)

  return (data || []).map(inv => ({
    ...inv,
    balanceDue: Number(inv.total || 0) - Number(inv.amount_paid || 0),
    daysOverdue: Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000),
  }))
}

export async function getPaymentFollowUpSuggestions(organizationId: string) {
  const overdue = await detectUnpaidInvoices(organizationId)

  return overdue.map(inv => ({
    invoiceId: inv.id,
    invoiceNumber: inv.invoice_number,
    clientName: inv.client_name,
    clientEmail: inv.client_email,
    amountDue: inv.balanceDue,
    daysOverdue: inv.daysOverdue,
    dueDate: inv.due_date,
    suggestedAction: inv.daysOverdue > 30
      ? 'Send final notice'
      : inv.daysOverdue > 14
        ? 'Send reminder email'
        : 'Send gentle follow-up',
  }))
}

export async function getFinancialSummary(organizationId: string) {
  const supabase = await createServerSupabaseClient()

  const [invoicesResult, expensesResult, paymentsResult] = await Promise.all([
    supabase
      .from('finance_invoices')
      .select('total, amount_paid, status')
      .eq('organization_id', organizationId)
      .is('deleted_at', null),
    supabase
      .from('finance_expenses')
      .select('amount')
      .eq('organization_id', organizationId)
      .is('deleted_at', null),
    supabase
      .from('finance_payments')
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .is('deleted_at', null),
  ])

  const totalRevenue = (paymentsResult.data || []).reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalExpenses = (expensesResult.data || []).reduce((s, e) => s + Number(e.amount || 0), 0)

  const outstanding = (invoicesResult.data || [])
    .filter(inv => !['paid', 'draft', 'cancelled'].includes(inv.status))
    .reduce((s, inv) => s + (Number(inv.total || 0) - Number(inv.amount_paid || 0)), 0)

  return {
    totalRevenue,
    totalExpenses,
    outstanding,
    profit: totalRevenue - totalExpenses,
    invoiceCount: invoicesResult.data?.length || 0,
    paidCount: (invoicesResult.data || []).filter(inv => inv.status === 'paid').length,
    overdueCount: (invoicesResult.data || []).filter(inv => inv.status === 'overdue').length,
  }
}