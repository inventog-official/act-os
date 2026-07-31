'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createQuotation(data: any) {
  const supabase = await createServerSupabaseClient()
  const { items, ...quotation } = data
  const { data: result, error } = await supabase
    .from('finance_quotations')
    .insert(quotation)
    .select()
    .single()
  if (error) throw new Error(error.message)
  if (items?.length) {
    const { error: itemsError } = await supabase
      .from('finance_quotation_items')
      .insert(items.map((item: any) => ({ ...item, quotation_id: result.id })))
    if (itemsError) throw new Error(itemsError.message)
  }
  revalidatePath('/[orgSlug]/finance/quotations')
  return result
}

export async function updateQuotation(id: string, data: any) {
  const supabase = await createServerSupabaseClient()
  const { items, ...quotation } = data
  const { error } = await supabase.from('finance_quotations').update(quotation).eq('id', id)
  if (error) throw new Error(error.message)
  if (items) {
    await supabase.from('finance_quotation_items').delete().eq('quotation_id', id)
    if (items.length) {
      const { error: itemsError } = await supabase
        .from('finance_quotation_items')
        .insert(items.map((item: any) => ({ ...item, quotation_id: id })))
      if (itemsError) throw new Error(itemsError.message)
    }
  }
  revalidatePath('/[orgSlug]/finance/quotations')
}

export async function deleteQuotation(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_quotations').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/quotations')
}

export async function updateQuotationStatus(id: string, status: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_quotations').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/quotations')
}

export async function duplicateQuotation(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: original } = await supabase.from('finance_quotations').select('*, items:finance_quotation_items(*)').eq('id', id).single()
  if (!original) throw new Error('Not found')
  const { items, ...rest } = original
  const { data: copy } = await supabase.from('finance_quotations').insert({
    ...rest,
    id: undefined,
    created_at: undefined,
    updated_at: undefined,
    status: 'draft',
    quotation_number: undefined,
  }).select().single()
  if (copy && items?.length) {
    await supabase.from('finance_quotation_items').insert(
      items.map((item: any) => ({ ...item, id: undefined, quotation_id: copy.id }))
    )
  }
  revalidatePath('/[orgSlug]/finance/quotations')
  return copy
}

export async function convertQuoteToInvoice(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: quote } = await supabase.from('finance_quotations').select('*, items:finance_quotation_items(*)').eq('id', id).single()
  if (!quote) throw new Error('Not found')
  const { items, ...rest } = quote
  const { data: invoice } = await supabase.from('finance_invoices').insert({
    ...rest,
    id: undefined,
    created_at: undefined,
    updated_at: undefined,
    status: 'draft',
    quotation_id: id,
    invoice_number: undefined,
  }).select().single()
  if (invoice && items?.length) {
    await supabase.from('finance_invoice_items').insert(
      items.map((item: any) => ({ ...item, id: undefined, invoice_id: invoice.id }))
    )
  }
  await supabase.from('finance_quotations').update({ status: 'converted' }).eq('id', id)
  revalidatePath('/[orgSlug]/finance/quotations')
  revalidatePath('/[orgSlug]/finance/invoices')
  return invoice
}

export async function convertEstimateToQuote(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: estimate } = await supabase.from('finance_quotations').select('*, items:finance_quotation_items(*)').eq('id', id).single()
  if (!estimate) throw new Error('Not found')
  const { items, ...rest } = estimate
  const { data: quote } = await supabase.from('finance_quotations').insert({
    ...rest,
    id: undefined,
    created_at: undefined,
    updated_at: undefined,
    status: 'draft',
    type: 'quote',
  }).select().single()
  if (quote && items?.length) {
    await supabase.from('finance_quotation_items').insert(
      items.map((item: any) => ({ ...item, id: undefined, quotation_id: quote.id }))
    )
  }
  await supabase.from('finance_quotations').update({ status: 'converted' }).eq('id', id)
  revalidatePath('/[orgSlug]/finance/quotations')
  return quote
}

export async function createInvoice(data: any) {
  const supabase = await createServerSupabaseClient()
  const { items, ...invoice } = data
  const { data: result, error } = await supabase.from('finance_invoices').insert(invoice).select().single()
  if (error) throw new Error(error.message)
  if (items?.length) {
    const { error: itemsError } = await supabase
      .from('finance_invoice_items')
      .insert(items.map((item: any) => ({ ...item, invoice_id: result.id })))
    if (itemsError) throw new Error(itemsError.message)
  }
  revalidatePath('/[orgSlug]/finance/invoices')
  return result
}

export async function updateInvoice(id: string, data: any) {
  const supabase = await createServerSupabaseClient()
  const { items, ...invoice } = data
  const { error } = await supabase.from('finance_invoices').update(invoice).eq('id', id)
  if (error) throw new Error(error.message)
  if (items) {
    await supabase.from('finance_invoice_items').delete().eq('invoice_id', id)
    if (items.length) {
      const { error: itemsError } = await supabase
        .from('finance_invoice_items')
        .insert(items.map((item: any) => ({ ...item, invoice_id: id })))
      if (itemsError) throw new Error(itemsError.message)
    }
  }
  revalidatePath('/[orgSlug]/finance/invoices')
}

export async function deleteInvoice(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_invoices').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/invoices')
}

export async function updateInvoiceStatus(id: string, status: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_invoices').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/invoices')
}

export async function sendInvoice(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_invoices').update({ status: 'sent' }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/invoices')
}

export async function duplicateInvoice(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: original } = await supabase.from('finance_invoices').select('*, items:finance_invoice_items(*)').eq('id', id).single()
  if (!original) throw new Error('Not found')
  const { items, ...rest } = original
  const { data: copy } = await supabase.from('finance_invoices').insert({
    ...rest,
    id: undefined,
    created_at: undefined,
    updated_at: undefined,
    status: 'draft',
    invoice_number: undefined,
  }).select().single()
  if (copy && items?.length) {
    await supabase.from('finance_invoice_items').insert(
      items.map((item: any) => ({ ...item, id: undefined, invoice_id: copy.id }))
    )
  }
  revalidatePath('/[orgSlug]/finance/invoices')
  return copy
}

export async function createPurchaseOrder(data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_purchase_orders').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/purchase-orders')
}

export async function updatePurchaseOrder(id: string, data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_purchase_orders').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/purchase-orders')
}

export async function deletePurchaseOrder(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_purchase_orders').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/purchase-orders')
}

export async function approvePurchaseOrder(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_purchase_orders').update({ status: 'approved' }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/purchase-orders')
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_purchase_orders').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/purchase-orders')
}

export async function createExpense(data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_expenses').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/expenses')
}

export async function updateExpense(id: string, data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_expenses').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/expenses')
}

export async function deleteExpense(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_expenses').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/expenses')
}

export async function createProduct(data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_products').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/products')
}

export async function updateProduct(id: string, data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_products').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/products')
}

export async function deleteProduct(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/products')
}

export async function createProductCategory(data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_product_categories').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/products')
}

export async function getProductCategories() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('finance_product_categories').select('*').is('deleted_at', null)
  return data || []
}

export async function recordPayment(data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_payments').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/payments')
}

export async function deletePayment(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_payments').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/payments')
}

export async function createTaxRate(data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_tax_rates').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/tax-rates')
}

export async function updateTaxRate(id: string, data: any) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_tax_rates').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/tax-rates')
}

export async function deleteTaxRate(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('finance_tax_rates').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[orgSlug]/finance/tax-rates')
}