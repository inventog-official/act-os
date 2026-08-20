'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  LayoutDashboard,
  CheckSquare,
  Box,
  ContactRound,
  Wallet,
  BarChart3,
  TrendingUp,
  FolderKanban,
  Settings,
  Key,
  Building2,
  UserPlus,
  Target,
  FileText,
  Loader2,
} from 'lucide-react'
import { useUIStore, useOrganizationStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  label: string
  description: string
  href: string
  category: string
  icon: React.ComponentType<{ className?: string }>
}

const DEFAULT_COMMANDS = [
  { id: 'c1', title: 'Open Overview Dashboard', href: '/dashboard', category: 'Navigation', icon: LayoutDashboard, shortcut: 'G D' },
  { id: 'c2', title: 'View Active Tasks & Inbox', href: '/tasks', category: 'Navigation', icon: CheckSquare, shortcut: 'G T' },
  { id: 'c3', title: 'Open Inventory Ledger', href: '/inventory', category: 'Navigation', icon: Box, shortcut: 'G I' },
  { id: 'c4', title: 'Open CRM & Deals', href: '/crm', category: 'Navigation', icon: ContactRound, shortcut: 'G C' },
  { id: 'c5', title: 'Open Finance & Payments', href: '/finance', category: 'Navigation', icon: Wallet, shortcut: 'G F' },
  { id: 'c6', title: 'View Enterprise Analytics', href: '/analytics', category: 'Intelligence', icon: BarChart3, shortcut: 'G A' },
  { id: 'c7', title: 'Generate Financial Report', href: '/finance/reports', category: 'Intelligence', icon: TrendingUp, shortcut: 'G R' },
  { id: 'c8', title: 'Create New Project', href: '/projects', category: 'Actions', icon: FolderKanban, shortcut: 'N P' },
  { id: 'c9', title: 'Workspace Settings', href: '/settings/workspace', category: 'Settings', icon: Settings, shortcut: 'S W' },
  { id: 'c10', title: 'Security & API Keys', href: '/settings/security', category: 'Settings', icon: Key, shortcut: 'S K' },
]

