'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LayoutDashboard, FolderKanban, CheckSquare, Users, Calendar, User, Settings, File, Building2, UserPlus, Target, Loader2 } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { useOrganizationStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'

interface SearchResult {
  id: string
  label: string
  description: string
  href: string
  icon: any
  type: 'lead' | 'company' | 'contact' | 'deal' | 'project' | 'task'
}

const commands = [
  { id: '1', title: 'Go to Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
  { id: '2', title: 'Go to Projects', href: '/projects', icon: FolderKanban, category: 'Navigation' },
  { id: '3', title: 'Go to Tasks', href: '/tasks', icon: CheckSquare, category: 'Navigation' },
  { id: '4', title: 'Go to Teams', href: '/teams', icon: Users, category: 'Navigation' },
  { id: '5', title: 'Go to Calendar', href: '/calendar', icon: Calendar, category: 'Navigation' },
  { id: '6', title: 'Profile Settings', href: '/settings/profile', icon: User, category: 'Settings' },
  { id: '7', title: 'Workspace Settings', href: '/settings/workspace', icon: Settings, category: 'Settings' },
  { id: '8', title: 'New Project', href: '/projects/new', icon: File, category: 'Actions' },
]

const typeIcons: Record<string, any> = { lead: UserPlus, company: Building2, contact: Users, deal: Target, project: FolderKanban, task: CheckSquare }

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
  const isMobile = useMediaQuery('(max-width: 768px)')

  const filteredCommands = query
    ? commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : commands

  const doSearch = useCallback(async (q: string) => {
    if (!currentOrganization || q.length < 2) { setSearchResults([]); return }
    setIsSearching(true)
    setSelectedIndex(0)
    try {
      const term = `%${q}%`
      const orgId = currentOrganization.id

      const [leadsRes, companiesRes, contactsRes, dealsRes, projectsRes, tasksRes] = await Promise.all([
        supabase.from('crm_leads').select('id, first_name, last_name, company_name').eq('organization_id', orgId).is('deleted_at', null).or(`first_name.ilike.${term},last_name.ilike.${term}`).limit(3),
        supabase.from('crm_companies').select('id, name').eq('organization_id', orgId).is('deleted_at', null).or(`name.ilike.${term}`).limit(3),
        supabase.from('crm_contacts').select('id, first_name, last_name').eq('organization_id', orgId).is('deleted_at', null).or(`first_name.ilike.${term},last_name.ilike.${term}`).limit(3),
        supabase.from('crm_deals').select('id, name').eq('organization_id', orgId).is('deleted_at', null).or(`name.ilike.${term}`).limit(3),
        supabase.from('projects').select('id, name, description').eq('organization_id', orgId).is('deleted_at', null).or(`name.ilike.${term},code.ilike.${term},description.ilike.${term}`).limit(3),
        supabase.from('tasks').select('id, title, description, project_id').eq('organization_id', orgId).is('deleted_at', null).or(`title.ilike.${term},description.ilike.${term}`).limit(3),
      ])

      const results: SearchResult[] = []
      ;(leadsRes.data || []).forEach(l => results.push({ id: l.id, label: `${l.first_name} ${l.last_name}`, description: l.company_name || 'Lead', href: `/${currentOrganization.slug}/crm/leads`, icon: typeIcons.lead, type: 'lead' }))
      ;(companiesRes.data || []).forEach(c => results.push({ id: c.id, label: c.name, description: 'Company', href: `/${currentOrganization.slug}/crm/companies`, icon: typeIcons.company, type: 'company' }))
      ;(contactsRes.data || []).forEach(c => results.push({ id: c.id, label: `${c.first_name} ${c.last_name}`, description: 'Contact', href: `/${currentOrganization.slug}/crm/contacts`, icon: typeIcons.contact, type: 'contact' }))
      ;(dealsRes.data || []).forEach(d => results.push({ id: d.id, label: d.name, description: 'Deal', href: `/${currentOrganization.slug}/crm/pipeline`, icon: typeIcons.deal, type: 'deal' }))
      ;(projectsRes.data || []).forEach(p => results.push({ id: p.id, label: p.name, description: p.description || 'Project', href: `/${currentOrganization.slug}/projects/${p.id}`, icon: typeIcons.project, type: 'project' }))
      ;(tasksRes.data || []).forEach(t => results.push({ id: t.id, label: t.title, description: t.description || 'Task', href: `/${currentOrganization.slug}/projects/${t.project_id}/tasks/${t.id}`, icon: typeIcons.task, type: 'task' }))

      setSearchResults(results)
    } catch { setSearchResults([]) }
    finally { setIsSearching(false) }
  }, [currentOrganization, supabase])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCommandPaletteOpen(!commandPaletteOpen) }
      if (e.key === 'Escape') { setCommandPaletteOpen(false) }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  useEffect(() => {
    if (commandPaletteOpen) { setQuery(''); setSelectedIndex(0); setSearchResults([]); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [commandPaletteOpen])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 200)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const executeCommand = useCallback((href: string) => {
    setCommandPaletteOpen(false)
    router.push(`/${orgSlug}${href}`)
  }, [orgSlug, router, setCommandPaletteOpen])

  const handleSelect = (href: string) => {
    setCommandPaletteOpen(false)
    router.push(href)
  }

  const allItems: { href: string; label: string; icon?: any; category?: string; isCrm?: boolean }[] = [
    ...filteredCommands.map(c => ({ href: c.href, label: c.title, icon: c.icon, category: c.category })),
    ...searchResults.map(r => ({ href: r.href, label: r.label, icon: r.icon, category: r.type, isCrm: true })),
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = allItems.length
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, total - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && allItems[selectedIndex]) { e.preventDefault(); handleSelect(allItems[selectedIndex].href) }
  }

  if (!commandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCommandPaletteOpen(false)} />
      <div className={cn('fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-xl', isMobile && 'top-0 max-w-full h-full')}>
        <div className={cn('overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950', isMobile && 'rounded-none h-full')}>
          <div className="flex items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
            <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search commands or CRM data..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent px-3 py-4 text-sm outline-none placeholder:text-zinc-400"
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-zinc-400 mr-2" />}
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-400 dark:border-zinc-700">ESC</kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {allItems.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-zinc-500">
                {query.length >= 2 ? 'No results found' : 'Type to search commands or CRM data'}
              </div>
            )}

            {(() => {
              const categories = new Map<string, typeof allItems>()
              allItems.forEach(item => {
                const key = item.isCrm ? (item.category || 'CRM') : (item.category || 'General')
                const group = categories.get(key) || []
                group.push(item)
                categories.set(key, group)
              })

              let globalIdx = 0
              return Array.from(categories.entries()).map(([category, items]) => (
                <div key={category}>
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{category}</div>
                  {items.map((item) => {
                    const idx = globalIdx++
                    const Icon = item.icon
                    return (
                      <button
                        key={`${category}-${item.label}`}
                        onClick={() => handleSelect(item.href)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                          selectedIndex === idx ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
                        )}
                      >
                        {Icon && (
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', item.isCrm ? 'bg-zinc-100 dark:bg-zinc-800' : '')}>
                            <Icon className="h-4 w-4" />
                          </div>
                        )}
                        <span>{item.label}</span>
                        {item.isCrm && <span className="ml-auto text-[10px] uppercase text-zinc-400 font-medium">{category}</span>}
                      </button>
                    )
                  })}
                </div>
              ))
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
