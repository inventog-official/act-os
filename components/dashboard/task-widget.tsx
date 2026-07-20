'use client'

import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

const tasks = [
  { id: '1', title: 'Design new landing page', status: 'in_progress', priority: 'high', assignee: 'SC' },
  { id: '2', title: 'Review API documentation', status: 'todo', priority: 'medium', assignee: 'MJ' },
  { id: '3', title: 'Fix mobile navigation bug', status: 'in_progress', priority: 'urgent', assignee: 'ED' },
  { id: '4', title: 'Update user avatar component', status: 'done', priority: 'low', assignee: 'AK' },
  { id: '5', title: 'Write unit tests for auth', status: 'todo', priority: 'high', assignee: 'LW' },
  { id: '6', title: 'Deploy staging environment', status: 'todo', priority: 'urgent', assignee: 'JW' },
]

const statusConfig = {
  todo: { icon: Circle, color: 'text-zinc-400' },
  in_progress: { icon: Clock, color: 'text-blue-500' },
  done: { icon: CheckCircle2, color: 'text-emerald-500' },
  cancelled: { icon: AlertCircle, color: 'text-red-500' },
}

const priorityColors = {
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  high: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  urgent: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
}

export function TaskWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>
        <Badge variant="secondary">{tasks.filter(t => t.status !== 'done').length} remaining</Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[260px] pr-4">
          <div className="space-y-3">
            {tasks.map((task) => {
              const config = statusConfig[task.status as keyof typeof statusConfig]
              const Icon = config.icon
              return (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.status === 'done' ? 'line-through text-zinc-400' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {task.assignee}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
