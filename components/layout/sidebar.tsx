'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  motion,
  AnimatePresence,
} from 'framer-motion'
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
  Settings,
  Search,
  Plus,
  Building2,
  X,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useOrganizationStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DockAppItem {
  title: string
  href: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  glowColor: string
}

const DOCK_APPS: {
  group: 'main' | 'work' | 'business' | 'intelligence' | 'system'
  items: DockAppItem[]
}[] = [
  {
    group: 'main',
    items: [
      {
        title: 'Overview',
        href: '/dashboard',
        category: 'WORKSPACE',
        icon: LayoutDashboard,
        gradient: 'from-[#0A84FF] to-[#0055D4]',
        glowColor: 'rgba(10, 132, 255, 0.6)',
      },
      {
        title: 'Tasks & Inbox',
        href: '/tasks',
        category: 'WORKSPACE',
        icon: CheckSquare,
        gradient: 'from-[#FF9F0A] to-[#FF6A00]',
        glowColor: 'rgba(255, 159, 10, 0.6)',
      },
      {
        title: 'Activity',
        href: '/activity',
        category: 'WORKSPACE',
        icon: Activity,
        gradient: 'from-[#FF375F] to-[#D70035]',
        glowColor: 'rgba(255, 55, 95, 0.6)',
      },
    ],
  },
  {
    group: 'work',
    items: [
      {
        title: 'Projects',
        href: '/projects',
        category: 'WORK',
        icon: FolderKanban,
        gradient: 'from-[#5E5CE6] to-[#3634A3]',
        glowColor: 'rgba(94, 92, 230, 0.6)',
      },
      {
        title: 'Documents',
        href: '/documents',
        category: 'WORK',
        icon: FileText,
        gradient: 'from-[#FFD60A] via-[#FF9F0A] to-[#FF8000]',
        glowColor: 'rgba(255, 159, 10, 0.6)',
      },
      {
        title: 'Teams',
        href: '/teams',
        category: 'WORK',
        icon: Users,
        gradient: 'from-[#64D2FF] to-[#0A84FF]',
        glowColor: 'rgba(100, 210, 255, 0.6)',
      },
      {
        title: 'Calendar',
        href: '/calendar',
        category: 'WORK',
        icon: Calendar,
        gradient: 'from-[#FF453A] to-[#D70015]',
        glowColor: 'rgba(255, 69, 58, 0.6)',
      },
    ],
  },
  {
    group: 'business',
    items: [
      {
        title: 'CRM & Deals',
        href: '/crm',
        category: 'BUSINESS',
        icon: ContactRound,
        gradient: 'from-[#30D158] to-[#1C8C3C]',
        glowColor: 'rgba(48, 209, 88, 0.6)',
      },
      {
        title: 'Inventory',
        href: '/inventory',
        category: 'BUSINESS',
        icon: Box,
        gradient: 'from-[#E08A3C] to-[#AC5A18]',
        glowColor: 'rgba(224, 138, 60, 0.6)',
      },
      {
        title: 'Finance',
        href: '/finance',
        category: 'BUSINESS',
        icon: Wallet,
        gradient: 'from-[#34C759] to-[#147D3B]',
        glowColor: 'rgba(52, 199, 89, 0.6)',
      },
      {
        title: 'People & HR',
        href: '/hr',
        category: 'BUSINESS',
        icon: UserRound,
        gradient: 'from-[#BF5AF2] to-[#8944AB]',
        glowColor: 'rgba(191, 90, 242, 0.6)',
      },
      {
        title: 'Analytics',
        href: '/analytics',
        category: 'INTELLIGENCE',
        icon: BarChart3,
        gradient: 'from-[#6366F1] to-[#4338CA]',
        glowColor: 'rgba(99, 102, 241, 0.6)',
      },
    ],
  },
]

