'use client'

import { useState, use, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Activity, ArrowRight, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { ActivityFeed } from '@/components/crm/activity-feed'
import { formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils'
import { useOrganizationStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-amber-500',
  qualified: 'bg-purple-500',
  proposal: 'bg-indigo-500',
  negotiation: 'bg-pink-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500',
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-5 mb-3" />
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="p-5"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
        <Card><CardContent className="p-5"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
      </div>
    </div>
  )
}

export default function CrmDashboardPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [leads, setLeads] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization?.id) return
    const orgId = currentOrganization.id

    setLoading(true)
    Promise.all([
      supabase.from('crm_leads').select('*').eq('organization_id', orgId).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('crm_deals').select('*').eq('organization_id', orgId).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('crm_activities').select('*').eq('organization_id', orgId).order('activity_date', { ascending: false }).limit(5),
    ])
      .then(([leadsRes, dealsRes, activitiesRes]) => {
        setLeads(leadsRes.data ?? [])
        setDeals(dealsRes.data ?? [])
        setActivities(activitiesRes.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentOrganization?.id, supabase])

  const totalLeads = leads.length
  const activeClients = deals.filter(d => d.pipeline_stage_id).length
  const pipelineValue = deals.reduce((sum, d) => sum + Number(d.deal_value), 0)
  const wonDeals = deals.filter(d => d.actual_close_date).length
  const conversionRate = totalLeads > 0 ? Math.round((wonDeals / totalLeads) * 100) : 0

  const stats = [
    { title: 'Total Leads', value: String(totalLeads), change: 'Active now', trend: 'up' as const, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/50' },
    { title: 'Active Clients', value: String(activeClients), change: 'In pipeline', trend: 'up' as const, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
    { title: 'Pipeline Value', value: formatCurrency(pipelineValue), change: 'Total deals', trend: 'up' as const, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/50' },
    { title: 'Conversion Rate', value: `${conversionRate}%`, change: `${wonDeals} won`, trend: 'up' as const, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/50' },
  ]

  const recentLeads = leads.slice(0, 5).map(l => ({
    id: l.id,
    name: `${l.first_name} ${l.last_name}`,
    company: l.company_name || '',
    status: l.status,
    value: Number(l.estimated_deal_value || 0),
    time: formatRelativeTime(l.created_at),
  }))

  const followUps = [
    ...deals.filter(d => d.expected_close_date && new Date(d.expected_close_date) > new Date()).slice(0, 3).map(d => ({
      time: d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString() : '',
      lead: d.name,
      type: 'Deal',
      priority: d.assigned_to ? 'high' as const : 'medium' as const,
    })),
    ...leads.filter(l => l.status === 'new').slice(0, 2).map(l => ({
      time: formatRelativeTime(l.created_at),
      lead: `${l.first_name} ${l.last_name}`,
      type: 'New Lead',
      priority: 'medium' as const,
    })),
  ]

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <CrmShell orgSlug={orgSlug}>
          <LoadingSkeleton />
        </CrmShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">CRM Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Overview of your sales pipeline and customer relationships</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(stat => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className={`rounded-xl p-3 ${stat.bg}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stat.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {stat.change}
                      </div>
                    </div>
                    <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
                    <p className="text-sm text-zinc-500">{stat.title}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Leads</CardTitle>
                <Link href={`/${orgSlug}/crm/leads`}>
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentLeads.length > 0 ? (
                  <div className="space-y-4">
                    {recentLeads.map(lead => (
                      <div key={lead.id} className="flex items-center gap-4">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">{getInitials(lead.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{lead.name}</p>
                          <p className="text-xs text-zinc-500">{lead.company || 'No company'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${statusColors[lead.status] || 'bg-zinc-400'}`} />
                          <span className="text-sm font-medium">{formatCurrency(lead.value)}</span>
                          <span className="text-xs text-zinc-400">{lead.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 py-8 text-center">No leads yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Follow-ups</CardTitle>
              </CardHeader>
              <CardContent>
                {followUps.length > 0 ? (
                  <div className="space-y-4">
                    {followUps.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{item.time}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.lead}</p>
                          <p className="text-xs text-zinc-500">{item.type}</p>
                        </div>
                        <Badge variant={item.priority === 'high' ? 'warning' : 'secondary'} className="text-[10px]">
                          {item.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 py-8 text-center">No upcoming follow-ups</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[300px]">
                {activities.length > 0 ? (
                  <ActivityFeed activities={activities as any} />
                ) : (
                  <p className="text-sm text-zinc-400 py-8 text-center">No activities yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href={`/${orgSlug}/crm/leads`}>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Users className="h-5 w-5" />
                      <span className="text-xs">New Lead</span>
                    </Button>
                  </Link>
                  <Link href={`/${orgSlug}/crm/companies`}>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Building2 className="h-5 w-5" />
                      <span className="text-xs">New Company</span>
                    </Button>
                  </Link>
                  <Link href={`/${orgSlug}/crm/contacts`}>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Users className="h-5 w-5" />
                      <span className="text-xs">New Contact</span>
                    </Button>
                  </Link>
                  <Link href={`/${orgSlug}/crm/pipeline`}>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Target className="h-5 w-5" />
                      <span className="text-xs">View Pipeline</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CrmShell>
    </DashboardShell>
  )
}
