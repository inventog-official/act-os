'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, MoreHorizontal, Edit3, Trash2, Save, X, Check,
  Plus, Send, Clock, Timer, ListChecks, MessageSquare,
  Tags, Link2, Activity, FileText, FolderKanban,
  Play, StopCircle, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, formatRelativeTime, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import {
  getTaskById, updateTask, deleteTask,
  getTaskChecklist, addChecklistItem, toggleChecklistItem, deleteChecklistItem,
  getTaskComments, createComment, deleteComment,
  getTimeEntries, startTimer, stopTimer, createManualTimeEntry,
  getProjectLabels, toggleTaskLabel,
} from '@/lib/actions/projects'
import type { TaskChecklistItem, TaskAttachment } from '@/lib/types/database'

const statusConfig: Record<string, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-zinc-400' },
  todo: { label: 'To Do', color: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500' },
  in_review: { label: 'In Review', color: 'bg-purple-500' },
  done: { label: 'Done', color: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
}

const priorityConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'secondary' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'destructive' },
}

const depTypeConfig: Record<string, { label: string; color: string }> = {
  blocks: { label: 'Blocks', color: 'text-red-500' },
  depends_on: { label: 'Depends on', color: 'text-amber-500' },
  related: { label: 'Related', color: 'text-blue-500' },
}

