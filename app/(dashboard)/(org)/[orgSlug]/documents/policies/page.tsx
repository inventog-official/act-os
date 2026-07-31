'use client'

import { useState, useEffect, use, useMemo, useCallback } from 'react'
import { Search, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getPolicies, deletePolicy } from '@/lib/actions/documents'
import { PolicyDialog } from './policy-dialog'

const typeLabels: Record<string, string> = {
  company: 'Company', hr: 'HR', finance: 'Finance', security: 'Security', it: 'IT', department: 'Department',
}

const typeColors: Record<string, string> = {
  company: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  hr: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
  finance: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  security: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  it: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  department: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
}

export default function PoliciesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    setPolicies(await getPolicies(currentOrganization.id).catch(() => []))
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return policies.filter((p) => {
      const matchesSearch = !q || p.title?.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || p.policy_type === typeFilter
      return matchesSearch && matchesType
    })
  }, [policies, search, typeFilter])

  const handleSave = async () => {
    setDialogOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!currentOrganization?.id) return
    await deletePolicy(currentOrganization.id, id).catch(() => {})
    load()
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <DocumentsShell orgSlug={orgSlug}>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
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
              <h1 className="text-2xl font-semibold">Policies</h1>
              <p className="text-sm text-zinc-500 mt-1">Company policies and compliance documents</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Policy
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input placeholder="Search policies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <option value="all">All types</option>
              {Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <Card key={p.id} className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[p.policy_type] || 'bg-zinc-100 text-zinc-700'}`}>
                        <ShieldAlert className="h-3 w-3 mr-1" /> {typeLabels[p.policy_type] || p.policy_type}
                      </span>
                      <Badge variant={p.approval_status === 'published' ? 'default' : 'outline'}>{p.approval_status}</Badge>
                    </div>
                    <h3 className="mt-3 font-medium leading-snug line-clamp-2">{p.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{p.summary || '—'}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">v{p.version ?? 1}</span>
                      <div className="flex items-center gap-1">
                        {p.effective_date && <span className="text-xs text-zinc-500">Effective {p.effective_date}</span>}
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ShieldAlert className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">No policies found</p>
              </CardContent>
            </Card>
          )}
        </div>

        <PolicyDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} />
      </DocumentsShell>
    </DashboardShell>
  )
}