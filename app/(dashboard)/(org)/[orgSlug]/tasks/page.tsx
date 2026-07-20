'use client'

import { useState, use } from 'react'
import { Plus, List, Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { formatDate, getInitials } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  assignee: string
  due_date: string
}

const initialTasks: Task[] = [
  { id: '1', title: 'Design new landing page', status: 'in_progress', priority: 'high', assignee: 'SC', due_date: '2024-12-10' },
  { id: '2', title: 'Review API documentation', status: 'todo', priority: 'medium', assignee: 'MJ', due_date: '2024-12-12' },
  { id: '3', title: 'Fix mobile navigation bug', status: 'in_progress', priority: 'urgent', assignee: 'ED', due_date: '2024-12-08' },
  { id: '4', title: 'Update user avatar component', status: 'done', priority: 'low', assignee: 'AK', due_date: '2024-12-05' },
  { id: '5', title: 'Write unit tests for auth', status: 'todo', priority: 'high', assignee: 'LW', due_date: '2024-12-15' },
  { id: '6', title: 'Deploy staging environment', status: 'todo', priority: 'urgent', assignee: 'JW', due_date: '2024-12-09' },
  { id: '7', title: 'Update dependencies', status: 'backlog', priority: 'low', assignee: 'SC', due_date: '2024-12-20' },
]

const priorityColors: Record<string, string> = {
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  high: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  urgent: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
}

const statusColors: Record<string, string> = {
  backlog: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800',
  todo: 'bg-blue-100 text-blue-600 dark:bg-blue-950',
  in_progress: 'bg-amber-100 text-amber-600 dark:bg-amber-950',
  in_review: 'bg-purple-100 text-purple-600 dark:bg-purple-950',
  done: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-950',
}

export default function TasksPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const [tasks, setTasks] = useState(initialTasks)
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [showNew, setShowNew] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', status: 'todo' })

  const columns: ColumnDef<Task>[] = [
    { accessorKey: 'title', header: 'Task', cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.original.status]}>
          {row.original.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant="outline" className={priorityColors[row.original.priority]}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      cell: ({ row }) => (
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs">{row.original.assignee}</AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => <span className="text-sm text-zinc-500">{formatDate(row.original.due_date)}</span>,
    },
  ]

  const handleCreate = () => {
    if (!newTask.title.trim()) return
    setTasks(prev => [{
      id: crypto.randomUUID(),
      title: newTask.title,
      status: newTask.status,
      priority: newTask.priority,
      assignee: 'You',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }, ...prev])
    setShowNew(false)
    setNewTask({ title: '', priority: 'medium', status: 'todo' })
    toast.success('Task created')
  }

  const statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done']

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tasks</h1>
            <p className="text-sm text-zinc-500">{tasks.length} total tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
              <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('table')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('kanban')}>
                <Columns3 className="h-4 w-4" />
              </Button>
            </div>
            <Dialog open={showNew} onOpenChange={setShowNew}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input label="Title" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="What needs to be done?" />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
                    <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
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
                  <Button onClick={handleCreate}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {view === 'table' ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <DataTable columns={columns} data={tasks} searchKey="title" />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {statuses.map(status => (
              <div key={status} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="text-sm font-medium capitalize mb-3 px-1">{status.replace('_', ' ')}</h3>
                <div className="space-y-2">
                  {tasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="text-sm font-medium mb-2">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </Badge>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">{task.assignee}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
