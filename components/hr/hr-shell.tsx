'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Employees', href: 'employees' },
  { label: 'Departments', href: 'departments' },
  { label: 'Attendance', href: 'attendance' },
  { label: 'Leave', href: 'leave' },
  { label: 'Recruitment', href: 'recruitment' },
  { label: 'Onboarding', href: 'onboarding' },
  { label: 'Performance', href: 'performance' },
  { label: 'Goals', href: 'goals' },
  { label: 'Org Chart', href: 'org-chart' },
  { label: 'Capacity', href: 'capacity' },
  { label: 'Reports', href: 'reports' },
  { label: 'Activity', href: 'activity' },
]

interface HrShellProps {
  children: ReactNode
  orgSlug: string
}

export function HrShell({ children, orgSlug }: HrShellProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950 w-fit max-w-full">
        {tabs.map((tab) => {
          const active = pathname.endsWith(tab.href) || (tab.href === 'employees' && pathname.endsWith('/hr'))
          return (
            <Link
              key={tab.href}
              href={`/${orgSlug}/hr/${tab.href}`}
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