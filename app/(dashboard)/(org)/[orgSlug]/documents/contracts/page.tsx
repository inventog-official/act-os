'use client'

import { useState, useEffect, use, useMemo, useCallback } from 'react'
import { Search, Plus, FileSignature, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DocumentsShell } from '@/components/documents/documents-shell'
import { useOrganizationStore } from '@/lib/store'
import { getContracts, getExpiringContracts, deleteContract } from '@/lib/actions/documents'
import { ContractDialog } from './contract-dialog'

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  expiring: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  renewed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  cancelled: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  terminated: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

export default function ContractsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [contracts, setContracts] = useState<any[]>([])
  const [expiring, setExpiring] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [c, e] = await Promise.all([
      getContracts(currentOrganization.id).catch(() => []),
      getExpiringContracts(currentOrganization.id, 60).catch(() => []),
    ])
    setContracts(c)
    setExpiring(e)
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const expiringIds = useMemo(() => new Set(expiring.map((e) => e.id)), [expiring])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contracts.filter((c) => {
      const matchesSearch = !q || c.name?.toLowerCase().includes(q) || c.contract_number?.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [contracts, search, statusFilter])

  const handleSave = async () => {
    setDialogOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!currentOrganization?.id) return
    await deleteContract(currentOrganization.id, id).catch(() => {})
    load()
  }

  const formatMoney = (v: any) => {
    if (!v) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(v))
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
              <h1 className="text-2xl font-semibold">Contracts</h1>
              <p className="text-sm text-zinc-500 mt-1">Customer, vendor, and project contracts</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Contract
            </Button>
          </div>

          {expiring.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              <strong>{expiring.length}</strong> contract{expiring.length > 1 ? 's are' : ' is'} expiring soon: {expiring.map((e) => e.name).join(', ')}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input placeholder="Search contracts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
              <option value="renewed">Renewed</option>
              <option value="cancelled">Cancelled</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          <FileSignature className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{c.name}</h3>
                            {expiringIds.has(c.id) && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Expiring</Badge>}
                          </div>
                          <p className="text-xs text-zinc-500">{c.contract_number || '—'} · {formatMoney(c.value)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-zinc-500">Ends</p>
                          <p className="text-sm font-medium">{c.end_date || '—'}</p>
                        </div>
                        <Badge className={statusColors[c.status] || 'bg-zinc-100 text-zinc-700'}>{c.status}</Badge>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(c.id)}>
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
                <FileSignature className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">No contracts found</p>
              </CardContent>
            </Card>
          )}
        </div>

        <ContractDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} />
      </DocumentsShell>
    </DashboardShell>
  )
}