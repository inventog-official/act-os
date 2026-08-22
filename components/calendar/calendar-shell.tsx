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
      <div className="inline-flex items-center gap-1 overflow-x-auto rounded-2xl bg-neutral-200/50 p-1 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md w-fit max-w-full no-scrollbar shadow-xs">
        {tabs.map((tab) => {
          const active = pathname.endsWith(tab.href)
          const TabIcon = tab.Icon
          return (
            <Link
              key={tab.href}
              href={`/${orgSlug}/${tab.href}`}
              className={cn(
                'whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs sm:text-[13px] font-medium transition-all duration-150 flex items-center gap-2',
                active
                  ? 'bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:bg-white/[0.18] dark:text-white dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] font-semibold'
                  : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
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