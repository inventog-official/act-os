import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'
import type { CrmPipeline, CrmPipelineStage } from '@/lib/types/database'

export async function getPipelines(organizationId: string, workspaceId: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_pipelines')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data as CrmPipeline[]
}

export async function getDefaultPipeline(organizationId: string, workspaceId: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_pipelines')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .limit(1)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return (data as CrmPipeline[])?.[0] || null
}

export async function getPipelineStages(pipelineId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_pipeline_stages')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data as CrmPipelineStage[]
}

export async function createPipeline(input: {
  name: string
  description?: string | null
  is_default?: boolean
  organization_id: string
  workspace_id: string | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('crm_pipelines')
    .insert({ ...input, created_by: user.id })
    .select()
    .single()

  if (error) throw error
  return data as CrmPipeline
}

export async function createStage(input: {
  pipeline_id: string
  name: string
  color?: string
  probability?: number
  order_index: number
}) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_pipeline_stages')
    .insert({
      ...input,
      color: input.color || '#6b7280',
      probability: input.probability ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as CrmPipelineStage
}

export async function updateStage(id: string, input: Partial<CrmPipelineStage>) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_pipeline_stages')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as CrmPipelineStage
}
