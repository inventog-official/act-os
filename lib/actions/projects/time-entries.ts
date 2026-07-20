'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

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
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('time_entries').insert({
    task_id: taskId,
    user_id: user.id,
    description: description || null,
    start_time: new Date().toISOString(),
    is_running: true,
  }).select().single()

  if (error) throw error
  return data as any
}

export async function stopTimer(entryId: string) {
  const supabase = await createServerSupabaseClient()
  const now = new Date().toISOString()

  const { data: entry } = await supabase.from('time_entries').select('start_time').eq('id', entryId).single()
  if (!entry) throw new Error('Time entry not found')

  const start = new Date(entry.start_time).getTime()
  const end = new Date().getTime()
  const durationMinutes = Math.round((end - start) / 60000)

  const { data, error } = await supabase.from('time_entries').update({
    end_time: now,
    duration_minutes: durationMinutes,
    is_running: false,
    updated_at: now,
  }).eq('id', entryId).select().single()

  if (error) throw error
  return data as any
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

  const { data, error } = await supabase.from('time_entries').insert({
    task_id: input.task_id,
    user_id: user.id,
    description: input.description || null,
    start_time: input.start_time,
    end_time: input.end_time || null,
    duration_minutes: input.duration_minutes || null,
    billable: input.billable ?? true,
    billable_rate: input.billable_rate || null,
    is_running: false,
  }).select().single()

  if (error) throw error
  return data as any
}

export async function deleteTimeEntry(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('time_entries').update({
    deleted_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw error
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
