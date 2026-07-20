'use client'

import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'
import { CommandPalette } from './command-palette'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useUIStore } from '@/lib/store'
import { useOrganizationStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  children: ReactNode
  orgSlug: string
}

export function DashboardShell({ children, orgSlug }: DashboardShellProps) {
  const { sidebarOpen } = useUIStore()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar orgSlug={orgSlug} />
      <Navbar orgSlug={orgSlug} />
      <CommandPalette orgSlug={orgSlug} />

      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          sidebarOpen && !isMobile ? 'ml-64' : isMobile ? 'ml-0' : 'ml-16'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
