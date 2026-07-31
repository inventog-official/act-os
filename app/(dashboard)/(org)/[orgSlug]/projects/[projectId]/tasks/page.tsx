'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Loader2, MoreHorizontal, Calendar, AlignLeft, Columns3 } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

function SortableTaskCard({ task, columns, onStatusChange, onClick }: { task: any; columns: { id: string; label: string; color: string }[]; onStatusChange: (id: string, status: string) => void; onClick: (task: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const colIndex = columns.findIndex(c => c.id === task.status)

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onClick(task)} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
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
        {colIndex > 0 && (
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, columns[colIndex - 1].id) }} className="text-[10px] text-zinc-400 hover:text-zinc-600 px-1 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">←</button>
        )}
        {colIndex < columns.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, columns[colIndex + 1].id) }} className="text-[10px] text-zinc-400 hover:text-zinc-600 px-1 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">→</button>
        )}
      </div>
    </div>
  )
}

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
  const [activeTask, setActiveTask] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [labelFilter, setLabelFilter] = useState('all')
  const [sprintFilter, setSprintFilter] = useState('all')
  const [milestoneFilter, setMilestoneFilter] = useState('all')
  const [members, setMembers] = useState<any[]>([])
  const [labels, setLabels] = useState<any[]>([])
  const [sprints, setSprints] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    const [pRes, tRes, mRes, lRes, spRes, miRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tasks').select('*').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('project_team_members').select('profile:profiles(id, full_name, avatar_url)').eq('project_id', projectId),
      supabase.from('task_labels').select('*').eq('project_id', projectId),
      supabase.from('sprints').select('id, name').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('milestones').select('id, name').eq('project_id', projectId).order('created_at', { ascending: false }),
    ])
    setProject(pRes.data)
    setTasks(tRes.data || [])
    setMembers((mRes.data || []).map((m: any) => m.profile).filter(Boolean))
    setLabels(lRes.data || [])
    setSprints(spRes.data || [])
    setMilestones(miRes.data || [])
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

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (assigneeFilter !== 'all' && t.assignee_id !== assigneeFilter) return false
    if (sprintFilter !== 'all' && t.sprint_id !== sprintFilter) return false
    if (milestoneFilter !== 'all' && t.milestone_id !== milestoneFilter) return false
    if (labelFilter !== 'all' && (!t.labels || !t.labels.includes(labelFilter))) return false
    return true
  })
  const groupedTasks = Object.fromEntries(columns.map(c => [c.id, filteredTasks.filter(t => t.status === c.id)]))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const targetCol = over.id as string

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === targetCol) return

    handleStatusChange(taskId, targetCol)
  }

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
        <div className="flex items-center gap-2 flex-wrap">
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

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {members.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.full_name || m.id.slice(0, 8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sprintFilter} onValueChange={setSprintFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Sprint" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sprints</SelectItem>
              {sprints.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={milestoneFilter} onValueChange={setMilestoneFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Milestone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Milestones</SelectItem>
              {milestones.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={labelFilter} onValueChange={setLabelFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Label" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Labels</SelectItem>
              {labels.map(l => (
                <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {viewMode === 'board' ? (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
              {columns.map(col => (
                <div key={col.id} className="min-w-[220px]">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`h-2 w-2 rounded-full ${col.color}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{col.label}</span>
                    <span className="text-xs text-zinc-400 ml-auto">{groupedTasks[col.id]?.length || 0}</span>
                  </div>
                  <SortableContext items={groupedTasks[col.id]?.map(t => t.id) || []} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 min-h-[200px]">
                      {(groupedTasks[col.id] || []).map(task => (
                        <SortableTaskCard key={task.id} task={task} columns={columns} onStatusChange={handleStatusChange} onClick={setSelectedTask} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              ))}
            </div>
            <DragOverlay>
              {activeTask ? (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{activeTask.title}</p>
                    <Badge variant={activeTask.priority === 'urgent' ? 'destructive' : activeTask.priority === 'high' ? 'warning' : 'secondary'} className="text-[9px] ml-2">{activeTask.priority}</Badge>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="space-y-1">
            {tasks.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">No tasks</p>
            ) : (
              filteredTasks.map(task => (
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