export function CommandPalette({ orgSlug }: { orgSlug: string }) {
  const router = useRouter()
  const supabase = createClient()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredCommands = query
    ? DEFAULT_COMMANDS.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    : DEFAULT_COMMANDS

  const doSearch = useCallback(
    async (q: string) => {
      if (!currentOrganization || q.length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      setSelectedIndex(0)
      try {
        const term = `%${q}%`
        const orgId = currentOrganization.id

        const [leadsRes, companiesRes, dealsRes, projectsRes, tasksRes] = await Promise.all([
          supabase
            .from('crm_leads')
            .select('id, first_name, last_name, company_name')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .or(`first_name.ilike.${term},last_name.ilike.${term}`)
            .limit(3),
          supabase
            .from('crm_companies')
            .select('id, name')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .or(`name.ilike.${term}`)
            .limit(3),
          supabase
            .from('crm_deals')
            .select('id, name')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .or(`name.ilike.${term}`)
            .limit(3),
          supabase
            .from('projects')
            .select('id, name, description')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .or(`name.ilike.${term},code.ilike.${term}`)
            .limit(3),
          supabase
            .from('tasks')
            .select('id, title, description, project_id')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .or(`title.ilike.${term}`)
            .limit(3),
        ])

        const results: SearchResult[] = []
        ;(leadsRes.data || []).forEach((l) =>
          results.push({
            id: l.id,
            label: `${l.first_name} ${l.last_name}`,
            description: l.company_name || 'Lead Record',
            href: `/${currentOrganization.slug}/crm/leads`,
            category: 'CRM',
            icon: UserPlus,
          })
        )
        ;(companiesRes.data || []).forEach((c) =>
          results.push({
            id: c.id,
            label: c.name,
            description: 'Company Account',
            href: `/${currentOrganization.slug}/crm/companies`,
            category: 'CRM',
            icon: Building2,
          })
        )
        ;(dealsRes.data || []).forEach((d) =>
          results.push({
            id: d.id,
            label: d.name,
            description: 'Pipeline Opportunity',
            href: `/${currentOrganization.slug}/crm/pipeline`,
            category: 'CRM',
            icon: Target,
          })
        )
        ;(projectsRes.data || []).forEach((p) =>
          results.push({
            id: p.id,
            label: p.name,
            description: p.description || 'Active Project',
            href: `/${currentOrganization.slug}/projects/${p.id}`,
            category: 'Projects',
            icon: FolderKanban,
          })
        )
        ;(tasksRes.data || []).forEach((t) =>
          results.push({
            id: t.id,
            label: t.title,
            description: 'Assigned Task',
            href: `/${currentOrganization.slug}/projects/${t.project_id}/tasks/${t.id}`,
            category: 'Tasks',
            icon: CheckSquare,
          })
        )

        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [currentOrganization, supabase]
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setSearchResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 150)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const handleSelect = (href: string) => {
    setCommandPaletteOpen(false)
    if (href.startsWith('/')) {
      if (!href.startsWith(`/${orgSlug}`)) {
        router.push(`/${orgSlug}${href}`)
      } else {
        router.push(href)
      }
    }
  }

  const allItems: { href: string; label: string; category: string; shortcut?: string; description?: string; icon: React.ComponentType<{ className?: string }> }[] = [
    ...filteredCommands.map((c) => ({
      href: c.href,
      label: c.title,
      category: c.category,
      shortcut: c.shortcut,
      icon: c.icon,
    })),
    ...searchResults.map((r) => ({
      href: r.href,
      label: r.label,
      category: r.category,
      description: r.description,
      icon: r.icon,
    })),
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = allItems.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, total - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault()
      handleSelect(allItems[selectedIndex].href)
    }
  }

  if (!commandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Centered Command Panel */}
      <div className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/[0.15] rounded-2xl shadow-2xl overflow-hidden font-mono text-white animate-fade-in z-10">
        {/* Search Bar Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="What do you want to do?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
          />
          {isSearching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400 mr-1" />
          )}
          <kbd className="px-2 py-0.5 rounded bg-white/[0.08] border border-white/10 text-[10px] text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No matching commands or enterprise records found.
            </div>
          ) : (
            (() => {
              const groups = new Map<string, typeof allItems>()
              allItems.forEach((item) => {
                const group = groups.get(item.category) || []
                group.push(item)
                groups.set(item.category, group)
              })

              let globalIdx = 0
              return Array.from(groups.entries()).map(([category, items]) => (
                <div key={category} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-neutral-500">
                    {category}
                  </div>
                  {items.map((item) => {
                    const idx = globalIdx++
                    const isSelected = selectedIndex === idx
                    const Icon = item.icon

                    return (
                      <button
                        key={`${category}-${item.label}-${idx}`}
                        onClick={() => handleSelect(item.href)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left',
                          isSelected
                            ? 'bg-white text-black font-semibold'
                            : 'text-neutral-300 hover:bg-white/[0.05] hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-black' : 'text-neutral-400')} />
                          <span className="truncate">{item.label}</span>
                          {item.description && (
                            <span
                              className={cn(
                                'text-[10px] font-normal truncate',
                                isSelected ? 'text-black/60' : 'text-neutral-500'
                              )}
                            >
                              — {item.description}
                            </span>
                          )}
                        </div>

                        {item.shortcut && (
                          <span
                            className={cn(
                              'text-[10px] tracking-wider ml-2',
                              isSelected ? 'text-black/70' : 'text-neutral-500'
                            )}
                          >
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            })()
          )}
        </div>

        {/* Bottom Hint */}
        <div className="px-4 py-2.5 border-t border-white/[0.08] bg-white/[0.01] flex items-center justify-between text-[10px] text-neutral-500">
          <span>Navigate: ↑ ↓</span>
          <span>Select: ↵ ENTER</span>
          <span>Close: ESC</span>
        </div>
      </div>
    </div>
  )
}
