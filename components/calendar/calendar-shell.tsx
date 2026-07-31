import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CalendarDays, Video, MessagesSquare, Clock } from 'lucide-react'

const tabs = [
  { label: 'Calendar', href: 'calendar', Icon: CalendarDays },
  { label: 'Meetings', href: 'meetings', Icon: Video },
  { label: 'Communication', href: 'communication', Icon: MessagesSquare },
  { label: 'Availability', href: 'availability', Icon: Clock },
]

interface CalendarShellProps {
  children: ReactNode
  orgSlug: string
}

export function CalendarShell({ children, orgSlug }: CalendarShellProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950 w-fit max-w-full">
        {tabs.map((tab) => {
          const active = pathname.endsWith(tab.href)
          const TabIcon = tab.Icon
          return (
            <Link
              key={tab.href}
              href={`/${orgSlug}/${tab.href}`}
              className={cn(
                'whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2',
                active
                  ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>
      {children}
    </div>
  )
}