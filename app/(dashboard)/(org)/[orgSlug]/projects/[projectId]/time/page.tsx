'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Play, Square, Clock, Loader2, Timer, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function TimeTrackingPage({ params }: { params: Promise<{ orgSlug: string; projectId: string }> }) {
  const { orgSlug, projectId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const [entries, setEntries] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [runningEntry, setRunningEntry] = useState<any>(null)
  const [showManual, setShowManual] = useState(false)
  const [formData, setFormData] = useState({ task_id: '', description: '', duration_minutes: 30 })

  const fetch = useCallback(async () => {
    setIsLoading(true)
    const [eRes, tRes] = await Promise.all([
      supabase.from('time_entries').select('*, task:tasks(title)').eq('task_id', projectId).is('deleted_at', null).order('start_time', { ascending: false }),
      supabase.from('tasks').select('id, title').eq('project_id', projectId).is('deleted_at', null),
    ])
    setEntries(eRes.data || [])
    setTasks(tRes.data || [])
    const running = (eRes.data || []).find((e: any) => e.is_running)
    setRunningEntry(running || null)
    setIsLoading(false)
  }, [projectId, supabase])

  useEffect(() => { fetch() }, [fetch])

  const handleStartTimer = async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const { data, error } = await supabase.from('time_entries').insert({
      task_id: projectId, user_id: user.id, start_time: new Date().toISOString(), is_running: true,
    }).select().single()
    if (error) { toast.error(error.message); return }
    setRunningEntry(data)
    toast.success('Timer started')
  }

  const handleStopTimer = async () => {
    if (!runningEntry) return
    const now = new Date().toISOString()
    const duration = Math.round((Date.now() - new Date(runningEntry.start_time).getTime()) / 60000)
    const { error } = await supabase.from('time_entries').update({
      end_time: now, duration_minutes: duration, is_running: false, updated_at: now,
    }).eq('id', runningEntry.id)
    if (error) { toast.error(error.message); return }
    setRunningEntry(null)
    toast.success(`Logged ${duration} minutes`)
    fetch()
  }

  const totalHours = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/${orgSlug}/projects/${projectId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Time Tracking</h1>
          </div>
          <div className="flex items-center gap-2">
            {runningEntry ? (
              <Button variant="destructive" size="sm" onClick={handleStopTimer}>
                <Square className="h-4 w-4 mr-1" /> Stop Timer
              </Button>
            ) : (
              <Button size="sm" onClick={handleStartTimer}>
                <Play className="h-4 w-4 mr-1" /> Start Timer
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowManual(true)}>
              <Plus className="h-4 w-4 mr-1" /> Manual Entry
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Timer className="h-5 w-5 text-blue-500" />
              <div><p className="text-xs text-zinc-500">Total Hours</p><p className="text-xl font-bold">{totalHours.toFixed(1)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div><p className="text-xs text-zinc-500">Entries</p><p className="text-xl font-bold">{entries.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-emerald-500" />
              <div><p className="text-xs text-zinc-500">Running</p><p className="text-xl font-bold">{runningEntry ? 'Yes' : 'No'}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Time Log</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
            ) : entries.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">No time entries</p>
            ) : (
              <div className="space-y-2">
                {entries.map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{e.task?.title || 'Unknown task'}</span>
                        {e.billable && <Badge variant="secondary" className="text-[9px]">Billable</Badge>}
                      </div>
                      {e.description && <p className="text-xs text-zinc-400 mt-0.5">{e.description}</p>}
                      <p className="text-[10px] text-zinc-400 mt-0.5">{formatDate(e.start_time)}</p>
                    </div>
                    <span className="text-sm font-mono">{e.duration_minutes ? `${Math.floor(e.duration_minutes / 60)}h ${e.duration_minutes % 60}m` : '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Manual Time Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Task</label>
              <select value={formData.task_id} onChange={e => setFormData(p => ({ ...p, task_id: e.target.value }))} className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                <option value="">Select task...</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <Input label="Description" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
            <Input label="Duration (minutes)" type="number" value={formData.duration_minutes} onChange={e => setFormData(p => ({ ...p, duration_minutes: Number(e.target.value) }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManual(false)}>Cancel</Button>
            <Button onClick={async () => {
              const user = (await supabase.auth.getUser()).data.user
              if (!user || !formData.task_id) return
              const { error } = await supabase.from('time_entries').insert({
                task_id: formData.task_id, user_id: user.id, description: formData.description || null,
                start_time: new Date().toISOString(), duration_minutes: formData.duration_minutes, is_running: false,
              })
              if (error) { toast.error(error.message); return }
              toast.success('Time logged')
              setShowManual(false)
              setFormData({ task_id: '', description: '', duration_minutes: 30 })
              fetch()
            }}>Log Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
