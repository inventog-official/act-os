'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChart3, FolderKanban, Kanban, Milestone, Target, FileText, Settings } from 'lucide-react'

const projectNavItems = [
  { title: 'Overview', href: '', icon: BarChart3 },
  { title: 'Tasks', href: '/tasks', icon: Kanban },
  { title: 'Milestones', href: '/milestones', icon: Milestone },
  { title: 'Sprints', href: '/sprints', icon: Target },
  { title: 'Files', href: '/files', icon: FileText },
  { title: 'Settings', href: '/settings', icon: Settings },
]

interface ProjectShellProps {
  projectId: string
  orgSlug: string
  children: ReactNode
}

export function ProjectShell({ projectId, orgSlug, children }: ProjectShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-0 overflow-x-auto">
        {projectNavItems.map(item => {
          const href = `/${orgSlug}/projects/${projectId}${item.href}`
          const isActive = item.href === '' ? pathname === `/${orgSlug}/projects/${projectId}` : pathname.startsWith(href)
          return (
            <button
              key={item.title}
              onClick={() => router.push(href)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
                isActive
                  ? 'border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 dark:hover:text-zinc-300 dark:hover:border-zinc-600'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </button>
          )
        })}
      </div>
      {children}
    </div>
  )
}