function DockIcon({
  item,
  orgSlug,
  pathname,
}: {
  item: DockAppItem
  orgSlug: string
  pathname: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  const href = `/${orgSlug}${item.href}`
  const isActive =
    pathname === href || (item.href !== '/dashboard' && pathname.startsWith(href))

  const Icon = item.icon

  return (
    <div
      className="relative flex items-center justify-center py-1 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Active App macOS Indicator: glowing dot on the left side */}
      {isActive && (
        <motion.span
          layoutId="dock-active-dot"
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-900 shadow-[0_0_6px_rgba(0,0,0,0.4)] dark:bg-white dark:shadow-[0_0_8px_rgba(255,255,255,0.9),0_0_14px_rgba(59,130,246,0.6)] z-10"
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        />
      )}

      {/* Dock Icon Tile */}
      <Link href={href} className="outline-none">
        <motion.div
          whileHover={{ scale: 1.25, x: 3 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22, mass: 0.4 }}
          className={cn(
            'relative w-[42px] h-[42px] rounded-[13px] flex items-center justify-center cursor-pointer select-none',
            'bg-gradient-to-br',
            item.gradient,
            'shadow-[0_4px_10px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.32)]',
            'border border-white/30 dark:border-white/20 will-change-transform'
          )}
        >
          {/* Specular Apple Glass Gloss overlay */}
          <div className="absolute inset-0 rounded-[13px] bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none" />

          {/* Bottom bevel */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-[13px] bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          {/* App Icon */}
          <div className="w-5 h-5 flex items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <Icon className="w-full h-full stroke-[2]" />
          </div>
        </motion.div>
      </Link>

      {/* macOS Floating Tooltip on the Right */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -4, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.94 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none whitespace-nowrap"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#141418]/95 backdrop-blur-xl border border-neutral-200 dark:border-white/[0.18] shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] text-neutral-900 dark:text-white">
              {/* Tooltip arrow pointing left */}
              <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-white dark:bg-[#141418] border-l border-b border-neutral-200 dark:border-white/[0.18]" />

              <span className="font-sans text-xs font-semibold tracking-tight">
                {item.title}
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.1] text-neutral-600 dark:text-neutral-400 font-medium tracking-wider">
                {item.category}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen, setCommandPaletteOpen } = useUIStore()
  const { currentOrganization, organizations, setCurrentOrganization } = useOrganizationStore()
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [launchpadOpen, setLaunchpadOpen] = useState(false)

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP: macOS MacBook Left Dock */}
      {/* ========================================================================= */}
      <aside
        aria-label="macOS Left Dock"
        className="fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center select-none"
      >
        {/* Dock Frosted Glass Outer Container */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'relative flex flex-col items-center py-2 px-1.5 rounded-[22px]',
            'bg-white/75 dark:bg-[#0c0c10]/80 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.14]',
            'shadow-[0_20px_50px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)]'
          )}
        >
          {/* Subtle macOS Dock Glass Highlight Border */}
          <div className="absolute inset-0 rounded-[22px] pointer-events-none bg-gradient-to-b from-white/40 dark:from-white/[0.08] via-transparent to-black/5 dark:to-black/40" />

          {/* TOP SECTION: Workspace Emblem / Apple Logo style */}
          <div className="relative mb-1">
            <DropdownMenu open={workspaceMenuOpen} onOpenChange={setWorkspaceMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  title={currentOrganization?.name || 'ACT OS'}
                  className="w-10 h-10 rounded-[12px] bg-gradient-to-b from-neutral-900 to-black dark:from-white dark:to-neutral-200 text-white dark:text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform duration-150 outline-none group border border-white/10 dark:border-black/10"
                >
                  <div className="w-3.5 h-3.5 rounded-[2px] bg-white dark:bg-black group-hover:scale-110 transition-transform" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="right"
                align="start"
                sideOffset={14}
                className="w-60 bg-white/95 dark:bg-[#0E0E12]/95 backdrop-blur-2xl border border-neutral-200 dark:border-white/[0.15] text-neutral-900 dark:text-white rounded-2xl shadow-2xl p-1.5 font-mono text-xs z-50 animate-in fade-in zoom-in-95"
              >
                <DropdownMenuLabel className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest px-2.5 py-1.5 flex items-center justify-between">
                  <span>ACTIVE WORKSPACE</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </DropdownMenuLabel>
                <DropdownMenuItem className="px-2.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.08] text-neutral-900 dark:text-white flex items-center justify-between font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 text-neutral-600 dark:text-white/80" />
                    <span className="truncate">{currentOrganization?.name || orgSlug}</span>
                  </div>
                </DropdownMenuItem>

                {organizations && organizations.length > 1 && (
                  <>
                    <DropdownMenuSeparator className="bg-neutral-200 dark:bg-white/[0.1] my-1" />
                    <DropdownMenuLabel className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest px-2.5 py-1">
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
                          className="px-2.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Building2 className="h-3.5 w-3.5 text-neutral-500" />
                          <span className="truncate">{org.name}</span>
                        </DropdownMenuItem>
                      ))}
                  </>
                )}

                <DropdownMenuSeparator className="bg-neutral-200 dark:bg-white/[0.1] my-1" />
                <DropdownMenuItem
                  onClick={() => router.push(`/${orgSlug}/organization/create`)}
                  className="px-2.5 py-1.5 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] cursor-pointer flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Workspace</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/${orgSlug}/settings/workspace`)}
                  className="px-2.5 py-1.5 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] cursor-pointer flex items-center gap-2"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Workspace Preferences</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Launchpad / Spotlight Trigger (Command + K) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            title="Launchpad & Command (⌘K)"
            className="w-10 h-10 rounded-[12px] flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] hover:scale-105 active:scale-95 transition-all duration-150 relative group my-0.5"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* macOS Dock Divider */}
          <div className="w-6 h-[1px] bg-black/[0.1] dark:bg-white/[0.14] my-1.5 rounded-full" />

          {/* DOCK APP ICONS */}
          <div className="flex flex-col items-center">
            {DOCK_APPS.map((group, groupIdx) => (
              <React.Fragment key={group.group}>
                {groupIdx > 0 && (
                  <div className="w-5 h-[1px] bg-black/[0.08] dark:bg-white/[0.1] my-1 rounded-full" />
                )}
                {group.items.map((item) => (
                  <DockIcon
                    key={item.title}
                    item={item}
                    orgSlug={orgSlug}
                    pathname={pathname}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* macOS Dock Divider */}
          <div className="w-6 h-[1px] bg-black/[0.1] dark:bg-white/[0.14] my-1.5 rounded-full" />

          {/* BOTTOM: Launchpad Grid view button */}
          <button
            onClick={() => setLaunchpadOpen(true)}
            title="Launchpad App Library"
            className="w-10 h-10 rounded-[12px] flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] hover:scale-105 active:scale-95 transition-all duration-150 my-0.5"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Settings icon */}
          <Link
            href={`/${orgSlug}/settings/profile`}
            title="System Settings"
            className={cn(
              'w-10 h-10 rounded-[12px] flex items-center justify-center transition-all duration-150 relative group my-0.5',
              pathname.includes('/settings')
                ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.15] border border-neutral-300 dark:border-white/20'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] hover:scale-105 active:scale-95'
            )}
          >
            <Settings className="w-4 h-4" />
            {pathname.includes('/settings') && (
              <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] dark:shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
            )}
          </Link>
        </motion.div>
      </aside>

      {/* ========================================================================= */}
      {/* LAUNCHPAD MODAL OVERLAY (macOS Style Full App Grid) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {launchpadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 select-none">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLaunchpadOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-[#050508]/85 backdrop-blur-3xl"
            />

            {/* Launchpad Grid Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-3xl bg-white/95 dark:bg-[#0F0F14]/90 border border-neutral-200 dark:border-white/[0.15] rounded-3xl p-8 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
                    ⌘
                  </div>
                  <div>
                    <h2 className="text-sm font-mono font-semibold text-neutral-900 dark:text-white tracking-wide">
                      ACT OS Launchpad
                    </h2>
                    <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                      All system applications and workspaces
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setLaunchpadOpen(false)}
                  className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Apps */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-6">
                {DOCK_APPS.flatMap((g) => g.items).map((app) => {
                  const Icon = app.icon
                  const href = `/${orgSlug}${app.href}`
                  return (
                    <Link
                      key={app.title}
                      href={href}
                      onClick={() => setLaunchpadOpen(false)}
                      className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-all group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-white to-neutral-100 dark:from-[#22222a] dark:to-[#121216] border border-neutral-200 dark:border-white/[0.14] shadow-md flex items-center justify-center group-hover:scale-110 group-hover:border-neutral-300 dark:group-hover:border-white/40 transition-transform">
                        <Icon className="w-6 h-6 text-neutral-800 dark:text-white" />
                      </div>
                      <span className="text-[11px] font-mono font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white text-center leading-tight">
                        {app.title}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER (For mobile screens < md) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md"
            />

            {/* Slide-out Sheet */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative z-10 w-[280px] h-full bg-white dark:bg-[#08080C] border-r border-neutral-200 dark:border-white/[0.12] p-5 flex flex-col justify-between text-neutral-900 dark:text-white shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-[1px] bg-white dark:bg-black" />
                    </div>
                    <span className="font-mono text-xs font-semibold">
                      {currentOrganization?.name || 'ACT OS'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* App list for mobile */}
                <div className="py-4 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
                  {DOCK_APPS.map((group) => (
                    <div key={group.group} className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 px-2">
                        {group.group}
                      </span>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon
                          const href = `/${orgSlug}${item.href}`
                          const active = pathname.includes(item.href)
                          return (
                            <Link
                              key={item.title}
                              href={href}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono transition-colors',
                                active
                                  ? 'bg-neutral-100 dark:bg-white/[0.12] text-neutral-900 dark:text-white font-semibold'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/[0.04]'
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.title}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom mobile settings */}
              <div className="pt-3 border-t border-neutral-200 dark:border-white/[0.08]">
                <Link
                  href={`/${orgSlug}/settings/profile`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings &amp; Preferences</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}


