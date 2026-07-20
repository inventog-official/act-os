'use client'

import { Phone, Mail, Video, FileText, MessageSquare, CheckSquare, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { CrmActivity } from '@/lib/types/database'

interface ActivityFeedProps {
  activities: CrmActivity[]
  className?: string
}

const typeConfig = {
  call: { icon: Phone, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/50', label: 'Call' },
  email: { icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/50', label: 'Email' },
  meeting: { icon: Video, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/50', label: 'Meeting' },
  task: { icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/50', label: 'Task' },
  note: { icon: FileText, color: 'text-zinc-500', bg: 'bg-zinc-50 dark:bg-zinc-900', label: 'Note' },
  sms: { icon: MessageSquare, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/50', label: 'SMS' },
  whatsapp: { icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/50', label: 'WhatsApp' },
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
          <Plus className="h-5 w-5 text-zinc-400" />
        </div>
        <p className="mt-3 text-sm text-zinc-500">No activities yet</p>
        <p className="text-xs text-zinc-400">Log the first activity to get started</p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="space-y-0">
        {activities.map((activity, i) => {
          const config = typeConfig[activity.type as keyof typeof typeConfig]
          const Icon = config?.icon || FileText
          const bg = config?.bg || 'bg-zinc-50'
          const color = config?.color || 'text-zinc-500'

          return (
            <div key={activity.id} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={cn('rounded-lg p-2', bg)}>
                  <Icon className={cn('h-4 w-4', color)} />
                </div>
                {i < activities.length - 1 && (
                  <div className="mt-2 h-full w-px bg-zinc-200 dark:bg-zinc-800" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{activity.subject}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {config?.label || activity.type}
                  </Badge>
                </div>
                {activity.description && (
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{activity.description}</p>
                )}
                <p className="text-xs text-zinc-400 mt-1">
                  {formatRelativeTime(activity.activity_date)}
                  {activity.duration_minutes && ` · ${activity.duration_minutes}m`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
