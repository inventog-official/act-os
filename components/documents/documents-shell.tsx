'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Dashboard', href: 'dashboard' },
  { label: 'Library', href: 'library' },
  { label: 'Folders', href: 'folders' },
  { label: 'Knowledge', href: 'knowledge' },
  { label: 'SOPs', href: 'sops' },
  { label: 'Policies', href: 'policies' },
  { label: 'Contracts', href: 'contracts' },
  { label: 'Templates', href: 'templates' },
  { label: 'Approvals', href: 'approvals' },
  { label: 'Activity', href: 'activity' },
]

interface DocumentsShellProps {
  children: ReactNode
  orgSlug: string
}

export function DocumentsShell({ children, orgSlug }: DocumentsShellProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950 w-fit max-w-full">
        {tabs.map((tab) => {
          const active = pathname.endsWith(tab.href) || (tab.href === 'dashboard' && pathname.endsWith('/documents'))
          return (
            <Link
              key={tab.href}
              href={`/${orgSlug}/documents/${tab.href}`}
              className={cn(
                'whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
      {children}
    </div>
  )
}