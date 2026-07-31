'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Users, Building2, UserPlus, Target, FileText, Activity, BookOpen } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { useOrganizationStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  label: string
  description: string
  href: string
  icon: any
  type: 'lead' | 'company' | 'contact' | 'deal' | 'document' | 'knowledge'
}

const typeIcons: Record<string, any> = {
  lead: UserPlus,
  company: Building2,
  contact: Users,
  deal: Target,
  document: FileText,
  knowledge: BookOpen,
}

export function QuickSearch() {
  const router = useRouter()
  const supabase = createClient()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
    }
  }, [commandPaletteOpen])

  const doSearch = useCallback(async (q: string) => {
    if (!currentOrganization || q.length < 2) {
      setResults([])
      return
    }
    setIsSearching(true)
    setSelectedIndex(0)
    try {
      const orgId = currentOrganization.id
      const term = `%${q}%`

      const [leadsRes, companiesRes, contactsRes, dealsRes, docsRes, articlesRes] = await Promise.all([
        supabase.from('crm_leads').select('id, first_name, last_name, company_name, email').eq('organization_id', orgId).is('deleted_at', null).or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`).limit(5),
        supabase.from('crm_companies').select('id, name, industry').eq('organization_id', orgId).is('deleted_at', null).or(`name.ilike.${term},industry.ilike.${term}`).limit(5),
        supabase.from('crm_contacts').select('id, first_name, last_name, email').eq('organization_id', orgId).is('deleted_at', null).or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`).limit(5),
        supabase.from('crm_deals').select('id, name, deal_value').eq('organization_id', orgId).is('deleted_at', null).or(`name.ilike.${term}`).limit(5),
        supabase.from('documents').select('id, title, document_type, status').eq('organization_id', orgId).is('deleted_at', null).or(`title.ilike.${term},content_text.ilike.${term},tags.ilike.${term}`).limit(5),
        supabase.from('knowledge_articles').select('id, title, category').eq('organization_id', orgId).is('deleted_at', null).or(`title.ilike.${term},summary.ilike.${term},content_text.ilike.${term}`).limit(5),
      ])

      const allResults: SearchResult[] = []

      ;(leadsRes.data || []).forEach(l => allResults.push({
        id: l.id, label: `${l.first_name} ${l.last_name}`, description: l.company_name || l.email || 'Lead', href: `/${currentOrganization.slug}/crm/leads`, icon: typeIcons.lead, type: 'lead',
      }))
      ;(companiesRes.data || []).forEach(c => allResults.push({
        id: c.id, label: c.name, description: c.industry || 'Company', href: `/${currentOrganization.slug}/crm/companies`, icon: typeIcons.company, type: 'company',
      }))
      ;(contactsRes.data || []).forEach(c => allResults.push({
        id: c.id, label: `${c.first_name} ${c.last_name}`, description: c.email || 'Contact', href: `/${currentOrganization.slug}/crm/contacts`, icon: typeIcons.contact, type: 'contact',
      }))
      ;(dealsRes.data || []).forEach(d => allResults.push({
        id: d.id, label: d.name, description: `$${Number(d.deal_value).toLocaleString()}`, href: `/${currentOrganization.slug}/crm/pipeline`, icon: typeIcons.deal, type: 'deal',
      }))
      ;(docsRes.data || []).forEach((d: any) => allResults.push({
        id: d.id, label: d.title, description: `${d.document_type}${d.status ? ' · ' + d.status : ''}`, href: `/${currentOrganization.slug}/documents/library`, icon: typeIcons.document, type: 'document',
      }))
      ;(articlesRes.data || []).forEach(a => allResults.push({
        id: a.id, label: a.title, description: a.category || 'Knowledge article', href: `/${currentOrganization.slug}/documents/knowledge`, icon: typeIcons.knowledge, type: 'knowledge',
      }))

      setResults(allResults)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 200)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const handleSelect = (result: SearchResult) => {
    setCommandPaletteOpen(false)
    router.push(result.href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]) }
  }

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="sm:max-w-[550px] top-[15%] translate-y-0 p-0 gap-0">
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
             placeholder="Search leads, companies, contacts, deals, documents..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-0.5">
              {results.map((result, i) => {
                const Icon = result.icon
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      i === selectedIndex ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <Icon className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.label}</p>
                      <p className="text-xs text-zinc-400 truncate">{result.description}</p>
                    </div>
                    <span className="text-[10px] uppercase text-zinc-400 font-medium">{result.type}</span>
                  </button>
                )
              })}
            </div>
          ) : query.length >= 2 && !isSearching ? (
            <p className="text-sm text-zinc-400 py-6 text-center">No results found</p>
          ) : query.length < 2 && !isSearching ? (
            <div className="py-4 px-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Quick Navigation</p>
              {[
                { label: 'Dashboard', href: '/dashboard', icon: Activity },
                { label: 'Leads', href: '/crm/leads', icon: UserPlus },
                { label: 'Companies', href: '/crm/companies', icon: Building2 },
                { label: 'Contacts', href: '/crm/contacts', icon: Users },
                { label: 'Documents', href: '/documents/dashboard', icon: FileText },
              ].map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => { setCommandPaletteOpen(false); router.push(`/${currentOrganization?.slug}${item.href}`) }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-zinc-400" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
