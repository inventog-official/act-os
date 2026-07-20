'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createProjectActivity } from './utils'
import type { Project } from '@/lib/types/database'

export async function getProjects(organizationId: string, workspaceId?: string | null) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('projects')
    .select('*, owner:auth.users!owner_id(id, email, user_metadata), members:project_members(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data } = await query
  return (data || []) as any[]
}

export async function getProjectById(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('projects')
    .select('*, owner:auth.users!owner_id(id, email, user_metadata), members:project_members(*), tags:project_tags(*), activities:project_activities(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  return data as any
}

export async function getProjectBySlug(organizationId: string, slug: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  return data as Project | null
}

export async function createProject(input: {
  name: string
  slug?: string
  description?: string | null
  organization_id: string
  workspace_id?: string | null
  status?: string
  priority?: string
  start_date?: string | null
  end_date?: string | null
  budget?: number | null
  color?: string | null
  icon?: string | null
  code?: string | null
  client_name?: string | null
  company_id?: string | null
  deal_id?: string | null
  lead_id?: string | null
  owner_id?: string | null
  is_public?: boolean
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)

  const { data, error } = await supabase.from('projects').insert({
    name: input.name,
    slug,
    description: input.description || null,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id || null,
    status: input.status || 'planning',
    priority: input.priority || 'medium',
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    budget: input.budget || null,
    color: input.color || null,
    icon: input.icon || null,
    code: input.code || null,
    client_name: input.client_name || null,
    company_id: input.company_id || null,
    deal_id: input.deal_id || null,
    lead_id: input.lead_id || null,
    owner_id: input.owner_id || user.id,
    created_by: user.id,
  }).select().single()

  if (error) throw error

  await createProjectActivity({
    project_id: data.id,
    action: 'project.created',
    description: `Created project "${input.name}"`,
  })

  return data as any
}

export async function updateProject(id: string, input: Partial<{
  name: string
  description: string | null
  status: string
  priority: string
  start_date: string | null
  end_date: string | null
  budget: number | null
  color: string | null
  icon: string | null
  code: string | null
  client_name: string | null
  company_id: string | null
  deal_id: string | null
  lead_id: string | null
  owner_id: string
  is_public: boolean
  progress: number
}>) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('projects').update({
    ...input,
    updated_at: new Date().toISOString(),
  }).eq('id', id).is('deleted_at', null).select().single()

  if (error) throw error

  await createProjectActivity({
    project_id: id,
    action: 'project.updated',
    description: `Updated project`,
    metadata: { changes: Object.keys(input) },
  })

  return data as any
}

export async function deleteProject(id: string) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('projects').update({
    deleted_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw error

  await createProjectActivity({
    project_id: id,
    action: 'project.deleted',
    description: 'Deleted project',
  })

  return { success: true }
}

export async function getProjectStats(organizationId: string, workspaceId?: string | null) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('projects')
    .select('id, status, priority, end_date, progress')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data } = await query
  const projects = data || []

  return {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    planning: projects.filter(p => p.status === 'planning').length,
    on_hold: projects.filter(p => p.status === 'on_hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
    delayed: projects.filter(p => p.status === 'active' && p.end_date && new Date(p.end_date) < new Date()).length,
    avg_progress: projects.length > 0 ? Math.round(projects.reduce((a, p) => a + (p.progress || 0), 0) / projects.length) : 0,
  }
}

export async function toggleProjectMember(projectId: string, userId: string, role?: string) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const existing = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (existing.data) {
    if (role) {
      const { error } = await supabase.from('project_members').update({ role }).eq('id', existing.data.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('project_members').delete().eq('id', existing.data.id)
      if (error) throw error
    }
  } else {
    const { error } = await supabase.from('project_members').insert({
      project_id: projectId,
      user_id: userId,
      role: role || 'member',
      created_by: user.id,
    })
    if (error) throw error
  }

  return { success: true }
}
