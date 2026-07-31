'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  Building2,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/use-auth'
import { useUIStore } from '@/lib/store'
import { useOrganizationStore } from '@/lib/store'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
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
import { getInitials } from '@/lib/utils'

export function Navbar({ orgSlug }: { orgSlug: string }) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toggleSidebar, setSidebarOpen, setCommandPaletteOpen, sidebarOpen } = useUIStore()
  const { currentOrganization } = useOrganizationStore()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return (
    <header className={cn(
      'fixed top-0 right-0 z-30 flex h-16 items-center border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 transition-all duration-300',
      sidebarOpen ? 'left-64' : 'left-16'
    )}>
      <div className="flex flex-1 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:border-zinc-700"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search anything...</span>
            <span className="hidden sm:inline text-xs">⌘K</span>
          </button>

          <nav className="hidden md:flex items-center gap-1 text-sm text-zinc-500">
            <span className="text-zinc-400">{currentOrganization?.name}</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">Dashboard</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {!mounted ? <div className="h-4 w-4" /> : theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <NotificationsPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user?.user_metadata?.name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-medium leading-none">{user?.user_metadata?.name || 'User'}</span>
                  <span className="text-xs text-zinc-500 leading-none mt-1">{user?.email}</span>
                </div>
                <ChevronDown className="hidden md:block h-4 w-4 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/${orgSlug}/settings/profile`)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${orgSlug}/settings/workspace`)}>
                <Building2 className="mr-2 h-4 w-4" />
                Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
