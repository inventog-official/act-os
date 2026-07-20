'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Loader2, Target, PlayCircle, CheckCircle2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function SprintsPage({ params }: { params: Promise<{ orgSlug: string; projectId: string }> }) {
  const { orgSlug, projectId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const [sprints, setSprints] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [formData, setFormData] = useState({ name: '', goal: '', start_date: '', end_date: '' })

  const fetch = useCallback(async () => {
    setIsLoading(true)
    const [sRes, tRes] = await Promise.all([
      supabase.from('sprints').select('*, tasks:sprint_tasks(task:tasks(*))').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('project_id', projectId).is('deleted_at', null),
    ])
    setSprints(sRes.data || [])
    setTasks(tRes.data || [])
    setIsLoading(false)
  }, [projectId, supabase])

  useEffect(() => { fetch() }, [fetch])

  const handleCreate = async () => {
    if (!formData.name.trim()) return
    const { error } = await supabase.from('sprints').insert({
      project_id: projectId, name: formData.name, goal: formData.goal || null,
      start_date: formData.start_date || null, end_date: formData.end_date || null,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Sprint created')
    setShowNew(false)
    setFormData({ name: '', goal: '', start_date: '', end_date: '' })
    fetch()
  }

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('sprints').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`Sprint ${status}`)
    fetch()
  }

  const activeSprint = sprints.find(s => s.status === 'active')
  const completedSprints = sprints.filter(s => s.status === 'completed')
  const planningSprints = sprints.filter(s => s.status === 'planning')

  const velocity = completedSprints.map(s => ({
    name: s.name, completed: (s.tasks || []).filter((st: any) => st.task?.status === 'done').length,
    total: (s.tasks || []).length,
  }))

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/${orgSlug}/projects/${projectId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Sprints</h1>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />New Sprint</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
        ) : (
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="planning">Planning ({planningSprints.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedSprints.length})</TabsTrigger>
              <TabsTrigger value="velocity">Velocity</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeSprint ? (
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <PlayCircle className="h-5 w-5 text-emerald-500" />
                          <h3 className="font-semibold text-lg">{activeSprint.name}</h3>
                          <Badge variant="success">Active</Badge>
                        </div>
                        {activeSprint.goal && <p className="text-sm text-zinc-500 mt-1">{activeSprint.goal}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {activeSprint.start_date && <span className="text-xs text-zinc-400">{formatDate(activeSprint.start_date)}</span>}
                        {activeSprint.end_date && <span className="text-xs text-zinc-400">→ {formatDate(activeSprint.end_date)}</span>}
                        <Button variant="outline" size="sm" onClick={() => handleStatusChange(activeSprint.id, 'completed')}>Complete</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(activeSprint.tasks || []).map((st: any) => (
                        <div key={st.task?.id || st.id} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <div className={`h-1.5 w-1.5 rounded-full ${st.task?.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className={st.task?.status === 'done' ? 'line-through text-zinc-400' : ''}>{st.task?.title || 'Unknown task'}</span>
                          <Badge variant="secondary" className="text-[9px] ml-auto">{st.task?.status || '—'}</Badge>
                        </div>
                      ))}
                      {(!activeSprint.tasks || activeSprint.tasks.length === 0) && (
                        <p className="text-sm text-zinc-400 py-4 text-center">No tasks in this sprint</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-16"><Target className="h-8 w-8 text-zinc-300 mx-auto mb-3" /><p className="text-sm text-zinc-400">No active sprint</p></div>
              )}
            </TabsContent>

            <TabsContent value="planning" className="mt-6 space-y-4">
              {planningSprints.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">No planning sprints</p>
              ) : planningSprints.map(s => (
                <Card key={s.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div><p className="font-medium">{s.name}</p>{s.goal && <p className="text-xs text-zinc-500">{s.goal}</p>}</div>
                    <Button size="sm" onClick={() => handleStatusChange(s.id, 'active')}><PlayCircle className="h-4 w-4 mr-1" />Start</Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="mt-6 space-y-4">
              {completedSprints.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">No completed sprints</p>
              ) : completedSprints.map(s => (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <p className="font-medium">{s.name}</p>
                      </div>
                      <span className="text-xs text-zinc-400">{(s.tasks || []).filter((st: any) => st.task?.status === 'done').length}/{(s.tasks || []).length} tasks</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="velocity" className="mt-6">
              {velocity.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">No velocity data yet</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {velocity.map(v => (
                    <Card key={v.name}>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium mb-2">{v.name}</p>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-zinc-400" />
                          <span className="text-lg font-bold">{v.completed}</span>
                          <span className="text-xs text-zinc-400">/ {v.total} tasks</span>
                        </div>
                        <Progress value={v.total > 0 ? (v.completed / v.total) * 100 : 0} className="h-1 mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>New Sprint</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input label="Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            <Input label="Goal" value={formData.goal} onChange={e => setFormData(p => ({ ...p, goal: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} />
              <Input label="End Date" type="date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
