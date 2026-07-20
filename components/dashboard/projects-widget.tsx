'use client'

import { FolderKanban, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const projects = [
  { id: '1', name: 'Website Redesign', status: 'active', progress: 65, deadline: 'Dec 15', team: ['SC', 'MJ', 'ED'] },
  { id: '2', name: 'Mobile App v2', status: 'active', progress: 30, deadline: 'Jan 20', team: ['AK', 'LW'] },
  { id: '3', name: 'API Integration', status: 'on_hold', progress: 80, deadline: 'Dec 5', team: ['JW', 'SC'] },
  { id: '4', name: 'Brand Refresh', status: 'planning', progress: 10, deadline: 'Feb 1', team: ['ED'] },
  { id: '5', name: 'Dashboard Analytics', status: 'active', progress: 45, deadline: 'Jan 10', team: ['MJ', 'AK', 'LW'] },
]

const statusColors = {
  active: 'bg-emerald-500',
  on_hold: 'bg-amber-500',
  planning: 'bg-blue-500',
  completed: 'bg-zinc-500',
  cancelled: 'bg-red-500',
}

export function ProjectsWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-zinc-400" />
          <CardTitle>Projects</CardTitle>
        </div>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {projects.map(project => (
            <div key={project.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${statusColors[project.status as keyof typeof statusColors]}`} />
                  <span className="text-sm font-medium">{project.name}</span>
                </div>
                <span className="text-xs text-zinc-400">{project.deadline}</span>
              </div>
              <Progress value={project.progress} className="h-1.5" />
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex -space-x-1.5">
                  {project.team.map((member, i) => (
                    <div
                      key={i}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-600 ring-2 ring-white dark:bg-zinc-700 dark:text-zinc-300 dark:ring-zinc-950"
                    >
                      {member}
                    </div>
                  ))}
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {project.progress}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
