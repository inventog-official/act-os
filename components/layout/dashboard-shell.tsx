'use client'

import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'
import { CommandPalette } from './command-palette'
import { MobileNav } from './mobile-nav'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  children: ReactNode
  orgSlug: string
}

export function DashboardShell({ children, orgSlug }: DashboardShellProps) {
  const { sidebarOpen } = useUIStore()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] dark:bg-[#080808] text-neutral-900 dark:text-white transition-colors duration-200 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Sidebar orgSlug={orgSlug} />
      <Navbar orgSlug={orgSlug} />
      <CommandPalette orgSlug={orgSlug} />

      <main
        className="min-h-screen pt-16 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pb-16 md:pb-8 ml-0 md:ml-[76px]"
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      <MobileNav orgSlug={orgSlug} />
    </div>
  )
}
