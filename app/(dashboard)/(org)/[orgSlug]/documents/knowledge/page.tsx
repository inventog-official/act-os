'use client'

import { useState, useEffect, use, useMemo, useCallback } from 'react'
import { Search, Plus, BookOpen, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getKnowledgeArticles, createKnowledgeArticle } from '@/lib/actions/documents'
import { KnowledgeArticleDialog } from './knowledge-article-dialog'

const categories = ['Company', 'Sales', 'Operations', 'Finance', 'HR', 'Projects', 'Customer Support', 'Engineering', 'Policies', 'General']

const categoryColors: Record<string, string> = {
  Company: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  Sales: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Operations: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Finance: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  HR: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
  Projects: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
  'Customer Support': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Engineering: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Policies: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  General: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

export default function KnowledgePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    setArticles(await getKnowledgeArticles(currentOrganization.id).catch(() => []))
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const q = search.toLowerCase()
      const matchesSearch = !q || a.title?.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q)
      const matchesCategory = category === 'all' || a.category === category
      return matchesSearch && matchesCategory
    })
  }, [articles, search, category])

  const handleSave = async () => {
    setDialogOpen(false)
    load()
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <DocumentsShell orgSlug={orgSlug}>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
              ))}
            </div>
          </div>
        </DocumentsShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <DocumentsShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Knowledge Base</h1>
              <p className="text-sm text-zinc-500 mt-1">Internal knowledge articles and references</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Article
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input placeholder="Search knowledge base..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              <button onClick={() => setCategory('all')} className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${category === 'all' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'}`}>All</button>
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${category === c ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'}`}>{c}</button>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((a) => (
                <Card key={a.id} className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[a.category] || 'bg-zinc-100 text-zinc-700'}`}>{a.category}</span>
                      <Badge variant={a.status === 'published' ? 'default' : 'outline'}>{a.status}</Badge>
                    </div>
                    <h3 className="mt-3 font-medium leading-snug line-clamp-2">{a.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-3">{a.summary || a.content_text || '—'}</p>
                    {a.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.tags.slice(0, 4).map((t: string) => (
                          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            <BookOpen className="h-3 w-3" /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">No articles found</p>
              </CardContent>
            </Card>
          )}
        </div>

        <KnowledgeArticleDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} />
      </DocumentsShell>
    </DashboardShell>
  )
}