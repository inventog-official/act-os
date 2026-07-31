'use client'

import { useState, use, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Loader2, TrendingUp, User, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import type { CrmDeal, CrmPipelineStage } from '@/lib/types/database'

export default function DealsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [deals, setDeals] = useState<(CrmDeal & { stage_name?: string })[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [stages, setStages] = useState<CrmPipelineStage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchDeals = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const { data: pipelines } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .limit(1)

      const pipeline = pipelines?.[0]
      if (!pipeline) { setIsLoading(false); return }

      const [stagesRes, dealsRes] = await Promise.all([
        supabase.from('crm_pipeline_stages').select('*').eq('pipeline_id', pipeline.id).order('order_index'),
        supabase.from('crm_deals').select('*').eq('organization_id', currentOrganization.id).is('deleted_at', null).order('created_at', { ascending: false }),
      ])

      const s = (stagesRes.data || []) as CrmPipelineStage[]
      setStages(s)
      const stageMap = Object.fromEntries(s.map(st => [st.id, st.name]))

      const d = ((dealsRes.data || []) as CrmDeal[]).map(deal => ({
        ...deal,
        stage_name: stageMap[deal.pipeline_stage_id] || 'Unknown',
      }))
      setDeals(d)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  const filtered = deals.filter(deal => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!deal.name.toLowerCase().includes(q)) return false
    }
    if (stageFilter !== 'all' && deal.pipeline_stage_id !== stageFilter) return false
    return true
  })

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
              <h1 className="text-2xl font-semibold">Deals</h1>
              <p className="text-sm text-zinc-500 mt-1">View all deals across your pipeline</p>
            </div>
            <Button size="sm" asChild>
              <Link href={`/${orgSlug}/crm/pipeline`}>
                <TrendingUp className="h-4 w-4 mr-1" />Pipeline View
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                placeholder="Search deals..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map(deal => (
                <Link key={deal.id} href={`/${orgSlug}/crm/deals/${deal.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-zinc-100 dark:bg-zinc-800">
                            {getInitials(deal.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{deal.name}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{deal.stage_name}</Badge>
                            <span>{formatCurrency(deal.deal_value)}</span>
                            <span>· {deal.probability}% probability</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400 shrink-0">
                        {deal.expected_close_date ? `Close: ${formatDate(deal.expected_close_date)}` : ''}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-zinc-400">No deals yet</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href={`/${orgSlug}/crm/pipeline`}>
                  <TrendingUp className="h-4 w-4 mr-1" />Go to Pipeline
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CrmShell>
    </DashboardShell>
  )
}
