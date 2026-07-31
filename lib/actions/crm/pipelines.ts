import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'
import { requirePermission } from '@/lib/auth/permissions'
import { db } from '@/db'
import { crmPipelines, crmPipelineStages } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { CrmPipeline, CrmPipelineStage } from '@/lib/types/database'

async function getPipelineOrgId(id: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_pipelines')
    .select('organization_id')
    .eq('id', id)
    .single()
  return data?.organization_id || ''
}

async function getStagePipelineId(id: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_pipeline_stages')
    .select('pipeline_id')
    .eq('id', id)
    .single()
  return data?.pipeline_id || ''
}

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
  await requirePermission(input.organization_id, 'crm:pipeline:manage')
  const user = await getCurrentUser()

  const [data] = await db.insert(crmPipelines).values({
    name: input.name,
    description: input.description,
    organizationId: input.organization_id,
    workspaceId: input.workspace_id,
    isDefault: input.is_default ?? false,
    createdBy: user.id,
  }).returning()

  return data as unknown as CrmPipeline
}

export async function createStage(input: {
  pipeline_id: string
  name: string
  color?: string
  probability?: number
  order_index: number
}) {
  const orgId = await getPipelineOrgId(input.pipeline_id)
  if (orgId) await requirePermission(orgId, 'crm:pipeline:manage')

  const [data] = await db.insert(crmPipelineStages).values({
    pipelineId: input.pipeline_id,
    name: input.name,
    color: input.color ?? '#6b7280',
    probability: input.probability ?? 0,
    orderIndex: input.order_index,
  }).returning()

  return data as unknown as CrmPipelineStage
}

export async function updateStage(id: string, input: Partial<CrmPipelineStage>) {
  const pipelineId = await getStagePipelineId(id)
  if (pipelineId) {
    const orgId = await getPipelineOrgId(pipelineId)
    if (orgId) await requirePermission(orgId, 'crm:pipeline:manage')
  }

  const stageData: Partial<typeof crmPipelineStages.$inferInsert> = {}
  if (input.name !== undefined) stageData.name = input.name
  if (input.color !== undefined) stageData.color = input.color
  if (input.probability !== undefined) stageData.probability = input.probability
  if (input.order_index !== undefined) stageData.orderIndex = input.order_index
  if (input.pipeline_id !== undefined) stageData.pipelineId = input.pipeline_id

  const [data] = await db.update(crmPipelineStages)
    .set(stageData)
    .where(eq(crmPipelineStages.id, id))
    .returning()

  return data as unknown as CrmPipelineStage
}

export async function updatePipelineStages(stages: { id: string; name?: string; color?: string; probability?: number; order_index?: number }[]) {
  await db.transaction(async (tx) => {
    for (const stage of stages) {
      const stageData: Partial<typeof crmPipelineStages.$inferInsert> = {}
      if (stage.name !== undefined) stageData.name = stage.name
      if (stage.color !== undefined) stageData.color = stage.color
      if (stage.probability !== undefined) stageData.probability = stage.probability
      if (stage.order_index !== undefined) stageData.orderIndex = stage.order_index

      await tx.update(crmPipelineStages)
        .set(stageData)
        .where(eq(crmPipelineStages.id, stage.id))
    }
  })
}

export async function deletePipeline(id: string) {
  const orgId = await getPipelineOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:pipeline:manage')
  await db.update(crmPipelines).set({ deletedAt: new Date() }).where(eq(crmPipelines.id, id))
}

export async function deleteStage(id: string) {
  const pipelineId = await getStagePipelineId(id)
  if (pipelineId) {
    const orgId = await getPipelineOrgId(pipelineId)
    if (orgId) await requirePermission(orgId, 'crm:pipeline:manage')
  }
  await db.delete(crmPipelineStages).where(eq(crmPipelineStages.id, id))
}
