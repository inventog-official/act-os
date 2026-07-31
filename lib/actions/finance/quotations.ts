'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { financeQuotations, financeQuotationItems, financeInvoices, financeInvoiceItems } from '@/db/schema'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { generateNumber, calculateDocumentTotals, getCurrentUser } from './utils'

export async function getQuotations(organizationId: string, workspaceId?: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('finance_quotations')
    .select('*, items:finance_quotation_items(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  const { data } = await query
  return (data || []) as any[]
}

export async function getQuotationById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('finance_quotations')
    .select('*, items:finance_quotation_items(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data as any
}

export async function createQuotation(input: {
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  companyId?: string | null
  dealId?: string | null
  projectId?: string | null
  issueDate: string
  expiryDate?: string | null
  currency?: string
  discountType?: string | null
  discountValue?: number | null
  notes?: string | null
  terms?: string | null
  type?: string
  organizationId: string
  workspaceId?: string | null
  items: { description: string; quantity: number; unitPrice: number; discountPercent?: number; taxRateId?: string | null; productId?: string | null; sortOrder?: number }[]
}) {
  const user = await getCurrentUser()
  const quoteNumber = await generateNumber(financeQuotations, 'Q', input.organizationId)

  const preparedItems = input.items.map((item) => ({
    ...item,
    discountPercent: item.discountPercent ?? 0,
  }))

  const totals = calculateDocumentTotals(
    preparedItems.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountPercent: i.discountPercent, taxRate: undefined })),
    input.discountType ?? undefined,
    input.discountValue ?? undefined
  )

  const [quotation] = await db.insert(financeQuotations).values({
    quoteNumber,
    clientName: input.clientName,
    clientEmail: input.clientEmail ?? null,
    clientPhone: input.clientPhone ?? null,
    companyId: input.companyId ?? null,
    dealId: input.dealId ?? null,
    projectId: input.projectId ?? null,
    issueDate: new Date(input.issueDate),
    expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
    currency: input.currency ?? 'USD',
    subtotal: totals.subtotal.toString(),
    discountType: input.discountType ?? null,
    discountValue: input.discountValue?.toString() ?? null,
    discountAmount: totals.discountAmount.toString(),
    taxAmount: totals.taxAmount.toString(),
    total: totals.total.toString(),
    notes: input.notes ?? null,
    terms: input.terms ?? null,
    type: input.type ?? 'quote',
    organizationId: input.organizationId,
    workspaceId: input.workspaceId ?? null,
    createdBy: user.id,
    updatedBy: user.id,
  } as any).returning()

  const data = quotation as any

  if (input.items.length > 0) {
    await db.insert(financeQuotationItems).values(
      preparedItems.map((item, i) => ({
        quotationId: data.id,
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

export async function updateQuotation(id: string, input: {
  clientName?: string
  clientEmail?: string | null
  clientPhone?: string | null
  companyId?: string | null
  dealId?: string | null
  projectId?: string | null
  issueDate?: string
  expiryDate?: string | null
  currency?: string
  discountType?: string | null
  discountValue?: number | null
  notes?: string | null
  terms?: string | null
  type?: string
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
  if (input.issueDate !== undefined) updateVals.issueDate = new Date(input.issueDate)
  if (input.expiryDate !== undefined) updateVals.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null
  if (input.currency !== undefined) updateVals.currency = input.currency
  if (input.discountType !== undefined) updateVals.discountType = input.discountType
  if (input.discountValue !== undefined) updateVals.discountValue = input.discountValue?.toString() ?? null
  if (input.notes !== undefined) updateVals.notes = input.notes
  if (input.terms !== undefined) updateVals.terms = input.terms
  if (input.type !== undefined) updateVals.type = input.type

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
  }

  const [quotation] = await db.update(financeQuotations)
    .set(updateVals as any)
    .where(and(eq(financeQuotations.id, id), isNull(financeQuotations.deletedAt)))
    .returning()

  const data = quotation as any

  if (input.items) {
    await db.delete(financeQuotationItems)
      .where(eq(financeQuotationItems.quotationId, id))

    if (input.items.length > 0) {
      const preparedItems = input.items.map((item) => ({
        ...item,
        discountPercent: item.discountPercent ?? 0,
      }))

      await db.insert(financeQuotationItems).values(
        preparedItems.map((item, i) => ({
          quotationId: id,
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

export async function deleteQuotation(id: string) {
  const user = await getCurrentUser()
  await db.update(financeQuotations)
    .set({ deletedAt: new Date(), updatedBy: user.id })
    .where(eq(financeQuotations.id, id))
  return { success: true }
}

export async function updateQuotationStatus(id: string, status: string) {
  const user = await getCurrentUser()
  const [data] = await db.update(financeQuotations)
    .set({ status, updatedBy: user.id })
    .where(and(eq(financeQuotations.id, id), isNull(financeQuotations.deletedAt)))
    .returning()
  return data as any
}

export async function convertQuoteToInvoice(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: quotation } = await supabase
    .from('finance_quotations')
    .select('*, items:finance_quotation_items(*)')
    .eq('id', id)
    .single()

  if (!quotation) throw new Error('Quotation not found')

  const user = await getCurrentUser()
  const q = quotation as any
  const invoiceNumber = await generateNumber(financeInvoices, 'INV', q.organization_id)

  const [invoice] = await db.insert(financeInvoices).values({
    invoiceNumber,
    clientName: q.client_name,
    clientEmail: q.client_email,
    clientPhone: q.client_phone,
    companyId: q.company_id,
    dealId: q.deal_id,
    projectId: q.project_id,
    quotationId: id,
    issueDate: new Date(q.issue_date),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    currency: q.currency,
    subtotal: q.subtotal,
    discountType: q.discount_type,
    discountValue: q.discount_value,
    discountAmount: q.discount_amount,
    taxAmount: q.tax_amount,
    total: q.total,
    amountPaid: '0',
    balanceDue: q.total,
    notes: q.notes,
    terms: q.terms,
    status: 'draft',
    organizationId: q.organization_id,
    workspaceId: q.workspace_id,
    createdBy: user.id,
    updatedBy: user.id,
  } as any).returning()

  const inv = invoice as any

  if (q.items?.length > 0) {
    await db.insert(financeInvoiceItems).values(
      q.items.map((item: any, i: number) => ({
        invoiceId: inv.id,
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

  await db.update(financeQuotations)
    .set({ status: 'converted', updatedBy: user.id })
    .where(eq(financeQuotations.id, id))

  return inv
}

export async function convertEstimateToQuote(id: string) {
  const user = await getCurrentUser()
  const [data] = await db.update(financeQuotations)
    .set({ type: 'quote', updatedBy: user.id })
    .where(and(eq(financeQuotations.id, id), isNull(financeQuotations.deletedAt)))
    .returning()
  return data as any
}

export async function duplicateQuotation(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: original } = await supabase
    .from('finance_quotations')
    .select('*, items:finance_quotation_items(*)')
    .eq('id', id)
    .single()

  if (!original) throw new Error('Quotation not found')

  const user = await getCurrentUser()
  const o = original as any
  const quoteNumber = await generateNumber(financeQuotations, 'Q', o.organization_id)

  const [quotation] = await db.insert(financeQuotations).values({
    quoteNumber,
    clientName: o.client_name,
    clientEmail: o.client_email,
    clientPhone: o.client_phone,
    companyId: o.company_id,
    dealId: o.deal_id,
    projectId: o.project_id,
    issueDate: new Date(),
    expiryDate: null,
    currency: o.currency,
    subtotal: o.subtotal,
    discountType: o.discount_type,
    discountValue: o.discount_value,
    discountAmount: o.discount_amount,
    taxAmount: o.tax_amount,
    total: o.total,
    notes: o.notes,
    terms: o.terms,
    status: 'draft',
    type: o.type,
    organizationId: o.organization_id,
    workspaceId: o.workspace_id,
    createdBy: user.id,
    updatedBy: user.id,
  } as any).returning()

  const data = quotation as any

  if (o.items?.length > 0) {
    await db.insert(financeQuotationItems).values(
      o.items.map((item: any, i: number) => ({
        quotationId: data.id,
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
