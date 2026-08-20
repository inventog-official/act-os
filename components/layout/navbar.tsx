'use client'

import React from 'react'
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
  const { theme, setTheme } = useTheme()
  const { sidebarOpen, setSidebarOpen, setCommandPaletteOpen } = useUIStore()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  // Compute readable page title from current pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const currentSection = pathSegments[1]
    ? pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1)
    : 'Overview'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center border-b border-white/[0.08] bg-[#050505]/90 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] text-white',
        sidebarOpen ? 'left-[260px]' : 'left-[72px] max-md:left-0'
      )}
    >
      <div className="flex flex-1 items-center justify-between px-6">
        {/* Left: Mobile menu toggle & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>

          <nav className="flex items-center gap-2 font-mono text-xs">
            <span className="text-neutral-500">{currentOrganization?.name || orgSlug}</span>
            <span className="text-neutral-700">/</span>
            <span className="text-white font-medium tracking-wide uppercase">
              {currentSection}
            </span>
          </nav>
        </div>

        {/* Right: Notifications, Quick Command, Theme Toggle & Profile Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:border-white/20 text-neutral-400 hover:text-white font-mono text-xs transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>⌘K Command</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-neutral-400 hover:text-white hover:bg-white/[0.05] h-8 w-8"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <NotificationsPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2.5 px-2 hover:bg-white/[0.04] rounded-lg text-white"
              >
                <Avatar className="h-7 w-7 rounded-[6px] border border-white/20 bg-neutral-900">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-[10px] font-mono text-white bg-neutral-950">
                    {getInitials(user?.user_metadata?.name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-xs font-mono font-medium leading-none text-white">
                    {user?.user_metadata?.name || 'User'}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 leading-none mt-1">
                    {user?.email}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#0A0A0A] border border-white/[0.12] text-white rounded-xl shadow-2xl p-1.5 font-mono text-xs"
            >
              <DropdownMenuLabel className="px-2 py-1.5 text-[10px] text-neutral-500 uppercase tracking-widest">
                USER ACCOUNT
              </DropdownMenuLabel>
              <div className="px-2 py-1 mb-1">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.user_metadata?.name || 'User'}
                </div>
                <div className="text-[10px] text-neutral-500 truncate">
                  {user?.email}
                </div>
              </div>

              <DropdownMenuSeparator className="bg-white/[0.08] my-1" />

              <DropdownMenuItem
                onClick={() => router.push(`/${orgSlug}/settings/profile`)}
                className="px-2 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.04] cursor-pointer flex items-center gap-2"
              >
                <User className="h-3.5 w-3.5 text-neutral-400" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/${orgSlug}/settings/workspace`)}
                className="px-2 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.04] cursor-pointer flex items-center gap-2"
              >
                <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                <span>Workspace Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/${orgSlug}/settings/security`)}
                className="px-2 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.04] cursor-pointer flex items-center gap-2"
              >
                <Key className="h-3.5 w-3.5 text-neutral-400" />
                <span>Security &amp; Keys</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/[0.08] my-1" />

              <DropdownMenuItem
                onClick={signOut}
                className="px-2 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 cursor-pointer flex items-center gap-2"
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
