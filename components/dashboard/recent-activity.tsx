'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelativeTime } from '@/lib/utils'

const activities = [
  { id: '1', user: 'Sarah Chen', action: 'created a new project', target: 'Website Redesign', time: new Date(Date.now() - 1000 * 60 * 5) },
  { id: '2', user: 'Mike Johnson', action: 'completed task', target: 'Homepage Wireframe', time: new Date(Date.now() - 1000 * 60 * 15) },
  { id: '3', user: 'Emily Davis', action: 'commented on', target: 'Mobile App Design', time: new Date(Date.now() - 1000 * 60 * 45) },
  { id: '4', user: 'Alex Kim', action: 'updated', target: 'API Integration', time: new Date(Date.now() - 1000 * 60 * 60) },
  { id: '5', user: 'Lisa Wang', action: 'joined', target: 'Engineering Team', time: new Date(Date.now() - 1000 * 60 * 120) },
  { id: '6', user: 'James Wilson', action: 'submitted a pull request for', target: 'Auth Module', time: new Date(Date.now() - 1000 * 60 * 180) },
  { id: '7', user: 'You', action: 'were assigned to', target: 'Dashboard Redesign', time: new Date(Date.now() - 1000 * 60 * 240) },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  {i < activities.length - 1 && (
                    <div className="mt-2 h-full w-px bg-zinc-200 dark:bg-zinc-800" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{' '}
                    {activity.action}{' '}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{activity.target}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {formatRelativeTime(activity.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
