'use server'

import { db } from '@/db'
import {
  financePayments,
  financePaymentMethods,
  financeInvoices,
} from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

async function recalcInvoiceBalance(invoiceId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: inv } = await supabase
    .from('finance_invoices')
    .select('total')
    .eq('id', invoiceId)
    .single()
  if (!inv) return

  const { data: payments } = await supabase
    .from('finance_payments')
    .select('amount')
    .eq('invoice_id', invoiceId)
    .eq('status', 'completed')
    .is('deleted_at', null)

  const totalPaid = (payments || []).reduce(
    (s, p) => s + Number(p.amount),
    0,
  )
  const invoiceTotal = Number(inv.total)

  await db
    .update(financeInvoices)
    .set({
      amountPaid: String(totalPaid),
      balanceDue: String(Math.max(0, invoiceTotal - totalPaid)),
      status:
        totalPaid >= invoiceTotal
          ? 'paid'
          : totalPaid > 0
            ? 'partial'
            : undefined,
    })
    .where(eq(financeInvoices.id, invoiceId))
}

export async function getPaymentMethods() {
  return db.select().from(financePaymentMethods)
}

export async function getPayments(
  organizationId: string,
  invoiceId?: string,
) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('finance_payments')
    .select('*, payment_method:payment_method_id(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('payment_date', { ascending: false })

  if (invoiceId) query = query.eq('invoice_id', invoiceId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function recordPayment(input: {
  invoiceId?: string | null
  amount: number
  currency?: string
  paymentMethodId?: string | null
  paymentMethodName?: string | null
  transactionReference?: string | null
  paymentDate?: string
  notes?: string | null
  organizationId: string
  workspaceId?: string | null
}) {
  const user = await getCurrentUser()

  const [payment] = await db
    .insert(financePayments)
    .values({
      invoiceId: input.invoiceId ?? null,
      amount: String(input.amount),
      currency: input.currency ?? 'USD',
      paymentMethodId: input.paymentMethodId ?? null,
      paymentMethodName: input.paymentMethodName ?? null,
      transactionReference: input.transactionReference ?? null,
      paymentDate: input.paymentDate
        ? new Date(input.paymentDate)
        : new Date(),
      notes: input.notes ?? null,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId ?? null,
      createdBy: user.id,
    })
    .returning()

  if (input.invoiceId) {
    await recalcInvoiceBalance(input.invoiceId)
  }

  return payment
}

export async function updatePayment(
  id: string,
  input: {
    invoiceId?: string | null
    amount?: number
    currency?: string
    paymentMethodId?: string | null
    paymentMethodName?: string | null
    transactionReference?: string | null
    paymentDate?: string
    notes?: string | null
  },
) {
  const supabase = await createServerSupabaseClient()
  const { data: old } = await supabase
    .from('finance_payments')
    .select('invoice_id')
    .eq('id', id)
    .single()

  const user = await getCurrentUser()

  const values: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: user.id,
  }
  if (input.invoiceId !== undefined) values.invoiceId = input.invoiceId ?? null
  if (input.amount !== undefined) values.amount = String(input.amount)
  if (input.currency !== undefined) values.currency = input.currency
  if (input.paymentMethodId !== undefined)
    values.paymentMethodId = input.paymentMethodId ?? null
  if (input.paymentMethodName !== undefined)
    values.paymentMethodName = input.paymentMethodName ?? null
  if (input.transactionReference !== undefined)
    values.transactionReference = input.transactionReference ?? null
  if (input.paymentDate !== undefined)
    values.paymentDate = input.paymentDate
      ? new Date(input.paymentDate)
      : new Date()
  if (input.notes !== undefined) values.notes = input.notes ?? null

  await db.update(financePayments).set(values).where(eq(financePayments.id, id))

  const oldInvoiceId = old?.invoice_id
  const newInvoiceId =
    input.invoiceId !== undefined ? input.invoiceId : oldInvoiceId

  const invoicesToRecalc = new Set<string>()
  if (oldInvoiceId) invoicesToRecalc.add(oldInvoiceId)
  if (newInvoiceId) invoicesToRecalc.add(newInvoiceId)

  for (const invId of invoicesToRecalc) {
    await recalcInvoiceBalance(invId)
  }
}

export async function deletePayment(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: payment } = await supabase
    .from('finance_payments')
    .select('invoice_id')
    .eq('id', id)
    .single()

  await db
    .update(financePayments)
    .set({ deletedAt: new Date() })
    .where(eq(financePayments.id, id))

  if (payment?.invoice_id) {
    await recalcInvoiceBalance(payment.invoice_id)
  }
}

export async function getPaymentById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('finance_payments')
    .select('*, payment_method:payment_method_id(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}
