'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { calendarActivities, meetingActivities } from '@/db/schema/calendar'
import { requirePermission, type Permission } from '@/lib/auth/permissions'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function getOrganizationId() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: member, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  if (error || !member) throw new Error('Not a member of any organization')
  return member.organization_id as string
}

export async function guardCalendarPermission(organizationId: string, permission: Permission) {
  await requirePermission(organizationId, permission)
}

export async function logCalendarActivity(input: {
  organizationId: string
  action: string
  resource: string
  eventId?: string | null
  resourceId?: string | null
  metadata?: Record<string, unknown>
}) {
  const user = await getCurrentUser()
  await db.insert(calendarActivities).values({
    organizationId: input.organizationId,
    userId: user.id,
    eventId: input.eventId ?? null,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    metadata: JSON.stringify(input.metadata ?? {}),
  } as any).returning()
}

export async function logMeetingActivity(input: {
  organizationId: string
  action: string
  resource: string
  meetingId?: string | null
  resourceId?: string | null
  metadata?: Record<string, unknown>
}) {
  const user = await getCurrentUser()
  await db.insert(meetingActivities).values({
    organizationId: input.organizationId,
    userId: user.id,
    meetingId: input.meetingId ?? null,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    metadata: JSON.stringify(input.metadata ?? {}),
  } as any).returning()
}