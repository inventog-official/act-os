'use client'

import { Activity, Plus } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { CrmTimeline as CrmTimelineType } from '@/lib/types/database'

interface TimelineProps {
  entries: CrmTimelineType[]
  className?: string
}

const actionIcons: Record<string, string> = {
  created: 'bg-emerald-500',
  updated: 'bg-blue-500',
  completed: 'bg-purple-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500',
  commented: 'bg-amber-500',
  added: 'bg-indigo-500',
  removed: 'bg-red-500',
  assigned: 'bg-cyan-500',
  converted: 'bg-pink-500',
}

export function Timeline({ entries, className }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
          <Activity className="h-5 w-5 text-zinc-400" />
        </div>
        <p className="mt-3 text-sm text-zinc-500">No timeline entries yet</p>
        <p className="text-xs text-zinc-400">Changes will appear here</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-0', className)}>
      {entries.map((entry, i) => {
        const dotColor = actionIcons[entry.action.split(' ')[0]?.toLowerCase()] || 'bg-zinc-400'
        return (
          <div key={entry.id} className="flex gap-3 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div className={cn('h-2.5 w-2.5 rounded-full mt-1.5', dotColor)} />
              {i < entries.length - 1 && (
                <div className="mt-2 h-full w-px bg-zinc-200 dark:bg-zinc-800" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <p className="text-sm">
                <span className="font-medium">{entry.action}</span>
              </p>
              {entry.description && (
                <p className="text-sm text-zinc-500 mt-0.5">{entry.description}</p>
              )}
              <p className="text-xs text-zinc-400 mt-0.5">
                {formatRelativeTime(entry.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
