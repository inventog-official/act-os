'use client'

import { useState, useEffect, use, useMemo, useCallback } from 'react'
import { Search, Plus, ListChecks, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getSops, deleteSop } from '@/lib/actions/documents'
import { SopDialog } from './sop-dialog'

export default function SopsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [sops, setSops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    setSops(await getSops(currentOrganization.id).catch(() => []))
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sops.filter((s) => !q || s.title?.toLowerCase().includes(q) || s.purpose?.toLowerCase().includes(q))
  }, [sops, search])

  const handleSave = async () => {
    setDialogOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!currentOrganization?.id) return
    await deleteSop(currentOrganization.id, id).catch(() => {})
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
              <h1 className="text-2xl font-semibold">Standard Operating Procedures</h1>
              <p className="text-sm text-zinc-500 mt-1">Documented repeatable processes</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New SOP
            </Button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input placeholder="Search SOPs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((s) => {
                const steps = (Array.isArray(s.steps) ? s.steps : []).length
                return (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                            <ListChecks className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-medium truncate">{s.title}</h3>
                            <p className="text-xs text-zinc-500 truncate">{s.purpose || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="outline">{s.version ?? 1}</Badge>
                          <span className="hidden md:inline text-xs text-zinc-500">{steps} steps</span>
                          <Badge variant={s.approval_status === 'published' ? 'default' : 'outline'}>{s.approval_status}</Badge>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ListChecks className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">No SOPs found</p>
              </CardContent>
            </Card>
          )}
        </div>

        <SopDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} />
      </DocumentsShell>
    </DashboardShell>
  )
}