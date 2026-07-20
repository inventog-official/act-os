'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { settingsNavigation } from '@/config/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import * as LucideIcons from 'lucide-react'

export function SettingsShell({ children, orgSlug }: { children: ReactNode; orgSlug: string }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="space-y-1">
            {settingsNavigation.map((item) => {
              const Icon = (LucideIcons as any)[item.icon]
              const href = `/${orgSlug}${item.href}`
              const active = pathname === href
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="max-w-2xl space-y-8">
          {children}
        </div>
      </div>
    </div>
  )
}
