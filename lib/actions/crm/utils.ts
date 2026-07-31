import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { crmTimeline, organizationMembers, authUsers } from '@/db/schema'
import { eq } from 'drizzle-orm'

type EntityType = 'lead' | 'company' | 'contact' | 'deal' | 'activity' | 'note' | 'task'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function createTimelineEntry(params: {
  action: string
  description: string | null
  entity_type: EntityType
  entity_id: string
  lead_id?: string | null
  company_id?: string | null
  contact_id?: string | null
  deal_id?: string | null
  metadata?: Record<string, unknown>
  organization_id: string
  workspace_id: string | null
}) {
  const user = await getCurrentUser()

  try {
    await db.insert(crmTimeline).values({
      action: params.action,
      description: params.description,
      entityType: params.entity_type,
      entityId: params.entity_id,
      leadId: params.lead_id || null,
      companyId: params.company_id || null,
      contactId: params.contact_id || null,
      dealId: params.deal_id || null,
      metadata: params.metadata || {},
      organizationId: params.organization_id,
      workspaceId: params.workspace_id,
      createdBy: user.id,
    })
  } catch (e) {
    console.error('Timeline insert error:', e)
  }
}

export async function getOrganizationMembers(organizationId: string) {
  const rows = await db.select({
    userId: organizationMembers.userId,
    email: authUsers.email,
  }).from(organizationMembers)
    .leftJoin(authUsers, eq(organizationMembers.userId, authUsers.id))
    .where(eq(organizationMembers.organizationId, organizationId))
  return rows.map(r => ({ user_id: r.userId, user: { email: r.email } }))
}
