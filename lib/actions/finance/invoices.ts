'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { financeInvoices, financeInvoiceItems } from '@/db/schema'
import { eq, and, isNull, inArray, lte } from 'drizzle-orm'
import { generateNumber, calculateDocumentTotals, calculateItemTotal, calculateItemTax, getTaxRatesMap, getCurrentUser } from './utils'
import { sendEmail, buildInvoiceEmailHtml, getOrganizationEmailSettings } from '@/lib/email'
import { generatePdf } from '@/lib/pdf/template'
import type { PdfDocument } from '@/lib/pdf/template'

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

  const taxRates = await getTaxRatesMap(input.organizationId)
  const itemTotals = preparedItems.map((i) => ({
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    discountPercent: i.discountPercent,
    taxRate: i.taxRateId ? taxRates[i.taxRateId] : undefined,
  }))

  const totals = calculateDocumentTotals(
    itemTotals,
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
        taxAmount: calculateItemTax(item.quantity, item.unitPrice, item.discountPercent, item.taxRateId ? taxRates[item.taxRateId] : undefined).toString(),
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

    const existing = await db.select({ organizationId: financeInvoices.organizationId })
      .from(financeInvoices)
      .where(eq(financeInvoices.id, id))
      .limit(1)
    const taxRates = existing[0] ? await getTaxRatesMap(existing[0].organizationId) : {}

    const totals = calculateDocumentTotals(
      preparedItems.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountPercent: i.discountPercent, taxRate: i.taxRateId ? taxRates[i.taxRateId] : undefined })),
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
    const preparedItems = input.items.map((item) => ({
      ...item,
      discountPercent: item.discountPercent ?? 0,
    }))

    const existing = await db.select({ organizationId: financeInvoices.organizationId })
      .from(financeInvoices)
      .where(eq(financeInvoices.id, id))
      .limit(1)
    const taxRates = existing[0] ? await getTaxRatesMap(existing[0].organizationId) : {}

    await db.delete(financeInvoiceItems)
      .where(eq(financeInvoiceItems.invoiceId, id))

    if (input.items.length > 0) {
      await db.insert(financeInvoiceItems).values(
        preparedItems.map((item, i) => ({
          invoiceId: id,
          productId: item.productId ?? null,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discountPercent: item.discountPercent.toString(),
          taxRateId: item.taxRateId ?? null,
          taxAmount: calculateItemTax(item.quantity, item.unitPrice, item.discountPercent, item.taxRateId ? taxRates[item.taxRateId] : undefined).toString(),
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
  const supabase = await createServerSupabaseClient()
  const { data: invoice } = await supabase
    .from('finance_invoices')
    .select('*, items:finance_invoice_items(*)')
    .eq('id', id)
    .single()

  const [data] = await db.update(financeInvoices)
    .set({ status: 'sent', updatedBy: user.id })
    .where(and(eq(financeInvoices.id, id), isNull(financeInvoices.deletedAt)))
    .returning()

  if (!invoice) return data as any

  const inv = invoice as any
  let delivered = false
  let reason: string | undefined

  try {
    if (!inv.client_email) {
      reason = 'No client email set'
    } else {
      const org = await getOrganizationEmailSettings(inv.organization_id)
      const doc: PdfDocument = {
        title: 'Invoice',
        number: inv.invoice_number,
        clientName: inv.client_name,
        clientEmail: inv.client_email,
        clientPhone: inv.client_phone,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        currency: inv.currency,
        items: (inv.items || []).map((i: any) => ({
          description: i.description,
          quantity: String(i.quantity),
          unitPrice: String(i.unit_price),
          total: String(i.total),
        })),
        subtotal: String(inv.subtotal),
        discountAmount: String(inv.discount_amount || '0'),
        taxAmount: String(inv.tax_amount || '0'),
        total: String(inv.total),
        notes: inv.notes,
        terms: inv.terms,
        status: inv.status,
        orgName: org?.name || 'Invoice',
      }
      const pdf = await generatePdf(doc)
      const result = await sendEmail({
        to: inv.client_email,
        subject: `Invoice ${inv.invoice_number} from ${org?.name || 'us'}`,
        html: buildInvoiceEmailHtml({
          orgName: org?.name || 'Demo Corp',
          invoiceNumber: inv.invoice_number,
          clientName: inv.client_name,
          total: String(inv.total),
          currency: inv.currency || 'USD',
          status: 'sent',
          dueDate: inv.due_date ? new Date(inv.due_date).toLocaleDateString() : null,
          notes: inv.notes,
        }),
        attachments: [{ filename: `Invoice_${inv.invoice_number}.pdf`, content: Buffer.from(pdf), contentType: 'application/pdf' }],
      })
      delivered = result.delivered
      reason = result.reason
    }
  } catch (err: any) {
    reason = err.message
  }

  return { ...(data as any), email: { delivered, reason } }
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
function advanceRecurringDate(date: Date, frequency: string | null): Date {
  const next = new Date(date)
  switch (frequency) {
    case 'daily': next.setDate(next.getDate() + 1); break
    case 'weekly': next.setDate(next.getDate() + 7); break
    case 'monthly': next.setMonth(next.getMonth() + 1); break
    case 'quarterly': next.setMonth(next.getMonth() + 3); break
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break
    default: next.setMonth(next.getMonth() + 1)
  }
  return next
}

export async function processRecurringInvoices() {
  const user = await getCurrentUser()
  const due = await getRecurringInvoicesDue()

  const generated: any[] = []

  for (const parent of due) {
    const supabase = await createServerSupabaseClient()
    const { data: full } = await supabase
      .from('finance_invoices')
      .select('*, items:finance_invoice_items(*)')
      .eq('id', parent.id)
      .single()

    if (!full) continue
    const p = full as any

    const nextDate = p.recurring_next_date ? new Date(p.recurring_next_date) : new Date()
    const endDate = p.recurring_end_date ? new Date(p.recurring_end_date) : null
    if (endDate && nextDate > endDate) continue

    const invoiceNumber = await generateNumber(financeInvoices, 'INV', p.organization_id)
    const newInvoice = await db.insert(financeInvoices).values({
      invoiceNumber,
      clientName: p.client_name,
      clientEmail: p.client_email,
      clientPhone: p.client_phone,
      companyId: p.company_id,
      dealId: p.deal_id,
      projectId: p.project_id,
      quotationId: p.quotation_id,
      issueDate: nextDate,
      dueDate: new Date(nextDate.getTime() + (p.due_date ? (new Date(p.due_date).getTime() - new Date(p.issue_date).getTime()) : 30 * 24 * 60 * 60 * 1000)),
      currency: p.currency,
      subtotal: p.subtotal,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      discountAmount: p.discount_amount,
      taxAmount: p.tax_amount,
      total: p.total,
      amountPaid: '0',
      balanceDue: p.total,
      notes: p.notes,
      terms: p.terms,
      isRecurring: false,
      status: 'draft',
      organizationId: p.organization_id,
      workspaceId: p.workspace_id,
      createdBy: user.id,
      updatedBy: user.id,
    } as any).returning()

    const created = newInvoice[0] as any

    if (p.items?.length > 0) {
      await db.insert(financeInvoiceItems).values(
        p.items.map((item: any, i: number) => ({
          invoiceId: created.id,
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

    const advanced = advanceRecurringDate(nextDate, p.recurring_frequency)
    const stillRecurring = !endDate || advanced <= endDate
    await db.update(financeInvoices)
      .set({
        recurringNextDate: advanced,
        isRecurring: stillRecurring,
        updatedBy: user.id,
      })
      .where(eq(financeInvoices.id, parent.id))

    generated.push(created)
  }

  return { count: generated.length, invoices: generated }
}

export async function createInvoiceFromTimeEntries(projectId: string, options?: {
  clientName?: string | null
  clientEmail?: string | null
  description?: string | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, client_name, company_id, organization_id, workspace_id')
    .eq('id', projectId)
    .single()
  if (!project) throw new Error('Project not found')

  const { data: taskRows } = await supabase
    .from('tasks')
    .select('id')
    .eq('project_id', projectId)
    .is('deleted_at', null)
  const taskIds = (taskRows || []).map((t: any) => t.id)
  if (!taskIds.length) throw new Error('No tasks found for this project')

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, task:tasks(title)')
    .in('task_id', taskIds)
    .eq('billable', true)
    .is('deleted_at', null)

  const billable = (entries || []).filter((e: any) => e.duration_minutes && e.duration_minutes > 0)
  if (!billable.length) throw new Error('No billable time entries found')

  const byTask = new Map<string, { description: string; minutes: number; rate: number }>()
  for (const e of billable) {
    const key = e.task_id
    const existing = byTask.get(key) || { description: e.task?.title || 'Time entry', minutes: 0, rate: Number(e.billable_rate) || 0 }
    existing.minutes += Number(e.duration_minutes) || 0
    existing.rate = Math.max(existing.rate, Number(e.billable_rate) || 0)
    byTask.set(key, existing)
  }

  const items = Array.from(byTask.values()).map((t) => ({
    description: t.description,
    quantity: Math.round((t.minutes / 60) * 100) / 100,
    unitPrice: t.rate,
    discountPercent: 0,
  }))

  const totals = calculateDocumentTotals(
    items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountPercent: i.discountPercent, taxRate: undefined })),
    undefined,
    undefined
  )

  const clientName = options?.clientName || project.client_name || project.name || 'Client'
  const invoiceNumber = await generateNumber(financeInvoices, 'INV', project.organization_id)

  const [invoice] = await db.insert(financeInvoices).values({
    invoiceNumber,
    clientName,
    clientEmail: options?.clientEmail ?? null,
    clientPhone: null,
    companyId: project.company_id ?? null,
    dealId: null,
    projectId,
    quotationId: null,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    currency: 'USD',
    subtotal: totals.subtotal.toString(),
    discountType: null,
    discountValue: null,
    discountAmount: totals.discountAmount.toString(),
    taxAmount: totals.taxAmount.toString(),
    total: totals.total.toString(),
    amountPaid: '0',
    balanceDue: totals.total.toString(),
    notes: options?.description || null,
    terms: null,
    isRecurring: false,
    organizationId: project.organization_id,
    workspaceId: project.workspace_id ?? null,
    createdBy: user.id,
    updatedBy: user.id,
  } as any).returning()

  const data = invoice as any

  await db.insert(financeInvoiceItems).values(
    items.map((item, i) => ({
      invoiceId: data.id,
      productId: null,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      discountPercent: item.discountPercent.toString(),
      taxRateId: null,
      total: (item.quantity * item.unitPrice).toString(),
      sortOrder: i,
    })) as any
  )

  return data
}

