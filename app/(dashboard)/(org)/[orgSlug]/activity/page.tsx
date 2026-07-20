'use client'

import { useState, use } from 'react'
import { Activity, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { formatRelativeTime } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const allActivities = [
  { id: '1', user: 'Sarah Chen', action: 'created project', target: 'Website Redesign', type: 'create', time: new Date(Date.now() - 1000 * 60 * 5) },
  { id: '2', user: 'Mike Johnson', action: 'completed task', target: 'Homepage Wireframe', type: 'complete', time: new Date(Date.now() - 1000 * 60 * 15) },
  { id: '3', user: 'Emily Davis', action: 'commented on', target: 'Mobile App Design', type: 'comment', time: new Date(Date.now() - 1000 * 60 * 45) },
  { id: '4', user: 'Alex Kim', action: 'updated', target: 'API Integration', type: 'update', time: new Date(Date.now() - 1000 * 60 * 60) },
  { id: '5', user: 'Lisa Wang', action: 'joined team', target: 'Engineering', type: 'join', time: new Date(Date.now() - 1000 * 60 * 120) },
  { id: '6', user: 'James Wilson', action: 'pushed code to', target: 'Auth Module', type: 'code', time: new Date(Date.now() - 1000 * 60 * 180) },
  { id: '7', user: 'You', action: 'were assigned to', target: 'Dashboard Redesign', type: 'assign', time: new Date(Date.now() - 1000 * 60 * 240) },
  { id: '8', user: 'Sarah Chen', action: 'deployed', target: 'Staging Environment', type: 'deploy', time: new Date(Date.now() - 1000 * 60 * 300) },
  { id: '9', user: 'Mike Johnson', action: 'created task', target: 'Fix Navbar Bug', type: 'create', time: new Date(Date.now() - 1000 * 60 * 360) },
  { id: '10', user: 'Emily Davis', action: 'approved', target: 'Design System Updates', type: 'approve', time: new Date(Date.now() - 1000 * 60 * 480) },
]

const typeColors: Record<string, string> = {
  create: 'bg-emerald-500',
  complete: 'bg-blue-500',
  comment: 'bg-purple-500',
  update: 'bg-amber-500',
  join: 'bg-cyan-500',
  code: 'bg-zinc-500',
  assign: 'bg-red-500',
  deploy: 'bg-indigo-500',
  approve: 'bg-pink-500',
}

export default function ActivityPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const [filter, setFilter] = useState('all')

  const activities = filter === 'all' ? allActivities : allActivities.filter(a => a.type === filter)

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Activity</h1>
            <p className="text-sm text-zinc-500">Real-time team activity feed</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="create">Created</SelectItem>
                <SelectItem value="complete">Completed</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="update">Updates</SelectItem>
                <SelectItem value="deploy">Deploys</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-0">
              {activities.map((activity, i) => (
                <div key={activity.id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${typeColors[activity.type]} mt-1.5`} />
                    {i < activities.length - 1 && <div className="mt-2 h-full w-px bg-zinc-200 dark:bg-zinc-800" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{activity.user}</span>
                      <span className="text-sm text-zinc-500">{activity.action}</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{activity.target}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] capitalize">{activity.type}</Badge>
                      <span className="text-xs text-zinc-400">{formatRelativeTime(activity.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
