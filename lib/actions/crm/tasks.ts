import { db } from '@/db'
import { crmTasks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import { requirePermission } from '@/lib/auth/permissions'
import type { CrmTask } from '@/lib/types/database'
import type { Permission } from '@/lib/auth/permissions'

async function getTaskOrgId(id: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_tasks')
    .select('organization_id')
    .eq('id', id)
    .single()
  return data?.organization_id || ''
}

export async function getTasks(organizationId: string, workspaceId: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_tasks')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true })

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data as CrmTask[]
}

export async function createTask(input: {
  title: string
  description?: string | null
  status?: string
  priority?: string
  due_date?: string | null
  reminder_at?: string | null
  is_recurring?: boolean
  recurring_interval?: string | null
  lead_id?: string | null
  company_id?: string | null
  contact_id?: string | null
  deal_id?: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to?: string | null
}) {
  await requirePermission(input.organization_id, 'crm:tasks:create')
  const user = await getCurrentUser()

  const [data] = await db.insert(crmTasks).values({
    title: input.title,
    description: input.description ?? null,
    status: input.status || 'pending',
    priority: input.priority || 'medium',
    dueDate: input.due_date ? new Date(input.due_date) : null,
    reminderAt: input.reminder_at ? new Date(input.reminder_at) : null,
    isRecurring: input.is_recurring ?? false,
    recurringInterval: input.recurring_interval ?? null,
    leadId: input.lead_id ?? null,
    companyId: input.company_id ?? null,
    contactId: input.contact_id ?? null,
    dealId: input.deal_id ?? null,
    organizationId: input.organization_id,
    workspaceId: input.workspace_id,
    assignedTo: input.assigned_to ?? null,
    createdBy: user.id,
    updatedBy: user.id,
  }).returning()

  return data as unknown as CrmTask
}

export async function updateTask(id: string, input: Partial<CrmTask>) {
  const orgId = await getTaskOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:tasks:update')
  const user = await getCurrentUser()

  const vals: Record<string, unknown> = { updatedBy: user.id }
  if (input.title !== undefined) vals.title = input.title
  if (input.description !== undefined) vals.description = input.description
  if (input.status !== undefined) vals.status = input.status
  if (input.priority !== undefined) vals.priority = input.priority
  if (input.due_date !== undefined) vals.dueDate = input.due_date ? new Date(input.due_date) : null
  if (input.reminder_at !== undefined) vals.reminderAt = input.reminder_at ? new Date(input.reminder_at) : null
  if (input.is_recurring !== undefined) vals.isRecurring = input.is_recurring
  if (input.recurring_interval !== undefined) vals.recurringInterval = input.recurring_interval
  if (input.lead_id !== undefined) vals.leadId = input.lead_id
  if (input.company_id !== undefined) vals.companyId = input.company_id
  if (input.contact_id !== undefined) vals.contactId = input.contact_id
  if (input.deal_id !== undefined) vals.dealId = input.deal_id
  if (input.organization_id !== undefined) vals.organizationId = input.organization_id
  if (input.workspace_id !== undefined) vals.workspaceId = input.workspace_id
  if (input.assigned_to !== undefined) vals.assignedTo = input.assigned_to
  if (input.completed_at !== undefined) {
    vals.completedAt = input.completed_at ? new Date(input.completed_at) : null
  } else if (input.status === 'completed') {
    vals.completedAt = new Date()
  }

  const [data] = await db.update(crmTasks).set(vals).where(eq(crmTasks.id, id)).returning()

  return data as unknown as CrmTask
}

export async function deleteTask(id: string) {
  const orgId = await getTaskOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:tasks:delete')
  const user = await getCurrentUser()
  await db.update(crmTasks).set({ deletedAt: new Date(), updatedBy: user.id }).where(eq(crmTasks.id, id))
}
