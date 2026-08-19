import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { financeQuotations, financeInvoices, financePurchaseOrders } from '@/db/schema'
import { eq, and, isNull, sql, desc } from 'drizzle-orm'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function generateNumber(table: any, prefix: string, orgId: string): Promise<string> {
  const seq = await db.select({ count: sql<number>`count(*)` }).from(table)
    .where(and(eq(table.organizationId, orgId), isNull(table.deletedAt)))
  const count = (seq[0]?.count || 0) + 1
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(count).padStart(4, '0')}`
}

export function calculateItemTotal(quantity: number, unitPrice: number, discountPercent: number): number {
  const lineTotal = quantity * unitPrice
  const discount = discountPercent > 0 ? lineTotal * (discountPercent / 100) : 0
  return lineTotal - discount
}

export function calculateItemTax(quantity: number, unitPrice: number, discountPercent: number, taxRate?: number): number {
  if (!taxRate) return 0
  return calculateItemTotal(quantity, unitPrice, discountPercent) * (taxRate / 100)
}

export async function getTaxRatesMap(organizationId: string): Promise<Record<string, number>> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('finance_tax_rates')
    .select('id, rate')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
  const map: Record<string, number> = {}
  for (const r of (data || [])) map[r.id as string] = Number(r.rate) || 0
  return map
}
export function calculateDocumentTotals(items: { quantity: number; unitPrice: number; discountPercent: number; taxRate?: number }[], discountType?: string, discountValue?: number, taxRate?: number) {
  const subtotal = items.reduce((sum, i) => sum + calculateItemTotal(i.quantity, i.unitPrice, i.discountPercent || 0), 0)
  const discountAmount = discountType === 'percentage' ? subtotal * ((discountValue || 0) / 100) : discountType === 'fixed' ? (discountValue || 0) : 0
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxRate ? taxableAmount * (taxRate / 100) : items.reduce((sum, i) => sum + (i.taxRate ? calculateItemTotal(i.quantity, i.unitPrice, i.discountPercent || 0) * (i.taxRate / 100) : 0), 0)
  const total = taxableAmount + taxAmount
  return { subtotal, discountAmount, taxAmount, total }
}
