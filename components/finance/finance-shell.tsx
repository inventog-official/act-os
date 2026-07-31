'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Quotations', href: 'quotations' },
  { label: 'Invoices', href: 'invoices' },
]

interface FinanceShellProps {
  children: ReactNode
  orgSlug: string
}

export function FinanceShell({ children, orgSlug }: FinanceShellProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950 w-fit">
        {tabs.map((tab) => {
          const active = pathname.endsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={`/${orgSlug}/finance/${tab.href}`}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
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