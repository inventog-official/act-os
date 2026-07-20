import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import type { CrmActivity } from '@/lib/types/database'

export async function getActivities(organizationId: string, workspaceId: string | null, limit = 50) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_activities')
    .select('*')
    .eq('organization_id', organizationId)
    .order('activity_date', { ascending: false })
    .limit(limit)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data as CrmActivity[]
}

export async function getActivitiesForEntity(
  entityType: 'lead_id' | 'company_id' | 'contact_id' | 'deal_id',
  entityId: string,
) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq(entityType, entityId)
    .order('activity_date', { ascending: false })
    .limit(20)

  if (error) throw error
  return data as CrmActivity[]
}

export async function createActivity(input: {
  type: string
  subject: string
  description?: string | null
  activity_date?: string
  duration_minutes?: number | null
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
    .from('crm_activities')
    .insert({
      ...input,
      activity_date: input.activity_date || new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  await createTimelineEntry({
    action: `activity_${input.type}`,
    description: `${input.type}: ${input.subject}`,
    entity_type: 'activity',
    entity_id: data.id,
    lead_id: input.lead_id,
    company_id: input.company_id,
    contact_id: input.contact_id,
    deal_id: input.deal_id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as CrmActivity
}

export async function deleteActivity(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('crm_activities').delete().eq('id', id)
  if (error) throw error
}
