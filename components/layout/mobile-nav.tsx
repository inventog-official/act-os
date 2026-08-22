'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  ContactRound,
  BarChart3,
  Menu,
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  orgSlug: string
}

export function MobileNav({ orgSlug }: MobileNavProps) {
  const pathname = usePathname()
  const { toggleSidebar } = useUIStore()

  const tabs = [
    { label: 'Home', href: `/${orgSlug}/dashboard`, active: pathname === `/${orgSlug}/dashboard`, icon: LayoutDashboard },
    { label: 'Work', href: `/${orgSlug}/projects`, active: pathname.includes('/projects') || pathname.includes('/tasks'), icon: FolderKanban },
    { label: 'Biz', href: `/${orgSlug}/crm`, active: pathname.includes('/crm') || pathname.includes('/finance') || pathname.includes('/inventory'), icon: ContactRound },
    { label: 'AI', href: `/${orgSlug}/analytics`, active: pathname.includes('/analytics'), icon: BarChart3 },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#050505]/95 backdrop-blur-xl border-t border-neutral-200 dark:border-white/[0.08] flex items-center justify-around h-16 px-2 font-mono text-[10px] text-neutral-900 dark:text-white">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 transition-colors relative gap-1',
              tab.active
                ? 'text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            )}
          >
            {tab.active && (
              <span className="absolute top-0 w-8 h-[2px] bg-neutral-900 dark:bg-white rounded-full" />
            )}
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </Link>
        )
      })}

      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors gap-1"
      >
        <Menu className="h-4 w-4" />
        <span>Menu</span>
      </button>
    </nav>
  )
}
