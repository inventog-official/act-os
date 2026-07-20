'use client'

import { Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const notifications = [
  { id: '1', title: 'New member joined', message: 'Sarah Chen joined the Design team', type: 'info', time: new Date(Date.now() - 1000 * 60 * 10), read: false },
  { id: '2', title: 'Task completed', message: 'Homepage wireframe has been approved', type: 'success', time: new Date(Date.now() - 1000 * 60 * 30), read: false },
  { id: '3', title: 'Deadline approaching', message: 'Q4 budget report due in 2 days', type: 'warning', time: new Date(Date.now() - 1000 * 60 * 60 * 2), read: true },
  { id: '4', title: 'Deployment failed', message: 'Staging deployment encountered errors', type: 'error', time: new Date(Date.now() - 1000 * 60 * 60 * 5), read: true },
  { id: '5', title: 'Project updated', message: 'Mobile App v2 moved to In Progress', type: 'info', time: new Date(Date.now() - 1000 * 60 * 60 * 8), read: true },
]

const typeConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/50' },
  success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/50' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/50' },
}

export function NotificationsWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-zinc-400" />
          <CardTitle>Notifications</CardTitle>
        </div>
        <span className="text-xs text-zinc-400">{notifications.filter(n => !n.read).length} new</span>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-2">
            {notifications.map(n => {
              const config = typeConfig[n.type as keyof typeof typeConfig]
              const Icon = config.icon
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex gap-3 rounded-lg p-3 transition-colors',
                    !n.read && 'bg-zinc-50 dark:bg-zinc-900'
                  )}
                >
                  <div className={cn('rounded-lg p-2', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', !n.read && 'font-medium')}>{n.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{n.message}</p>
                    <p className="text-xs text-zinc-400 mt-1">{formatRelativeTime(n.time)}</p>
                  </div>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0" />}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
