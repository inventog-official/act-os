'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { financeInvoices, financeInvoiceItems } from '@/db/schema'
import { eq, and, isNull, inArray, lte } from 'drizzle-orm'
import { generateNumber, calculateDocumentTotals, getCurrentUser } from './utils'

export async function getInvoices(organizationId: string, workspaceId?: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('finance_invoices')
    .select('*, items:finance_invoice_items(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  const { data } = await query
  return (data || []) as any[]
}

export async function getInvoiceById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('finance_invoices')
    .select('*, items:finance_invoice_items(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data as any
}

export async function createInvoice(input: {
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  companyId?: string | null
  dealId?: string | null
  projectId?: string | null
  quotationId?: string | null
  issueDate: string
  dueDate: string
  currency?: string
  discountType?: string | null
  discountValue?: number | null
  notes?: string | null
  terms?: string | null
  organizationId: string
  workspaceId?: string | null
  isRecurring?: boolean
  recurringFrequency?: string | null
  recurringNextDate?: string | null
  recurringEndDate?: string | null
  items: { description: string; quantity: number; unitPrice: number; discountPercent?: number; taxRateId?: string | null; productId?: string | null; sortOrder?: number }[]
}) {
  const user = await getCurrentUser()
  const invoiceNumber = await generateNumber(financeInvoices, 'INV', input.organizationId)

  const preparedItems = input.items.map((item) => ({
    ...item,
    discountPercent: item.discountPercent ?? 0,
  }))

  const totals = calculateDocumentTotals(
    preparedItems.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountPercent: i.discountPercent, taxRate: undefined })),
    input.discountType ?? undefined,
    input.discountValue ?? undefined
  )

  const [invoice] = await db.insert(financeInvoices).values({
    invoiceNumber,
    clientName: input.clientName,
    clientEmail: input.clientEmail ?? null,
    clientPhone: input.clientPhone ?? null,
    companyId: input.companyId ?? null,
    dealId: input.dealId ?? null,
    projectId: input.projectId ?? null,
    quotationId: input.quotationId ?? null,
    issueDate: new Date(input.issueDate),
    dueDate: new Date(input.dueDate),
    currency: input.currency ?? 'USD',
    subtotal: totals.subtotal.toString(),
    discountType: input.discountType ?? null,
    discountValue: input.discountValue?.toString() ?? null,
    discountAmount: totals.discountAmount.toString(),
    taxAmount: totals.taxAmount.toString(),
    total: totals.total.toString(),
    amountPaid: '0',
    balanceDue: totals.total.toString(),
    notes: input.notes ?? null,
    terms: input.terms ?? null,
    isRecurring: input.isRecurring ?? false,
    recurringFrequency: input.recurringFrequency ?? null,
    recurringNextDate: input.recurringNextDate ? new Date(input.recurringNextDate) : null,
    recurringEndDate: input.recurringEndDate ? new Date(input.recurringEndDate) : null,
    organizationId: input.organizationId,
    workspaceId: input.workspaceId ?? null,
    createdBy: user.id,
    updatedBy: user.id,
  } as any).returning()

  const data = invoice as any

  if (input.items.length > 0) {
    await db.insert(financeInvoiceItems).values(
      preparedItems.map((item, i) => ({
        invoiceId: data.id,
        productId: item.productId ?? null,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        discountPercent: item.discountPercent.toString(),
        taxRateId: item.taxRateId ?? null,
        total: (item.quantity * item.unitPrice * (1 - item.discountPercent / 100)).toString(),
        sortOrder: item.sortOrder ?? i,
      })) as any
    )
  }

  return data
}

