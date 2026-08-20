'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Activity,
  FolderKanban,
  FileText,
  Users,
  Calendar,
  ContactRound,
  Box,
  Wallet,
  UserRound,
  BarChart3,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useOrganizationStore } from '@/lib/store'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavSection {
  title: string
  items: {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'WORKSPACE',
    items: [
      { title: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Tasks & Inbox', href: '/tasks', icon: CheckSquare },
      { title: 'Activity Stream', href: '/activity', icon: Activity },
    ],
  },
  {
    title: 'WORK',
    items: [
      { title: 'Projects', href: '/projects', icon: FolderKanban },
      { title: 'Documents', href: '/documents', icon: FileText },
      { title: 'Teams', href: '/teams', icon: Users },
      { title: 'Calendar', href: '/calendar', icon: Calendar },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      { title: 'CRM & Pipeline', href: '/crm', icon: ContactRound },
      { title: 'Inventory', href: '/inventory', icon: Box },
      { title: 'Finance & Ledger', href: '/finance', icon: Wallet },
      { title: 'People & HR', href: '/hr', icon: UserRound },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { title: 'Analytics', href: '/analytics', icon: BarChart3 },
      { title: 'Enterprise Reports', href: '/finance/reports', icon: TrendingUp },
    ],
  },
]

export function Sidebar({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar, setCommandPaletteOpen } = useUIStore()
  const { currentOrganization, organizations, setCurrentOrganization } = useOrganizationStore()
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)

  const isActive = (href: string) => pathname.includes(href)

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.08] bg-[#050505] text-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] selection:bg-white selection:text-black',
          sidebarOpen ? 'w-[260px]' : 'w-[72px]'
        )}
      >
        {/* Top Header: Logo + Workspace Switcher */}
        <div className="flex h-16 items-center px-4 border-b border-white/[0.08] justify-between">
          <DropdownMenu open={workspaceMenuOpen} onOpenChange={setWorkspaceMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-white/[0.04] transition-colors outline-none text-left w-full overflow-hidden group',
                  !sidebarOpen && 'justify-center p-1'
                )}
              >
                {/* Brand Geometric Emblem */}
                <div className="w-8 h-8 rounded-[6px] bg-white flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 rounded-[1px] bg-black" />
                </div>

                {sidebarOpen && (
                  <div className="flex-1 min-w-0 flex flex-col leading-tight">
                    <span className="font-mono text-xs font-semibold text-white tracking-wider truncate">
                      {currentOrganization?.name || 'ACT OS'}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500 truncate">
                      {orgSlug}
                    </span>
                  </div>
                )}

                {sidebarOpen && (
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0" />
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-56 bg-[#0A0A0A] border border-white/[0.12] text-white rounded-xl shadow-2xl p-1.5 font-mono text-xs"
            >
              <DropdownMenuLabel className="text-[10px] text-neutral-500 uppercase tracking-widest px-2 py-1.5">
                ACTIVE WORKSPACE
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="px-2 py-2 rounded-lg bg-white/[0.06] text-white flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="h-3.5 w-3.5 text-white/70" />
                  <span className="font-semibold truncate">{currentOrganization?.name || orgSlug}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </DropdownMenuItem>

              {organizations && organizations.length > 1 && (
                <>
                  <DropdownMenuSeparator className="bg-white/[0.08] my-1" />
                  <DropdownMenuLabel className="text-[10px] text-neutral-500 uppercase tracking-widest px-2 py-1">
                    SWITCH WORKSPACE
                  </DropdownMenuLabel>
                  {organizations
                    .filter((org) => org.slug !== orgSlug)
                    .map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => {
                          setCurrentOrganization(org)
                          router.push(`/${org.slug}/dashboard`)
                        }}
                        className="px-2 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2"
                      >
                        <Building2 className="h-3.5 w-3.5 text-neutral-500" />
                        <span className="truncate">{org.name}</span>
                      </DropdownMenuItem>
                    ))}
                </>
              )}

              <DropdownMenuSeparator className="bg-white/[0.08] my-1" />
              <DropdownMenuItem
                onClick={() => router.push(`/${orgSlug}/organization/create`)}
                className="px-2 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.04] cursor-pointer flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Workspace</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/${orgSlug}/settings/workspace`)}
                className="px-2 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.04] cursor-pointer flex items-center gap-2"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Workspace Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toggle Sidebar Collapse */}
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.05] transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Command Center Search Trigger */}
        <div className="px-3 pt-3 pb-2">
          {sidebarOpen ? (
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0D0D0D] border border-white/[0.08] hover:border-white/20 text-neutral-400 hover:text-white transition-all font-mono text-xs group"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white transition-colors" />
                <span>Search</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] text-neutral-400">
                ⌘K
              </kbd>
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="w-full h-10 flex items-center justify-center rounded-lg bg-[#0D0D0D] border border-white/[0.08] hover:border-white/20 text-neutral-400 hover:text-white transition-all"
                >
                  <Search className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black border border-white/20 text-white font-mono text-xs">
                Command Center (⌘K)
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation Sections */}
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                {sidebarOpen && (
                  <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    {section.title}
                  </div>
                )}

                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const href = `/${orgSlug}${item.href}`
                    const active = isActive(item.href)
                    const Icon = item.icon

                    if (!sidebarOpen) {
                      return (
                        <Tooltip key={item.title}>
                          <TooltipTrigger asChild>
                            <Link
                              href={href}
                              className={cn(
                                'flex h-10 w-full items-center justify-center rounded-lg transition-all relative',
                                active
                                  ? 'bg-[#151515] text-white'
                                  : 'text-neutral-400 hover:text-white hover:bg-[#0F0F0F]'
                              )}
                            >
                              {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-white rounded-r" />
                              )}
                              <Icon className="h-4 w-4" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-black border border-white/20 text-white font-mono text-xs ml-2">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return (
                      <Link
                        key={item.title}
                        href={href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-mono transition-all duration-150 relative group',
                          active
                            ? 'bg-[#151515] text-white font-medium'
                            : 'text-neutral-400 hover:text-white hover:bg-[#0F0F0F]'
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-white rounded-r" />
                        )}
                        <Icon className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-white' : 'text-neutral-400 group-hover:text-white')} />
                        <span className="tracking-wide">{item.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom Profile & Settings Section */}
        <div className="p-3 border-t border-white/[0.08] space-y-1">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <Link
                href={`/${orgSlug}/settings/profile`}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-mono transition-colors flex-1',
                  pathname.includes('/settings')
                    ? 'bg-[#151515] text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-[#0F0F0F]'
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span>Preferences &amp; Settings</span>
              </Link>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="w-full h-10 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-[#0F0F0F] transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black border border-white/20 text-white font-mono text-xs">
                Expand Sidebar
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
