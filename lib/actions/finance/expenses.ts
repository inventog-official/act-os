'use server'

import { db } from '@/db'
import { financeExpenseCategories, financeExpenses } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

export async function getExpenseCategories(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('finance_expense_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data
}

export async function createExpenseCategory(input: {
  name: string
  description?: string | null
  color?: string
  organizationId: string
  workspaceId?: string | null
}) {
  const user = await getCurrentUser()

  const [data] = await db
    .insert(financeExpenseCategories)
    .values({
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? '#6b7280',
      organizationId: input.organizationId,
      workspaceId: input.workspaceId ?? null,
      createdBy: user.id,
    })
    .returning()

  return data
}

export async function updateExpenseCategory(id: string, input: {
  name?: string
  description?: string | null
  color?: string
}) {
  const user = await getCurrentUser()

  const values: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) values.name = input.name
  if (input.description !== undefined) values.description = input.description ?? null
  if (input.color !== undefined) values.color = input.color

  await db
    .update(financeExpenseCategories)
    .set(values)
    .where(and(eq(financeExpenseCategories.id, id), isNull(financeExpenseCategories.deletedAt)))

  return { success: true, updatedBy: user.id }
}

export async function deleteExpenseCategory(id: string) {
  await db
    .update(financeExpenseCategories)
    .set({ deletedAt: new Date() })
    .where(eq(financeExpenseCategories.id, id))
  return { success: true }
}

export async function getExpenses(
  organizationId: string,
  workspaceId?: string,
) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('finance_expenses')
    .select('*, category:category_id(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('expense_date', { ascending: false })

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function uploadExpenseReceipt(formData: FormData) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const file = formData.get('file') as File | null
  const organizationId = formData.get('organizationId') as string | null
  if (!file) throw new Error('No file provided')
  if (!organizationId) throw new Error('Organization is required')

  const ext = file.name.split('.').pop() || 'bin'
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
  const path = `${organizationId}/${Date.now()}_${safeName}`

  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) throw error

  const { data: publicUrl } = supabase.storage
    .from('receipts')
    .getPublicUrl(data.path)

  return { path: data.path, url: publicUrl.publicUrl, uploadedBy: user.id }
}
export async function getExpenseById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('finance_expenses')
    .select('*, category:category_id(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createExpense(input: {
  title: string
  categoryId?: string | null
  vendor?: string | null
  projectId?: string | null
  companyId?: string | null
  amount: number
  currency?: string
  taxAmount?: number
  expenseDate: string
  receiptUrl?: string | null
  notes?: string | null
  billable?: boolean
  organizationId: string
  workspaceId?: string | null
}) {
  const user = await getCurrentUser()

  const [data] = await db
    .insert(financeExpenses)
    .values({
      title: input.title,
      categoryId: input.categoryId ?? null,
      vendor: input.vendor ?? null,
      projectId: input.projectId ?? null,
      companyId: input.companyId ?? null,
      amount: String(input.amount),
      currency: input.currency ?? 'USD',
      taxAmount: input.taxAmount != null ? String(input.taxAmount) : null,
      expenseDate: new Date(input.expenseDate),
      receiptUrl: input.receiptUrl ?? null,
      notes: input.notes ?? null,
      billable: input.billable ?? false,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId ?? null,
      createdBy: user.id,
    })
    .returning()

  return data
}

export async function updateExpense(
  id: string,
  input: {
    title?: string
    categoryId?: string | null
    vendor?: string | null
    projectId?: string | null
    companyId?: string | null
    amount?: number
    currency?: string
    taxAmount?: number
    expenseDate?: string
    receiptUrl?: string | null
    notes?: string | null
    billable?: boolean
  },
) {
  const user = await getCurrentUser()

  const values: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: user.id,
  }
  if (input.title !== undefined) values.title = input.title
  if (input.categoryId !== undefined)
    values.categoryId = input.categoryId ?? null
  if (input.vendor !== undefined) values.vendor = input.vendor ?? null
  if (input.projectId !== undefined)
    values.projectId = input.projectId ?? null
  if (input.companyId !== undefined)
    values.companyId = input.companyId ?? null
  if (input.amount !== undefined) values.amount = String(input.amount)
  if (input.currency !== undefined) values.currency = input.currency
  if (input.taxAmount !== undefined)
    values.taxAmount =
      input.taxAmount != null ? String(input.taxAmount) : null
  if (input.expenseDate !== undefined)
    values.expenseDate = new Date(input.expenseDate)
  if (input.receiptUrl !== undefined)
    values.receiptUrl = input.receiptUrl ?? null
  if (input.notes !== undefined) values.notes = input.notes ?? null
  if (input.billable !== undefined) values.billable = input.billable

  await db
    .update(financeExpenses)
    .set(values)
    .where(eq(financeExpenses.id, id))
}

export async function deleteExpense(id: string) {
  await db
    .update(financeExpenses)
    .set({ deletedAt: new Date() })
    .where(eq(financeExpenses.id, id))
}
