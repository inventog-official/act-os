'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { timeEntries } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser, createProjectActivity } from './utils'

export async function getTimeEntries(taskId?: string | null, userId?: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('time_entries')
    .select('*, task:tasks(title), user:auth.users(id, email, user_metadata)')
    .is('deleted_at', null)
    .order('start_time', { ascending: false })
    .limit(100)
  if (taskId) query = query.eq('task_id', taskId)
  if (userId) query = query.eq('user_id', userId)
  const { data } = await query
  return (data || []) as any[]
}

export async function startTimer(taskId: string, description?: string | null) {
  const user = await getCurrentUser()
  const [entry] = await db.insert(timeEntries).values({
    taskId,
    userId: user.id,
    description: description || null,
    startTime: new Date(),
    isRunning: true,
  } as any).returning()
  return entry as any
}

export async function stopTimer(entryId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: entry } = await supabase.from('time_entries').select('start_time').eq('id', entryId).single()
  if (!entry) throw new Error('Time entry not found')

  const start = new Date(entry.start_time).getTime()
  const end = new Date().getTime()
  const durationMinutes = Math.round((end - start) / 60000)

  const [updated] = await db.update(timeEntries).set({
    endTime: new Date(),
    durationMinutes,
    isRunning: false,
    updatedAt: new Date(),
  } as any).where(eq(timeEntries.id, entryId)).returning()
  return updated as any
}

export async function createManualTimeEntry(input: {
  task_id: string
  description?: string | null
  start_time: string
  end_time?: string | null
  duration_minutes?: number | null
  billable?: boolean
  billable_rate?: number | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const [entry] = await db.insert(timeEntries).values({
    taskId: input.task_id,
    userId: user.id,
    description: input.description || null,
    startTime: input.start_time,
    endTime: input.end_time || null,
    durationMinutes: input.duration_minutes || null,
    billable: input.billable ?? true,
    billableRate: input.billable_rate || null,
    isRunning: false,
  } as any).returning()

  const { data: task } = await supabase.from('tasks').select('project_id').eq('id', input.task_id).single()
  if (task) {
    await createProjectActivity({
      project_id: (task as any).project_id,
      action: 'time.logged',
      description: 'Logged time on task',
    }).catch(() => {})
  }

  return entry as any
}

export async function deleteTimeEntry(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: entry } = await supabase.from('time_entries').select('task_id').eq('id', id).single()
  const { data: task } = entry
    ? await supabase.from('tasks').select('project_id, title').eq('id', (entry as any).task_id).single()
    : { data: null }

  await db.update(timeEntries).set({ deletedAt: new Date() }).where(eq(timeEntries.id, id))

  if (task) {
    await createProjectActivity({
      project_id: (task as any).project_id,
      action: 'time.deleted',
      description: `Deleted time entry on task "${(task as any).title}"`,
    }).catch(() => {})
  }

  return { success: true }
}

export async function getTimeReport(organizationId: string, startDate?: string, endDate?: string, userId?: string) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('time_entries')
    .select('*, task:tasks(title, project_id), user:auth.users(id, email, user_metadata)')
    .is('deleted_at', null)
  if (startDate) query = query.gte('start_time', startDate)
  if (endDate) query = query.lte('start_time', endDate)
  if (userId) query = query.eq('user_id', userId)

  const { data } = await query
  const entries = (data || []) as any[]
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
  const billableMinutes = entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
  const totalBillable = entries.filter(e => e.billable).reduce((sum, e) => sum + ((e.billable_rate || 0) * (e.duration_minutes || 0) / 60), 0)

  return {
    entries,
    total_hours: Math.round(totalMinutes / 60 * 100) / 100,
    billable_hours: Math.round(billableMinutes / 60 * 100) / 100,
    total_billable_amount: Math.round(totalBillable * 100) / 100,
    entry_count: entries.length,
  }
}