export default function TaskDetailPage({ params }: { params: Promise<{ orgSlug: string; projectId: string; taskId: string }> }) {
  const { orgSlug, projectId, taskId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()

  const [task, setTask] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState('')

  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([])
  const [newCheckItem, setNewCheckItem] = useState('')

  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')

  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [runningEntry, setRunningEntry] = useState<any>(null)
  const [showManualTime, setShowManualTime] = useState(false)
  const [manualTime, setManualTime] = useState({ description: '', duration_minutes: 0 })

  const [projectLabels, setProjectLabels] = useState<any[]>([])
  const [taskLabelIds, setTaskLabelIds] = useState<string[]>([])

  const [subtasks, setSubtasks] = useState<any[]>([])
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const [dependencies, setDependencies] = useState<any[]>([])
  const [showAddDep, setShowAddDep] = useState(false)
  const [newDepTaskId, setNewDepTaskId] = useState('')
  const [newDepType, setNewDepType] = useState<'blocks' | 'depends_on' | 'related'>('depends_on')

  const [activities, setActivities] = useState<any[]>([])
  const [projectTasks, setProjectTasks] = useState<any[]>([])

  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      const taskData = await getTaskById(taskId)
      if (!taskData) { setTask(null); setIsLoading(false); return }
      setTask(taskData)
      setTitleDraft(taskData.title)
      setDescDraft(taskData.description || '')

      const { data: proj } = await supabase.from('projects').select('id, name, slug').eq('id', projectId).single()
      setProject(proj)

      const [chkRes, cmtRes, teRes, lblRes, subRes, depRes, actRes, ptRes] = await Promise.all([
        getTaskChecklist(taskId).catch(() => [] as TaskChecklistItem[]),
        getTaskComments(taskId).catch(() => []),
        getTimeEntries(taskId).catch(() => []),
        getProjectLabels(projectId).catch(() => []),
        supabase.from('task_subtasks').select('*, child:child_task_id(id, title, status, priority)').eq('parent_task_id', taskId),
        supabase.from('task_dependencies').select('*, depends_on:depends_on_task_id(id, title, status)').eq('task_id', taskId),
        supabase.from('project_activities').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(50),
        supabase.from('tasks').select('id, title, status').eq('project_id', projectId).is('deleted_at', null).neq('id', taskId),
      ])

      setChecklist(chkRes as TaskChecklistItem[])
      setComments(cmtRes as any[])
      setTimeEntries(teRes as any[])
      setRunningEntry((teRes as any[]).find((e: any) => e.is_running) || null)
      setProjectLabels(lblRes as any[])

      const { data: labelAssignments } = await supabase.from('task_label_assignments').select('label_id').eq('task_id', taskId)
      setTaskLabelIds((labelAssignments || []).map((a: any) => a.label_id))

      setSubtasks((subRes.data || []).map((s: any) => s.child).filter(Boolean))
      setDependencies(depRes.data || [])
      setActivities(actRes.data || [])
      setProjectTasks(ptRes.data || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load task')
      setTask(null)
    } finally {
      setIsLoading(false)
    }
  }, [taskId, projectId, currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const saveTitle = async () => {
    if (!titleDraft.trim() || titleDraft === task.title) { setEditingTitle(false); return }
    try {
      const updated = await updateTask(taskId, { title: titleDraft })
      setTask((prev: any) => ({ ...prev, title: updated.title }))
      toast.success('Title updated')
    } catch (err: any) { toast.error(err.message) }
    setEditingTitle(false)
  }

  const saveDescription = async () => {
    const newDesc = descDraft || null
    if (newDesc === task.description) { setEditingDesc(false); return }
    try {
      await updateTask(taskId, { description: newDesc })
      setTask((prev: any) => ({ ...prev, description: newDesc }))
      toast.success('Description updated')
    } catch (err: any) { toast.error(err.message) }
    setEditingDesc(false)
  }

  const handleStatusChange = async (status: string) => {
    try {
      const updated = await updateTask(taskId, { status } as any)
      setTask((prev: any) => ({ ...prev, status: updated.status, completed_at: updated.completed_at }))
      toast.success('Status updated')
    } catch (err: any) { toast.error(err.message) }
  }

  const handlePriorityChange = async (priority: string) => {
    try {
      await updateTask(taskId, { priority } as any)
      setTask((prev: any) => ({ ...prev, priority }))
      toast.success('Priority updated')
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDelete = async () => {
    try {
      await deleteTask(taskId)
      toast.success('Task deleted')
      router.push(`/${orgSlug}/projects/${projectId}/tasks`)
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDateChange = async (field: string, value: string | null) => {
    try {
      await updateTask(taskId, { [field]: value } as any)
      setTask((prev: any) => ({ ...prev, [field]: value }))
      toast.success(`${field === 'due_date' ? 'Due date' : 'Start date'} updated`)
    } catch (err: any) { toast.error(err.message) }
  }

  const handleEstHoursChange = async (val: number | null) => {
    try {
      await updateTask(taskId, { estimated_hours: val } as any)
      setTask((prev: any) => ({ ...prev, estimated_hours: val }))
    } catch (err: any) { toast.error(err.message) }
  }

  const addChecklist = async () => {
    if (!newCheckItem.trim()) return
    try {
      const item = await addChecklistItem({ task_id: taskId, text: newCheckItem, sort_order: checklist.length })
      setChecklist(prev => [...prev, item])
      setNewCheckItem('')
    } catch (err: any) { toast.error(err.message) }
  }

  const toggleCheck = async (item: TaskChecklistItem) => {
    try {
      const updated = await toggleChecklistItem(item.id, !item.completed)
      setChecklist(prev => prev.map(c => c.id === item.id ? updated : c))
    } catch (err: any) { toast.error(err.message) }
  }

  const removeChecklist = async (id: string) => {
    try {
      await deleteChecklistItem(id)
      setChecklist(prev => prev.filter(c => c.id !== id))
    } catch (err: any) { toast.error(err.message) }
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    try {
      const mentions = Array.from(newComment.matchAll(/@(\w+)/g)).map(m => m[1])
      const comment = await createComment({ task_id: taskId, content: newComment, mentions: mentions.length ? mentions : undefined })
      setComments((prev: any[]) => [...prev, comment])
      setNewComment('')
    } catch (err: any) { toast.error(err.message) }
  }

  const removeComment = async (id: string) => {
    try {
      await deleteComment(id)
      setComments((prev: any[]) => prev.filter(c => c.id !== id))
    } catch (err: any) { toast.error(err.message) }
  }

  const handleStartTimer = async () => {
    try {
      const entry = await startTimer(taskId)
      setRunningEntry(entry)
      setTimeEntries((prev: any[]) => [entry, ...prev])
      toast.success('Timer started')
    } catch (err: any) { toast.error(err.message) }
  }

  const handleStopTimer = async () => {
    if (!runningEntry) return
    try {
      const entry = await stopTimer(runningEntry.id)
      setRunningEntry(null)
      setTimeEntries((prev: any[]) => prev.map(e => e.id === runningEntry.id ? entry : e))
      toast.success('Timer stopped')
    } catch (err: any) { toast.error(err.message) }
  }

  const handleManualTime = async () => {
    try {
      await createManualTimeEntry({
        task_id: taskId,
        description: manualTime.description || null,
        start_time: new Date().toISOString(),
        duration_minutes: manualTime.duration_minutes || 0,
      })
      setShowManualTime(false)
      setManualTime({ description: '', duration_minutes: 0 })
      const entries = await getTimeEntries(taskId)
      setTimeEntries(entries)
      toast.success('Time entry added')
    } catch (err: any) { toast.error(err.message) }
  }

  const handleToggleLabel = async (labelId: string) => {
    try {
      const result = await toggleTaskLabel(taskId, labelId)
      if (result.attached) {
        setTaskLabelIds(prev => [...prev, labelId])
      } else {
        setTaskLabelIds(prev => prev.filter(id => id !== labelId))
      }
    } catch (err: any) { toast.error(err.message) }
  }

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    try {
      const user = (await supabase.auth.getUser()).data.user
      const { data: childTask, error } = await supabase.from('tasks').insert({
        title: newSubtaskTitle,
        project_id: projectId,
        organization_id: currentOrganization!.id,
        created_by: user?.id,
        status: 'todo',
        priority: 'medium',
      }).select().single()
      if (error) throw error

      const { error: linkErr } = await supabase.from('task_subtasks').insert({
        parent_task_id: taskId,
        child_task_id: childTask.id,
      })
      if (linkErr) throw linkErr

      setSubtasks((prev: any[]) => [...prev, childTask])
      setNewSubtaskTitle('')
      setShowAddSubtask(false)
      toast.success('Subtask added')
    } catch (err: any) { toast.error(err.message) }
  }

  const toggleSubtaskStatus = async (subtask: any) => {
    const newStatus = subtask.status === 'done' ? 'todo' : 'done'
    try {
      const { data } = await supabase.from('tasks').update({
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', subtask.id).select().single()
      if (data) setSubtasks((prev: any[]) => prev.map(s => s.id === subtask.id ? data : s))
    } catch (err: any) { toast.error(err.message) }
  }

  const addDependency = async () => {
    if (!newDepTaskId) return
    try {
      const { data: existing } = await supabase.from('task_dependencies').select('id').eq('task_id', taskId).eq('depends_on_task_id', newDepTaskId).single()
      if (existing) { toast.error('Dependency already exists'); return }

      const { data: reverse } = await supabase.from('task_dependencies').select('id').eq('task_id', newDepTaskId).eq('depends_on_task_id', taskId).single()
      if (reverse) { toast.error('Circular dependency detected'); return }

      const { data: dep, error } = await supabase.from('task_dependencies').insert({
        task_id: taskId,
        depends_on_task_id: newDepTaskId,
        type: newDepType,
      }).select('*, depends_on:depends_on_task_id(id, title, status)').single()
      if (error) throw error
      setDependencies((prev: any[]) => [...prev, dep])
      setShowAddDep(false)
      setNewDepTaskId('')
      toast.success('Dependency added')
    } catch (err: any) { toast.error(err.message) }
  }

  const removeDependency = async (id: string) => {
    try {
      await supabase.from('task_dependencies').delete().eq('id', id)
      setDependencies((prev: any[]) => prev.filter(d => d.id !== id))
    } catch (err: any) { toast.error(err.message) }
  }

  const checkedCount = checklist.filter(c => c.completed).length
  const checkProgress = checklist.length > 0 ? Math.round((checkedCount / checklist.length) * 100) : 0
  const subtaskProgress = subtasks.length > 0 ? Math.round((subtasks.filter(s => s.status === 'done').length / subtasks.length) * 100) : 0
  const totalHours = timeEntries.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0) / 60

  if (isLoading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </DashboardShell>
    )
  }

  if (!task) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <div className="text-center py-16">
          <p className="text-zinc-500">Task not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </DashboardShell>
    )
  }

  const statusCfg = statusConfig[task.status] || statusConfig.todo
  const priorityCfg = priorityConfig[task.priority] || priorityConfig.medium

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0 mt-1" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={titleDraft}
                      onChange={e => setTitleDraft(e.target.value)}
                      className="text-xl font-semibold h-10 w-[300px]"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(task.title) } }}
                    />
                    <Button variant="ghost" size="icon-sm" onClick={saveTitle}><Save className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditingTitle(false); setTitleDraft(task.title) }}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-semibold cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" onClick={() => setEditingTitle(true)}>
                      {task.title}
                    </h1>
                    <Badge className={`text-[10px] ${statusCfg.color} text-white`}>{statusCfg.label}</Badge>
                    <Badge variant={priorityCfg.variant} className="text-[10px]">{priorityCfg.label}</Badge>
                  </>
                )}
              </div>
              {project && (
                <Link href={`/${orgSlug}/projects/${projectId}`} className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5" />
                  {project.name}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingTitle(true)}><Edit3 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500" onClick={() => setShowDeleteAlert(true)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6 min-w-0">
            <Tabs defaultValue="details">
              <TabsList className="overflow-x-auto">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="subtasks">Subtasks{subtasks.length > 0 && ` (${subtasks.length})`}</TabsTrigger>
                <TabsTrigger value="checklist">Checklist{checklist.length > 0 && ` (${checkedCount}/${checklist.length})`}</TabsTrigger>
                <TabsTrigger value="dependencies">Deps{dependencies.length > 0 && ` (${dependencies.length})`}</TabsTrigger>
                <TabsTrigger value="comments">Comments{comments.length > 0 && ` (${comments.length})`}</TabsTrigger>
                <TabsTrigger value="time">Time Log</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-6">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase text-zinc-400">Description</p>
                        {!editingDesc && <Button variant="ghost" size="icon-sm" onClick={() => setEditingDesc(true)}><Edit3 className="h-3 w-3" /></Button>}
                      </div>
                      {editingDesc ? (
                        <div className="space-y-2">
                          <textarea
                            value={descDraft}
                            onChange={e => setDescDraft(e.target.value)}
                            className="w-full min-h-[100px] rounded-lg border border-zinc-200 bg-transparent p-3 text-sm dark:border-zinc-700 resize-y"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveDescription}><Save className="h-3 w-3 mr-1" />Save</Button>
                            <Button variant="outline" size="sm" onClick={() => { setEditingDesc(false); setDescDraft(task.description || '') }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{task.description || 'No description'}</p>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">Assignee</p>
                        <div className="flex items-center gap-2">
                          {task.assignee ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[9px]">{getInitials(task.assignee.user_metadata?.name || task.assignee.email || '')}</AvatarFallback>
                              </Avatar>
                              <span className="truncate">{task.assignee.user_metadata?.name || task.assignee.email}</span>
                            </>
                          ) : (
                            <span className="text-zinc-400">Unassigned</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">Due Date</p>
                        <DatePicker value={task.due_date || undefined} onChange={v => handleDateChange('due_date', v || null)} placeholder="Set due date" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">Start Date</p>
                        <DatePicker value={task.start_date || undefined} onChange={v => handleDateChange('start_date', v || null)} placeholder="Set start date" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">Estimated Hours</p>
                        <input
                          type="number"
                          value={task.estimated_hours ?? ''}
                          onChange={e => handleEstHoursChange(e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full h-9 rounded-lg border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-700"
                          placeholder="0"
                          min={0}
                          step={0.5}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">Actual Hours</p>
                        <p className="font-medium">{task.actual_hours != null ? `${task.actual_hours}h` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">Priority</p>
                        <Select value={task.priority} onValueChange={handlePriorityChange}>
                          <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-semibold uppercase text-zinc-400 mb-2 flex items-center gap-1"><Tags className="h-3 w-3" /> Labels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {projectLabels.map(lbl => (
                          <button
                            key={lbl.id}
                            onClick={() => handleToggleLabel(lbl.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              taskLabelIds.includes(lbl.id) ? 'text-white' : 'text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                            }`}
                            style={taskLabelIds.includes(lbl.id) ? { backgroundColor: lbl.color } : {}}
                          >
                            {lbl.name}
                          </button>
                        ))}
                        {projectLabels.length === 0 && <p className="text-xs text-zinc-400">No labels available</p>}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-semibold uppercase text-zinc-400 mb-2 flex items-center gap-1"><FileText className="h-3 w-3" /> Attachments</p>
                      {task.attachments && task.attachments.length > 0 ? (
                        <div className="space-y-1">
                          {task.attachments.map((att: TaskAttachment) => (
                            <div key={att.id} className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-zinc-400" />
                              <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{att.name}</a>
                              {att.size != null && <span className="text-xs text-zinc-400">({Math.round(att.size / 1024)} KB)</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400">No attachments</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subtasks" className="mt-4 space-y-4">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase text-zinc-400">Subtasks</p>
                        {subtasks.length > 0 && <span className="text-xs text-zinc-400">{subtasks.filter(s => s.status === 'done').length}/{subtasks.length}</span>}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowAddSubtask(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
                    </div>

                    {subtaskProgress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-400"><span>Progress</span><span>{subtaskProgress}%</span></div>
                        <Progress value={subtaskProgress} className="h-1.5" />
                      </div>
                    )}

                    {subtasks.length > 0 ? (
                      <div className="space-y-1">
                        {subtasks.map(sub => (
                          <div key={sub.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2.5 group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <button
                              onClick={() => toggleSubtaskStatus(sub)}
                              className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                sub.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'
                              }`}
                            >
                              {sub.status === 'done' && <Check className="h-3 w-3" />}
                            </button>
                            <span className={`text-sm flex-1 ${sub.status === 'done' ? 'line-through text-zinc-400' : ''}`}>{sub.title}</span>
                            <Badge variant="secondary" className="text-[9px]">{sub.status?.replace('_', ' ')}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={ListChecks} title="No subtasks" description="Break down this task into smaller subtasks" />
                    )}
                  </CardContent>
                </Card>

                <Dialog open={showAddSubtask} onOpenChange={setShowAddSubtask}>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Add Subtask</DialogTitle>
                      <DialogDescription>Create a subtask under this task</DialogDescription>
                    </DialogHeader>
                    <Input value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} placeholder="Subtask title" onKeyDown={e => e.key === 'Enter' && addSubtask()} autoFocus />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddSubtask(false)}>Cancel</Button>
                      <Button onClick={addSubtask} disabled={!newSubtaskTitle.trim()}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="checklist" className="mt-4 space-y-4">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase text-zinc-400 flex items-center gap-1"><ListChecks className="h-3 w-3" /> Checklist</p>
                        {checklist.length > 0 && <span className="text-xs text-zinc-400">{checkedCount}/{checklist.length}</span>}
                      </div>
                      {checklist.length > 0 && (
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-xs text-zinc-400"><span>Progress</span><span>{checkProgress}%</span></div>
                          <Progress value={checkProgress} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {checklist.map(item => (
                        <div key={item.id} className="flex items-center gap-2 group">
                          <button
                            onClick={() => toggleCheck(item)}
                            className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'
                            }`}
                          >
                            {item.completed && <Check className="h-3 w-3" />}
                          </button>
                          <span className={`text-sm flex-1 ${item.completed ? 'line-through text-zinc-400' : ''}`}>{item.text}</span>
                          <button onClick={() => removeChecklist(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} placeholder="Add checklist item..." onKeyDown={e => e.key === 'Enter' && addChecklist()} />
                      <Button variant="outline" size="icon" onClick={addChecklist}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dependencies" className="mt-4 space-y-4">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase text-zinc-400">Dependencies</p>
                      <Button size="sm" variant="outline" onClick={() => setShowAddDep(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
                    </div>

                    {dependencies.length > 0 ? (
                      <div className="space-y-2">
                        {dependencies.map(dep => {
                          const cfg = depTypeConfig[dep.type] || depTypeConfig.related
                          return (
                            <div key={dep.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                              <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.color.replace('text-', 'bg-')}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{dep.depends_on?.title || 'Unknown task'}</p>
                                <p className={`text-xs ${cfg.color}`}>{cfg.label}</p>
                              </div>
                              <button onClick={() => removeDependency(dep.id)} className="text-zinc-400 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <EmptyState icon={Link2} title="No dependencies" description="Add dependencies to link related tasks" />
                    )}
                  </CardContent>
                </Card>

                <Dialog open={showAddDep} onOpenChange={setShowAddDep}>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Add Dependency</DialogTitle>
                      <DialogDescription>Link this task to another task in the project</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Type</label>
                        <Select value={newDepType} onValueChange={(v: any) => setNewDepType(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="depends_on">Depends on</SelectItem>
                            <SelectItem value="blocks">Blocks</SelectItem>
                            <SelectItem value="related">Related</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Task</label>
                        <Select value={newDepTaskId} onValueChange={setNewDepTaskId}>
                          <SelectTrigger><SelectValue placeholder="Select a task..." /></SelectTrigger>
                          <SelectContent>
                            {projectTasks.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.title} ({statusConfig[t.status]?.label || t.status})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDep(false)}>Cancel</Button>
                      <Button onClick={addDependency} disabled={!newDepTaskId}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="comments" className="mt-4 space-y-4">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <p className="text-xs font-semibold uppercase text-zinc-400 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comments ({comments.length})</p>

                    <div className="space-y-4">
                      {comments.length > 0 ? (
                        comments.map((comment: any) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-[10px]">{getInitials(comment.user?.user_metadata?.name || comment.user?.email || '')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{comment.user?.user_metadata?.name || comment.user?.email || 'Unknown'}</span>
                                <span className="text-xs text-zinc-400">{formatRelativeTime(comment.created_at)}</span>
                                {comment.created_at !== comment.updated_at && <span className="text-[10px] text-zinc-400">(edited)</span>}
                              </div>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                              <button onClick={() => removeComment(comment.id)} className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors mt-1">Delete</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState icon={MessageSquare} title="No comments" description="Start the discussion" />
                      )}
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Write a comment... Use @ to mention someone"
                        className="flex-1 min-h-[40px] rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm resize-none dark:border-zinc-700"
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addComment() } }}
                      />
                      <Button variant="secondary" size="icon" onClick={addComment} className="shrink-0 self-end"><Send className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="time" className="mt-4 space-y-4">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase text-zinc-400">Time Log</p>
                        {totalHours > 0 && <Badge variant="secondary" className="text-[10px]">{totalHours.toFixed(1)}h total</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {runningEntry ? (
                          <Button size="sm" variant="destructive" onClick={handleStopTimer}><StopCircle className="h-4 w-4 mr-1" />Stop</Button>
                        ) : (
                          <Button size="sm" onClick={handleStartTimer}><Play className="h-4 w-4 mr-1" />Start</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setShowManualTime(true)}><Clock className="h-4 w-4 mr-1" />Manual</Button>
                      </div>
                    </div>

                    {runningEntry && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-2">
                        <Timer className="h-4 w-4 text-amber-500 animate-pulse" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Timer running</span>
                        <span className="text-xs text-amber-500">Started {formatRelativeTime(runningEntry.start_time)}</span>
                      </div>
                    )}

                    {timeEntries.filter((e: any) => !e.is_running).length > 0 ? (
                      <div className="space-y-2">
                        {timeEntries.filter((e: any) => !e.is_running).map((entry: any) => {
                          const hours = entry.duration_minutes != null ? (entry.duration_minutes / 60).toFixed(1) : null
                          return (
                            <div key={entry.id} className="flex items-center gap-3 text-sm py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                              <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">{entry.description || 'No description'}</p>
                                <p className="text-xs text-zinc-400">{formatDate(entry.start_time)}</p>
                              </div>
                              <span className="text-sm font-medium shrink-0">{hours ? `${hours}h` : '—'}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <EmptyState icon={Clock} title="No time entries" description="Start a timer or add a manual entry" />
                    )}
                  </CardContent>
                </Card>

                <Dialog open={showManualTime} onOpenChange={setShowManualTime}>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Manual Time Entry</DialogTitle>
                      <DialogDescription>Add time manually for work already completed</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        label="Description"
                        value={manualTime.description}
                        onChange={e => setManualTime(p => ({ ...p, description: e.target.value }))}
                        placeholder="What did you work on?"
                      />
                      <Input
                        label="Duration (minutes)"
                        type="number"
                        value={manualTime.duration_minutes || ''}
                        onChange={e => setManualTime(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))}
                        placeholder="30"
                        min={1}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowManualTime(false)}>Cancel</Button>
                      <Button onClick={handleManualTime} disabled={!manualTime.duration_minutes}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="activity" className="mt-4 space-y-4">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold uppercase text-zinc-400 mb-4 flex items-center gap-1"><Activity className="h-3 w-3" /> Activity</p>
                    {activities.length > 0 ? (
                      <div className="space-y-0">
                        {activities.map((activity: any, idx: number) => (
                          <div key={activity.id} className="flex gap-3 pb-4 relative">
                            {idx < activities.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />}
                            <div className={`h-3.5 w-3.5 rounded-full border-2 mt-0.5 shrink-0 z-10 ${
                              idx === 0 ? 'bg-blue-500 border-blue-200 dark:border-blue-800' : 'bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">{activity.description || activity.action}</p>
                              <p className="text-xs text-zinc-400 mt-0.5">{formatRelativeTime(activity.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Activity} title="No activity yet" description="Changes to this task will appear here" />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium">Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <Badge className={`text-[9px] ${statusCfg.color} text-white`}>{statusCfg.label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Priority</span>
                  <Badge variant={priorityCfg.variant} className="text-[9px]">{priorityCfg.label}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Assignee</span>
                  <div className="flex items-center gap-1.5">
                    {task.assignee ? (
                      <>
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[7px]">{getInitials(task.assignee.user_metadata?.name || task.assignee.email || '')}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs max-w-[120px] truncate">{task.assignee.user_metadata?.name || task.assignee.email}</span>
                      </>
                    ) : (
                      <span className="text-zinc-400 text-xs">Unassigned</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reporter</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{task.created_by ? 'Assigned' : '—'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-zinc-500">Created</span>
                  <span className="text-xs">{formatDate(task.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Updated</span>
                  <span className="text-xs">{formatRelativeTime(task.updated_at)}</span>
                </div>
                {task.due_date && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Due Date</span>
                    <span className="text-xs">{formatDate(task.due_date)}</span>
                  </div>
                )}
                {project && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Project</span>
                      <Link href={`/${orgSlug}/projects/${projectId}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        {project.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete &ldquo;{task.title}&rdquo;? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
