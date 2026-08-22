'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search,
  Menu,
  Sun,
  Moon,
  User,
  Building2,
  Key,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/providers/theme-provider'
import { useUIStore, useOrganizationStore } from '@/lib/store'
import { cn, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationsPopover } from '@/components/notifications/notifications-popover'

export function Navbar({ orgSlug }: { orgSlug: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { sidebarOpen, setSidebarOpen, setCommandPaletteOpen } = useUIStore()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : true

  // Compute readable page title from current pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const currentSection = pathSegments[1]
    ? pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1)
    : 'Overview'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center bg-transparent border-none text-neutral-900 dark:text-white transition-colors duration-200',
        'left-0 md:left-[76px]'
      )}
    >
      <div className="flex flex-1 items-center justify-between px-6">
        {/* Left: macOS Window Traffic Lights & Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* macOS Traffic Lights (Close / Minimize / Zoom) */}
          <div className="hidden lg:flex items-center gap-2 mr-1 group/lights py-1">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center justify-center cursor-pointer transition-transform active:scale-90">
              <span className="opacity-0 group-hover/lights:opacity-100 text-[8px] text-[#780000] font-bold leading-none select-none">×</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center justify-center cursor-pointer transition-transform active:scale-90">
              <span className="opacity-0 group-hover/lights:opacity-100 text-[8px] text-[#784900] font-bold leading-none select-none">-</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center justify-center cursor-pointer transition-transform active:scale-90">
              <span className="opacity-0 group-hover/lights:opacity-100 text-[7px] text-[#004D00] font-bold leading-none select-none">+</span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>

          <nav className="flex items-center gap-2 font-sans text-xs sm:text-sm">
            <span className="text-neutral-500 dark:text-neutral-400 font-medium tracking-tight">{currentOrganization?.name || orgSlug}</span>
            <span className="text-neutral-300 dark:text-neutral-600 font-light">/</span>
            <span className="text-neutral-900 dark:text-white font-semibold tracking-tight">
              {currentSection}
            </span>
          </nav>
        </div>

        {/* Right: macOS Spotlight Search, Theme, Notifications & User Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-sans text-xs transition-all shadow-xs"
          >
            <Search className="h-3.5 w-3.5 text-neutral-400" />
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono font-medium">
              ⌘K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] h-8 w-8 transition-colors"
          >
            {mounted ? (
              isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <NotificationsPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2.5 py-1 hover:bg-black/5 dark:hover:bg-white/[0.08] rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-neutral-900 dark:text-white transition-colors h-8"
              >
                <Avatar className="h-5 w-5 rounded-full border border-black/[0.08] dark:border-white/20 bg-neutral-100 dark:bg-neutral-900">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-[9px] font-mono text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-800">
                    {getInitials(user?.user_metadata?.name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-xs font-sans font-medium text-neutral-800 dark:text-white/90">
                  {user?.user_metadata?.name || 'User'}
                </span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 bg-white/95 dark:bg-[#121216]/95 backdrop-blur-2xl border border-neutral-200 dark:border-white/[0.12] text-neutral-900 dark:text-white rounded-2xl shadow-xl p-1.5 font-sans text-xs"
            >
              <DropdownMenuLabel className="px-2 py-1.5 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                USER ACCOUNT
              </DropdownMenuLabel>
              <div className="px-2 py-1 mb-1">
                <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                  {user?.user_metadata?.name || 'User'}
                </div>
                <div className="text-[10px] text-neutral-500 truncate">
                  {user?.email}
                </div>
              </div>

              <DropdownMenuSeparator className="bg-neutral-200/60 dark:bg-white/[0.08] my-1" />

              <DropdownMenuItem
                onClick={() => router.push(`/${orgSlug}/settings/profile`)}
                className="px-2.5 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] cursor-pointer flex items-center gap-2 transition-colors"
              >
                <User className="h-3.5 w-3.5 text-neutral-500" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/${orgSlug}/settings/workspace`)}
                className="px-2.5 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] cursor-pointer flex items-center gap-2 transition-colors"
              >
                <Building2 className="h-3.5 w-3.5 text-neutral-500" />
                <span>Workspace Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/${orgSlug}/settings/security`)}
                className="px-2.5 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] cursor-pointer flex items-center gap-2 transition-colors"
              >
                <Key className="h-3.5 w-3.5 text-neutral-500" />
                <span>Security &amp; Keys</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-neutral-200/60 dark:bg-white/[0.08] my-1" />

              <DropdownMenuItem
                onClick={signOut}
                className="px-2.5 py-2 rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer flex items-center gap-2 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
