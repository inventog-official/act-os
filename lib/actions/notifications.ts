'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import type { Notification } from '@/lib/types/database'

export async function getNotifications(
  organizationId: string,
  userId: string,
  page = 1,
  limit = 20,
  filter?: 'read' | 'unread'
) {
  const supabase = await createServerSupabaseClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filter === 'read') query = query.eq('read', true)
  if (filter === 'unread') query = query.eq('read', false)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data as Notification[], count: count ?? 0 }
}

export async function getUnreadCount(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
  return count ?? 0
}

export async function markAsRead(id: string) {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id))
}

export async function markAllAsRead(userId: string) {
  await db.update(notifications).set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
}

export async function createNotification(input: {
  organization_id: string
  user_id: string
  title: string
  message?: string | null
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string | null
}) {
  const [n] = await db.insert(notifications).values({
    organizationId: input.organization_id,
    userId: input.user_id,
    title: input.title,
    message: input.message ?? null,
    type: input.type ?? 'info',
    read: false,
    link: input.link ?? null,
  } as any).returning()
  return n as any as Notification
}

export async function deleteNotification(id: string) {
  await db.delete(notifications).where(eq(notifications.id, id))
}

export async function getRecentNotifications(organizationId: string, userId: string, limit = 10) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as Notification[]
}