export async function updateInvoice(id: string, input: {
  clientName?: string
  clientEmail?: string | null
  clientPhone?: string | null
  companyId?: string | null
  dealId?: string | null
  projectId?: string | null
  quotationId?: string | null
  issueDate?: string
  dueDate?: string
  currency?: string
  discountType?: string | null
  discountValue?: number | null
  notes?: string | null
  terms?: string | null
  isRecurring?: boolean
  recurringFrequency?: string | null
  recurringNextDate?: string | null
  recurringEndDate?: string | null
  items?: { description: string; quantity: number; unitPrice: number; discountPercent?: number; taxRateId?: string | null; productId?: string | null; sortOrder?: number }[]
}) {
  const user = await getCurrentUser()

  const updateVals: Record<string, unknown> = { updatedBy: user.id }
  if (input.clientName !== undefined) updateVals.clientName = input.clientName
  if (input.clientEmail !== undefined) updateVals.clientEmail = input.clientEmail
  if (input.clientPhone !== undefined) updateVals.clientPhone = input.clientPhone
  if (input.companyId !== undefined) updateVals.companyId = input.companyId
  if (input.dealId !== undefined) updateVals.dealId = input.dealId
  if (input.projectId !== undefined) updateVals.projectId = input.projectId
  if (input.quotationId !== undefined) updateVals.quotationId = input.quotationId
  if (input.issueDate !== undefined) updateVals.issueDate = new Date(input.issueDate)
  if (input.dueDate !== undefined) updateVals.dueDate = new Date(input.dueDate)
  if (input.currency !== undefined) updateVals.currency = input.currency
  if (input.discountType !== undefined) updateVals.discountType = input.discountType
  if (input.discountValue !== undefined) updateVals.discountValue = input.discountValue?.toString() ?? null
  if (input.notes !== undefined) updateVals.notes = input.notes
  if (input.terms !== undefined) updateVals.terms = input.terms
  if (input.isRecurring !== undefined) updateVals.isRecurring = input.isRecurring
  if (input.recurringFrequency !== undefined) updateVals.recurringFrequency = input.recurringFrequency
  if (input.recurringNextDate !== undefined) updateVals.recurringNextDate = input.recurringNextDate ? new Date(input.recurringNextDate) : null
  if (input.recurringEndDate !== undefined) updateVals.recurringEndDate = input.recurringEndDate ? new Date(input.recurringEndDate) : null

  if (input.items) {
    const preparedItems = input.items.map((item) => ({
      ...item,
      discountPercent: item.discountPercent ?? 0,
    }))

    const totals = calculateDocumentTotals(
      preparedItems.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountPercent: i.discountPercent, taxRate: undefined })),
      (input.discountType ?? undefined) as string | undefined,
      (input.discountValue ?? undefined) as number | undefined
    )
    updateVals.subtotal = totals.subtotal.toString()
    updateVals.discountAmount = totals.discountAmount.toString()
    updateVals.taxAmount = totals.taxAmount.toString()
    updateVals.total = totals.total.toString()
    updateVals.balanceDue = totals.total.toString()
  }

  const [invoice] = await db.update(financeInvoices)
    .set(updateVals as any)
    .where(and(eq(financeInvoices.id, id), isNull(financeInvoices.deletedAt)))
    .returning()

  const data = invoice as any

  if (input.items) {
    await db.delete(financeInvoiceItems)
      .where(eq(financeInvoiceItems.invoiceId, id))

    if (input.items.length > 0) {
      const preparedItems = input.items.map((item) => ({
        ...item,
        discountPercent: item.discountPercent ?? 0,
      }))

      await db.insert(financeInvoiceItems).values(
        preparedItems.map((item, i) => ({
          invoiceId: id,
          productId: item.productId ?? null,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discountPercent: item.discountPercent.toString(),
          taxRateId: item.taxRateId ?? null,
          total: (item.quantity * item.unitPrice * (1 - item.discountPercent / 100)).toString(),
          sortOrder: item.sortOrder ?? i,
        })) as any
      )
    }
  }

  return data
}

export async function deleteInvoice(id: string) {
  const user = await getCurrentUser()
  await db.update(financeInvoices)
    .set({ deletedAt: new Date(), updatedBy: user.id })
    .where(eq(financeInvoices.id, id))
  return { success: true }
}

export async function updateInvoiceStatus(id: string, status: string) {
  const user = await getCurrentUser()

  const updateVals: Record<string, unknown> = { status, updatedBy: user.id }

  if (status === 'paid') {
    const [invoice] = await db.select({ total: financeInvoices.total })
      .from(financeInvoices)
      .where(eq(financeInvoices.id, id))
      .limit(1)

    if (invoice) {
      updateVals.amountPaid = invoice.total
      updateVals.balanceDue = '0'
    }
  }

  const [data] = await db.update(financeInvoices)
    .set(updateVals as any)
    .where(and(eq(financeInvoices.id, id), isNull(financeInvoices.deletedAt)))
    .returning()

  return data as any
}

export async function sendInvoice(id: string) {
  const user = await getCurrentUser()
  const [data] = await db.update(financeInvoices)
    .set({ status: 'sent', updatedBy: user.id })
    .where(and(eq(financeInvoices.id, id), isNull(financeInvoices.deletedAt)))
    .returning()
  return data as any
}

export async function duplicateInvoice(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: original } = await supabase
    .from('finance_invoices')
    .select('*, items:finance_invoice_items(*)')
    .eq('id', id)
    .single()

  if (!original) throw new Error('Invoice not found')

  const user = await getCurrentUser()
  const o = original as any
  const invoiceNumber = await generateNumber(financeInvoices, 'INV', o.organization_id)

  const [invoice] = await db.insert(financeInvoices).values({
    invoiceNumber,
    clientName: o.client_name,
    clientEmail: o.client_email,
    clientPhone: o.client_phone,
    companyId: o.company_id,
    dealId: o.deal_id,
    projectId: o.project_id,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    currency: o.currency,
    subtotal: o.subtotal,
    discountType: o.discount_type,
    discountValue: o.discount_value,
    discountAmount: o.discount_amount,
    taxAmount: o.tax_amount,
    total: o.total,
    amountPaid: '0',
    balanceDue: o.total,
    notes: o.notes,
    terms: o.terms,
    isRecurring: o.is_recurring ?? false,
    recurringFrequency: o.recurring_frequency,
    recurringNextDate: o.recurring_next_date,
    recurringEndDate: o.recurring_end_date,
    status: 'draft',
    organizationId: o.organization_id,
    workspaceId: o.workspace_id,
    createdBy: user.id,
    updatedBy: user.id,
  } as any).returning()

  const data = invoice as any

  if (o.items?.length > 0) {
    await db.insert(financeInvoiceItems).values(
      o.items.map((item: any, i: number) => ({
        invoiceId: data.id,
        productId: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        discountPercent: item.discount_percent,
        taxRateId: item.tax_rate_id,
        taxAmount: item.tax_amount || '0',
        total: item.total,
        sortOrder: item.sort_order ?? i,
      })) as any
    )
  }

  return data
}

export async function getRecurringInvoicesDue() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const data = await db.select()
    .from(financeInvoices)
    .where(
      and(
        eq(financeInvoices.isRecurring, true),
        lte(financeInvoices.recurringNextDate, today),
        isNull(financeInvoices.deletedAt),
        eq(financeInvoices.status, 'draft')
      )
    )

  return data as any[]
}
