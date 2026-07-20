'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FolderKanban, Loader2, TrendingUp, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { StatusPieChart, PriorityBarChart } from '@/components/projects/project-dashboard-charts'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'

export default function ProjectsDashboardPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!currentOrganization) return
      setIsLoading(true)
      const query = supabase.from('projects').select('*').eq('organization_id', currentOrganization.id).is('deleted_at', null).order('created_at', { ascending: false })
      const { data } = await query
      setProjects(data || [])
      setIsLoading(false)
    }
    fetch()
  }, [currentOrganization, supabase])

  const active = projects.filter(p => p.status === 'active')
  const completed = projects.filter(p => p.status === 'completed')
  const delayed = projects.filter(p => p.status === 'active' && p.end_date && new Date(p.end_date).getTime() < now)
  const planning = projects.filter(p => p.status === 'planning')

  const now = Date.now()
  const upcomingDeadlines = projects
    .filter(p => p.status === 'active' && p.end_date)
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
    .slice(0, 5)
  const getDeadlineDays = (endDate: string) => Math.ceil((new Date(endDate).getTime() - now) / (1000 * 60 * 60 * 24))
  const isOverdue = (endDate: string) => new Date(endDate).getTime() < now

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Project Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Overview of all projects</p>
          </div>
          <div className="flex gap-2">            <Button variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />New Project
            </Button>
            <Button onClick={() => router.push(`/${orgSlug}/projects`)}>
              <FolderKanban className="mr-2 h-4 w-4" />All Projects
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-950"><FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
              <div><p className="text-xs text-zinc-500">Total</p><p className="text-2xl font-bold">{projects.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-950"><TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
              <div><p className="text-xs text-zinc-500">Active</p><p className="text-2xl font-bold">{active.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-950"><CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
              <div><p className="text-xs text-zinc-500">Completed</p><p className="text-2xl font-bold">{completed.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2.5 dark:bg-red-950"><AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
              <div><p className="text-xs text-zinc-500">Delayed</p><p className="text-2xl font-bold">{delayed.length}</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Upcoming Deadlines</CardTitle></CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map(p => (
                    <div key={p.id} className="flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => router.push(`/${orgSlug}/projects/${p.id}`)}>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-zinc-400">{formatDate(p.end_date)}</p>
                        </div>
                      </div>
                      <Badge variant={isOverdue(p.end_date) ? 'destructive' : 'secondary'} className="text-[10px]">
                        {getDeadlineDays(p.end_date)}d
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Project Health</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {projects.slice(0, 8).map(p => (
                <div key={p.id} className="space-y-1 cursor-pointer" onClick={() => router.push(`/${orgSlug}/projects/${p.id}`)}>
                  <div className="flex justify-between text-sm"><span>{p.name}</span><span>{p.progress || 0}%</span></div>
                  <Progress value={p.progress || 0} className="h-1.5" />
                </div>
              ))}
              {projects.length === 0 && <p className="text-sm text-zinc-400 py-4 text-center">No projects</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <StatusPieChart data={[
            { name: 'Planning', value: planning.length },
            { name: 'Active', value: active.length },
            { name: 'On Hold', value: projects.filter(p => p.status === 'on_hold').length },
            { name: 'Completed', value: completed.length },
            { name: 'Cancelled', value: projects.filter(p => p.status === 'cancelled').length },
          ]} />
          <PriorityBarChart data={[
            { priority: 'Low', count: projects.filter(p => p.priority === 'low').length },
            { priority: 'Medium', count: projects.filter(p => p.priority === 'medium').length },
            { priority: 'High', count: projects.filter(p => p.priority === 'high').length },
            { priority: 'Urgent', count: projects.filter(p => p.priority === 'urgent').length },
          ]} />
        </div>
      </div>

      <CreateProjectDialog open={showCreate} onOpenChange={setShowCreate} />
    </DashboardShell>
  )
}
