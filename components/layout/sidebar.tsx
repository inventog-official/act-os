'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Calendar,
  Activity,
  BarChart3,
  ContactRound,
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store'
import { useOrganizationStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'CRM', href: '/crm', icon: ContactRound },
  { title: 'Projects', href: '/projects', icon: FolderKanban },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare },
  { title: 'Teams', href: '/teams', icon: Users },
  { title: 'Calendar', href: '/calendar', icon: Calendar },
  { title: 'Activity', href: '/activity', icon: Activity },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Sidebar({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { currentOrganization } = useOrganizationStore()

  const isActive = (href: string) => pathname.includes(href)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className={cn(
          'flex h-16 items-center border-b border-zinc-200 px-4 dark:border-zinc-800',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {sidebarOpen ? (
            <>
              <Link href={`/${orgSlug}/dashboard`} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">ACT OS</span>
                  {currentOrganization && (
                    <span className="text-xs text-zinc-500 truncate max-w-[140px]">
                      {currentOrganization.name}
                    </span>
                  )}
                </div>
              </Link>
              <Button variant="ghost" size="icon-sm" onClick={toggleSidebar}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href={`/${orgSlug}/dashboard`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
                  A
                </div>
              </Link>
              <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} className="absolute -right-3 top-5">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const href = `/${orgSlug}${item.href}`
              const active = isActive(item.href)

              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                          active
                            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                            : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.title}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          <Separator className="my-4" />

          {sidebarOpen && (
            <div className="px-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Workspaces</span>
                <Button variant="ghost" size="icon-sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200 transition-colors">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  General
                </button>
                <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200 transition-colors">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Design
                </button>
                <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200 transition-colors">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Engineering
                </button>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className={cn(
          'border-t border-zinc-200 p-3 dark:border-zinc-800',
          !sidebarOpen && 'flex justify-center'
        )}>
          {sidebarOpen ? (
            <Link
              href={`/${orgSlug}/settings/profile`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname.includes('/settings')
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              Settings
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/${orgSlug}/settings/profile`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                Settings
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
