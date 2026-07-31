'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { projects, projectMembers } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser, createProjectActivity } from './utils'

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
  return data as any
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
  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)

  const [project] = await db.insert(projects).values({
    name: input.name,
    slug,
    description: input.description || null,
    organizationId: input.organization_id,
    workspaceId: input.workspace_id || null,
    status: input.status || 'planning' as const,
    priority: input.priority || 'medium' as const,
    startDate: input.start_date || null,
    endDate: input.end_date || null,
    budget: input.budget || null,
    color: input.color || null,
    icon: input.icon || null,
    code: input.code || null,
    clientName: input.client_name || null,
    companyId: input.company_id || null,
    dealId: input.deal_id || null,
    leadId: input.lead_id || null,
    ownerId: input.owner_id || user.id,
    createdBy: user.id,
  } as any).returning()

  await createProjectActivity({
    project_id: project.id,
    action: 'project.created',
    description: `Created project "${input.name}"`,
  })

  return project as any
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
  const vals: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) vals.name = input.name
  if (input.description !== undefined) vals.description = input.description
  if (input.status !== undefined) vals.status = input.status
  if (input.priority !== undefined) vals.priority = input.priority
  if (input.start_date !== undefined) vals.startDate = input.start_date
  if (input.end_date !== undefined) vals.endDate = input.end_date
  if (input.budget !== undefined) vals.budget = input.budget
  if (input.color !== undefined) vals.color = input.color
  if (input.icon !== undefined) vals.icon = input.icon
  if (input.code !== undefined) vals.code = input.code
  if (input.client_name !== undefined) vals.clientName = input.client_name
  if (input.company_id !== undefined) vals.companyId = input.company_id
  if (input.deal_id !== undefined) vals.dealId = input.deal_id
  if (input.lead_id !== undefined) vals.leadId = input.lead_id
  if (input.owner_id !== undefined) vals.ownerId = input.owner_id
  if (input.is_public !== undefined) vals.isPublic = input.is_public
  if (input.progress !== undefined) vals.progress = input.progress

  const [project] = await db.update(projects).set(vals as any)
    .where(and(eq(projects.id, id), isNull(projects.deletedAt))).returning()

  await createProjectActivity({
    project_id: id,
    action: 'project.updated',
    description: `Updated project`,
    metadata: { changes: Object.keys(input) },
  })

  return project as any
}

export async function deleteProject(id: string) {
  await db.update(projects).set({ deletedAt: new Date() })
    .where(eq(projects.id, id))

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
  const projectsList = data || []
  return {
    total: projectsList.length,
    active: projectsList.filter(p => p.status === 'active').length,
    planning: projectsList.filter(p => p.status === 'planning').length,
    on_hold: projectsList.filter(p => p.status === 'on_hold').length,
    completed: projectsList.filter(p => p.status === 'completed').length,
    cancelled: projectsList.filter(p => p.status === 'cancelled').length,
    delayed: projectsList.filter(p => p.status === 'active' && p.end_date && new Date(p.end_date) < new Date()).length,
    avg_progress: projectsList.length > 0 ? Math.round(projectsList.reduce((a, p) => a + (p.progress || 0), 0) / projectsList.length) : 0,
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
      await db.update(projectMembers).set({ role: role as any }).where(eq(projectMembers.id, existing.data.id))
    } else {
      await db.delete(projectMembers).where(eq(projectMembers.id, existing.data.id))
    }
  } else {
    await db.insert(projectMembers).values({
      projectId, userId, role: (role || 'developer') as any, createdBy: user.id,
    } as any)
  }

  return { success: true }
}
