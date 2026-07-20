'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { crmNavigation } from '@/config/navigation'
import * as LucideIcons from 'lucide-react'

export function CrmShell({ children, orgSlug }: { children: ReactNode; orgSlug: string }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {crmNavigation.map((item) => {
          const Icon = (LucideIcons as any)[item.icon]
          const href = `/${orgSlug}${item.href}`
          const active = href === pathname
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
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
      </div>
      {children}
    </div>
  )
}
