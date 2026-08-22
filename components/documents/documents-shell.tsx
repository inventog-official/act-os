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
      <div className="inline-flex items-center gap-1 overflow-x-auto rounded-2xl bg-neutral-200/50 p-1 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md w-fit max-w-full no-scrollbar shadow-xs">
        {tabs.map((tab) => {
          const active = pathname.endsWith(tab.href) || (tab.href === 'dashboard' && pathname.endsWith('/documents'))
          return (
            <Link
              key={tab.href}
              href={`/${orgSlug}/documents/${tab.href}`}
              className={cn(
                'whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs sm:text-[13px] font-medium transition-all duration-150',
                active
                  ? 'bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:bg-white/[0.18] dark:text-white dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] font-semibold'
                  : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
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