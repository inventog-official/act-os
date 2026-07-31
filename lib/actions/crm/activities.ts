import { db } from '@/db'
import { crmActivities } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import { requirePermission } from '@/lib/auth/permissions'
import type { CrmActivity } from '@/lib/types/database'
import type { Permission } from '@/lib/auth/permissions'

async function getActivityOrgId(id: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_activities')
    .select('organization_id')
    .eq('id', id)
    .single()
  return data?.organization_id || ''
}

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
  await requirePermission(input.organization_id, 'crm:activities:create')
  const user = await getCurrentUser()

  const [data] = await db.insert(crmActivities).values({
    type: input.type,
    subject: input.subject,
    description: input.description ?? null,
    activityDate: input.activity_date ? new Date(input.activity_date) : new Date(),
    durationMinutes: input.duration_minutes ?? null,
    leadId: input.lead_id ?? null,
    companyId: input.company_id ?? null,
    contactId: input.contact_id ?? null,
    dealId: input.deal_id ?? null,
    organizationId: input.organization_id,
    workspaceId: input.workspace_id,
    assignedTo: input.assigned_to ?? null,
    createdBy: user.id,
  }).returning()

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

  return data as unknown as CrmActivity
}

export async function deleteActivity(id: string) {
  const orgId = await getActivityOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:activities:delete')
  await db.delete(crmActivities).where(eq(crmActivities.id, id))
}
