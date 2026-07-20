'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Loader2, MoreHorizontal, Calendar, AlignLeft, Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { TaskDetailDialog } from '@/components/projects/task-detail-dialog'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

const columns = [
  { id: 'backlog', label: 'Backlog', color: 'bg-zinc-400' },
  { id: 'todo', label: 'To Do', color: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
  { id: 'in_review', label: 'In Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500' },
]

export default function ProjectTaskBoardPage({ params }: { params: Promise<{ orgSlug: string; projectId: string }> }) {
  const { orgSlug, projectId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', assignee_id: '' })
  const [selectedTask, setSelectedTask] = useState<any>(null)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    const [pRes, tRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tasks').select('*').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }),
    ])
    setProject(pRes.data)
    setTasks(tRes.data || [])
    setIsLoading(false)
  }, [projectId, currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    if (!formData.title.trim() || !currentOrganization) return
    setSaving(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      const { error } = await supabase.from('tasks').insert({
        title: formData.title,
        description: formData.description || null,
        status: 'todo',
        priority: formData.priority,
        project_id: projectId,
        organization_id: currentOrganization.id,
        created_by: user?.id,
        assignee_id: formData.assignee_id || null,
      })
      if (error) throw error
      toast.success('Task created')
      setShowNew(false)
      setFormData({ title: '', description: '', priority: 'medium', assignee_id: '' })
      fetchData()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    const { error } = await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId)
    if (error) { toast.error(error.message); fetchData() }
  }

  if (isLoading) return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
    </DashboardShell>
  )

  if (!project) return null

  const groupedTasks = Object.fromEntries(columns.map(c => [c.id, tasks.filter(t => t.status === c.id)]))

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/${orgSlug}/projects/${projectId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{project.name} Tasks</h1>
              <p className="text-sm text-zinc-500">{tasks.length} tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5">
              <button onClick={() => setViewMode('board')} className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'board' ? 'bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-600'}`}>
                <Columns3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-600'}`}>
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-1" />Add Task
            </Button>
          </div>
        </div>

        {viewMode === 'board' ? (
          <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
            {columns.map(col => (
              <div key={col.id} className="min-w-[220px]">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2 w-2 rounded-full ${col.color}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{col.label}</span>
                  <span className="text-xs text-zinc-400 ml-auto">{groupedTasks[col.id]?.length || 0}</span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {(groupedTasks[col.id] || []).map(task => (
                    <div key={task.id} onClick={() => setSelectedTask(task)} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium">{task.title}</p>
                        <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'secondary'} className="text-[9px] ml-2">{task.priority}</Badge>
                      </div>
                      {task.description && <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{task.description}</p>}
                      <div className="flex items-center justify-between">
                        {task.due_date && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />{formatDate(task.due_date)}
                          </span>
                        )}
                        <div className="flex -space-x-1">
                          {task.assignee_id && (
                            <div className="h-5 w-5 rounded-full bg-zinc-200 flex items-center justify-center text-[8px] font-medium ring-2 ring-white dark:ring-zinc-950">
                              {getInitials(task.assignee_id)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {col.id !== 'backlog' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, columns[columns.indexOf(col) - 1].id) }} className="text-[10px] text-zinc-400 hover:text-zinc-600 px-1 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">←</button>
                        )}
                        {col.id !== 'done' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, columns[columns.indexOf(col) + 1].id) }} className="text-[10px] text-zinc-400 hover:text-zinc-600 px-1 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">→</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">No tasks</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} onClick={() => setSelectedTask(task)} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-amber-500' : 'bg-zinc-300'}`} />
                  <span className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-zinc-400' : ''}`}>{task.title}</span>
                  <Badge variant="secondary" className="text-[9px]">{task.status.replace('_', ' ')}</Badge>
                  <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'secondary'} className="text-[9px]">{task.priority}</Badge>
                  {task.due_date && <span className="text-xs text-zinc-400">{formatDate(task.due_date)}</span>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Add a task to {project.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input label="Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
            <div>
              <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea className="w-full min-h-[60px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Add details..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Priority</label>
              <Select value={formData.priority} onValueChange={v => setFormData(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.title.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null) }}
        onUpdate={fetchData}
      />
    </DashboardShell>
  )
}
