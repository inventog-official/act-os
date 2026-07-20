import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import type { CrmTask } from '@/lib/types/database'

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
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('crm_tasks')
    .insert({
      ...input,
      status: input.status || 'pending',
      priority: input.priority || 'medium',
      is_recurring: input.is_recurring || false,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  return data as CrmTask
}

export async function updateTask(id: string, input: Partial<CrmTask>) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const updates: Partial<CrmTask> = { ...input, updated_by: user.id }
  if (input.status === 'completed' && !input.completed_at) {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('crm_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as CrmTask
}

export async function deleteTask(id: string) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('crm_tasks')
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', id)
  if (error) throw error
}
