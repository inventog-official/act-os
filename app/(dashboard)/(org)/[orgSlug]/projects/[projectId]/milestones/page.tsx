'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Loader2, Milestone, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function MilestonesPage({ params }: { params: Promise<{ orgSlug: string; projectId: string }> }) {
  const { orgSlug, projectId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [milestones, setMilestones] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', due_date: '' })

  const fetch = useCallback(async () => {
    setIsLoading(true)
    const [mRes, tRes] = await Promise.all([
      supabase.from('milestones').select('*').eq('project_id', projectId).is('deleted_at', null).order('sort_order'),
      supabase.from('tasks').select('*').eq('project_id', projectId).is('deleted_at', null),
    ])
    setMilestones(mRes.data || [])
    setTasks(tRes.data || [])
    setIsLoading(false)
  }, [projectId, supabase])

  useEffect(() => { fetch() }, [fetch])

  const handleCreate = async () => {
    if (!formData.name.trim()) return
    const { error } = await supabase.from('milestones').insert({
      project_id: projectId, name: formData.name, description: formData.description || null,
      due_date: formData.due_date || null, created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Milestone created')
    setShowNew(false)
    setFormData({ name: '', description: '', due_date: '' })
    fetch()
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/${orgSlug}/projects/${projectId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Milestones</h1>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />New Milestone</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-16"><Milestone className="h-8 w-8 text-zinc-300 mx-auto mb-3" /><p className="text-sm text-zinc-400">No milestones yet</p></div>
        ) : (
          <div className="space-y-4">
            {milestones.map(m => {
              const total = tasks.filter(t => t.status !== 'cancelled').length
              const done = tasks.filter(t => t.status === 'done').length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <Card key={m.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{m.name}</h3>
                          <Badge variant={m.status === 'completed' ? 'success' : m.status === 'in_progress' ? 'warning' : 'secondary'} className="text-[9px]">{m.status}</Badge>
                        </div>
                        {m.description && <p className="text-sm text-zinc-500 mt-1">{m.description}</p>}
                      </div>
                      {m.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <Progress value={pct} className="flex-1 h-1.5" />
                      <span>{pct}%</span>
                      {m.due_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(m.due_date)}</span>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>New Milestone</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input label="Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            <div>
              <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea className="w-full min-h-[60px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
            </div>
            <Input label="Due Date" type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} />
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
