'use client'

import { useRouter } from 'next/navigation'
import { Plus, FileText, UserPlus, CalendarPlus, BarChart3, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const actions = [
  { title: 'New Project', icon: Plus, description: 'Create a new project', href: '/projects/new' },
  { title: 'New Task', icon: FileText, description: 'Add a new task', href: '/tasks/new' },
  { title: 'Invite Member', icon: UserPlus, description: 'Add team member', href: '/settings/members' },
  { title: 'Schedule Event', icon: CalendarPlus, description: 'Create calendar event', href: '/calendar' },
  { title: 'View Reports', icon: BarChart3, description: 'Analytics & reports', href: '/analytics' },
  { title: 'Feedback', icon: MessageSquare, description: 'Send feedback', href: '#' },
]

export function QuickActions() {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map(action => {
            const Icon = action.icon
            return (
              <Button
                key={action.title}
                variant="outline"
                className="flex flex-col items-center gap-2 h-24 p-4"
                onClick={() => action.href !== '#' && router.push(action.href)}
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-[10px] text-zinc-400">{action.description}</p>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
