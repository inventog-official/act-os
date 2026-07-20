'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Settings2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { PipelineBoard } from '@/components/crm/pipeline-board'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { CrmDeal, CrmPipeline, CrmPipelineStage } from '@/lib/types/database'

export default function PipelinePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()

  const [pipeline, setPipeline] = useState<CrmPipeline | null>(null)
  const [stages, setStages] = useState<CrmPipelineStage[]>([])
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewDeal, setShowNewDeal] = useState(false)
  const [showManageStages, setShowManageStages] = useState(false)
  const [dealForm, setDealForm] = useState({ name: '', deal_value: 0, pipeline_stage_id: '' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const { data: pipelines } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .limit(1)

      const currentPipeline = (pipelines?.[0] || null) as CrmPipeline | null
      setPipeline(currentPipeline)

      if (currentPipeline) {
        const [stagesRes, dealsRes] = await Promise.all([
          supabase.from('crm_pipeline_stages').select('*').eq('pipeline_id', currentPipeline.id).order('order_index'),
          supabase.from('crm_deals').select('*').eq('organization_id', currentPipeline.organization_id).is('deleted_at', null),
        ])
        setStages((stagesRes.data || []) as CrmPipelineStage[])
        setDeals((dealsRes.data || []) as CrmDeal[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleMoveDeal = async (dealId: string, stageId: string) => {
    const { error } = await supabase.from('crm_deals').update({ pipeline_stage_id: stageId }).eq('id', dealId)
    if (!error) {
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, pipeline_stage_id: stageId } : d))
    }
  }

  const handleCreateDeal = async () => {
    if (!currentOrganization || !pipeline || !dealForm.pipeline_stage_id) return
    try {
      const { error } = await supabase.from('crm_deals').insert({
        name: dealForm.name,
        deal_value: dealForm.deal_value,
        pipeline_id: pipeline.id,
        pipeline_stage_id: dealForm.pipeline_stage_id,
        probability: stages.find(s => s.id === dealForm.pipeline_stage_id)?.probability || 0,
        organization_id: currentOrganization.id,
        workspace_id: null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (error) throw error
      toast.success('Deal created')
      setShowNewDeal(false)
      setDealForm({ name: '', deal_value: 0, pipeline_stage_id: '' })
      fetchData()
    } catch (err: any) { toast.error(err.message) }
  }

  if (isLoading) return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
      </CrmShell>
    </DashboardShell>
  )

  return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{pipeline?.name || 'Sales Pipeline'}</h1>
              <p className="text-sm text-zinc-500 mt-1">Drag and drop deals to update stages</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowManageStages(true)}>
                <Settings2 className="h-4 w-4 mr-1" />Stages
              </Button>
              <Button size="sm" onClick={() => setShowNewDeal(true)}>
                <Plus className="h-4 w-4 mr-1" />New Deal
              </Button>
            </div>
          </div>

          <PipelineBoard
            stages={stages}
            deals={deals}
            onMoveDeal={handleMoveDeal}
          />
        </div>

        <Dialog open={showManageStages} onOpenChange={setShowManageStages}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Manage Stages</DialogTitle>
              <DialogDescription>Configure your pipeline stages</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {stages.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="flex-1 text-sm font-medium">{stage.name}</span>
                  <span className="text-xs text-zinc-400">{stage.probability}%</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showNewDeal} onOpenChange={setShowNewDeal}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>New Deal</DialogTitle>
              <DialogDescription>Add a new deal to the pipeline</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input label="Deal Name *" value={dealForm.name} onChange={e => setDealForm(p => ({ ...p, name: e.target.value }))} />
              <Input label="Deal Value" type="number" value={dealForm.deal_value || ''} onChange={e => setDealForm(p => ({ ...p, deal_value: Number(e.target.value) }))} />
              <div>
                <label className="text-sm font-medium mb-1 block">Stage *</label>
                <Select value={dealForm.pipeline_stage_id} onValueChange={v => setDealForm(p => ({ ...p, pipeline_stage_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {stages.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDeal(false)}>Cancel</Button>
                <Button onClick={handleCreateDeal}>Create</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </CrmShell>
    </DashboardShell>
  )
}
