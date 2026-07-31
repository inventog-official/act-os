'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, Circle, Clock, CheckCircle2, MoreHorizontal, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { SearchBar } from '@/components/crm/search-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatDate, formatRelativeTime, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import type { CrmTask } from '@/lib/types/database'

const statusConfig: Record<string, { icon: any; color: string }> = {
  pending: { icon: Circle, color: 'text-zinc-400' },
  in_progress: { icon: Clock, color: 'text-blue-500' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500' },
  cancelled: { icon: Circle, color: 'text-red-400' },
}

const priorityConfig: Record<string, { color: string; bg: string }> = {
  urgent: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/50' },
  high: { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/50' },
  medium: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/50' },
  low: { color: 'text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-800' },
}

export default function TasksPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editTask, setEditTask] = useState<CrmTask | null>(null)
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '' })

  const fetchTasks = useCallback(async () => {
    if (!currentOrganization) return
    try {
      let query = supabase
        .from('crm_tasks')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('due_date', { ascending: true })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)

      const { data } = await query
      setTasks((data || []) as CrmTask[])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase, statusFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleCreate = async () => {
    if (!currentOrganization || !formData.title) return
    try {
      const { error } = await supabase.from('crm_tasks').insert({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || null,
        organization_id: currentOrganization.id,
        workspace_id: null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (error) throw error
      toast.success('Task created')
      setShowAddDialog(false)
      setFormData({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '' })
      fetchTasks()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleUpdate = async (id: string, updates: any) => {
    const payload: any = { ...updates, updated_by: (await supabase.auth.getUser()).data.user?.id }
    if (updates.status === 'completed') payload.completed_at = new Date().toISOString()
    const { error } = await supabase.from('crm_tasks').update(payload).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Task updated')
    setEditTask(null)
    fetchTasks()
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('crm_tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Task deleted')
    fetchTasks()
  }

  const handleToggleStatus = async (task: CrmTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await handleUpdate(task.id, { status: newStatus })
  }

  const filtered = tasks.filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
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
              <h1 className="text-2xl font-semibold">CRM Tasks</h1>
              <p className="text-sm text-zinc-500 mt-1">Track task progress and deadlines</p>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />New Task
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-zinc-400">No tasks found</p>
              </div>
            )}
            {filtered.map(task => {
              const StatusIcon = statusConfig[task.status]?.icon || Circle
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <button onClick={() => handleToggleStatus(task)} className="shrink-0">
                    <StatusIcon className={`h-5 w-5 ${statusConfig[task.status]?.color || 'text-zinc-400'}`} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', task.status === 'completed' && 'line-through text-zinc-400')}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {task.priority && (
                      <Badge variant="secondary" className={cn('text-[10px]', priorityConfig[task.priority]?.bg)}>
                        {task.priority}
                      </Badge>
                    )}
                    {task.due_date && (
                      <span className="text-xs text-zinc-400">{formatDate(task.due_date)}</span>
                    )}
                    {task.is_recurring && (
                      <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
                    )}
                    {task.assigned_to && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">{getInitials(task.assigned_to)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTask(task)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(task.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>Create a new CRM task</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input label="Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full min-h-[60px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="Add details..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
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
              <div>
                <label className="text-sm font-medium mb-1 block">Due Date</label>
                <DatePicker value={formData.due_date} onChange={d => setFormData(p => ({ ...p, due_date: d }))} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editTask} onOpenChange={(open) => { if (!open) setEditTask(null) }}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Update task details</DialogDescription>
            </DialogHeader>
            {editTask && (
              <div className="space-y-4">
                <Input label="Title" defaultValue={editTask.title} id="edit-title" onChange={e => setEditTask(p => p ? { ...p, title: e.target.value } : p)} />
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select defaultValue={editTask.status} onValueChange={v => setEditTask(p => p ? { ...p, status: v } : p)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Priority</label>
                  <Select defaultValue={editTask.priority} onValueChange={v => setEditTask(p => p ? { ...p, priority: v } : p)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditTask(null)}>Cancel</Button>
                  <Button onClick={() => handleUpdate(editTask.id, { title: editTask.title, status: editTask.status, priority: editTask.priority })}>Save</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CrmShell>
    </DashboardShell>
  )
}
