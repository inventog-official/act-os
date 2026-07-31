'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Search, Activity, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { InventoryShell } from '@/components/inventory/inventory-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { listStockMovements, listStockItems, listWarehouses, createStockMovement } from '@/lib/actions/inventory'

const typeColor: Record<string, string> = {
  receipt: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  issue: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  adjustment: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  transfer: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  opening_balance: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  return: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  reservation: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  release: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  production: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
}

export default function MovementsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [movements, setMovements] = useState<any[]>([])
  const [products, setProducts] = useState<Record<string, any>>({})
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ movement_type: 'receipt', product_id: '', warehouse_id: '', quantity: '', reason: '', notes: '' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [movRes, prodRes, whs, stock] = await Promise.all([
        listStockMovements(currentOrganization.id, { limit: 200 }),
        supabase.from('finance_products').select('id, name, sku').eq('organization_id', currentOrganization.id).is('deleted_at', null),
        listWarehouses(currentOrganization.id),
        listStockItems(currentOrganization.id),
      ])
      setMovements(movRes ?? [])
      const map: Record<string, any> = {}
      for (const p of prodRes.data || []) map[p.id] = p
      setProducts(map)
      setWarehouses(whs ?? [])
      setStockItems(stock ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = typeFilter === 'all' ? movements : movements.filter(m => m.movement_type === typeFilter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSubmit = async () => {
    if (!currentOrganization || !form.product_id || !form.warehouse_id || !form.quantity) return
    setSubmitting(true)
    try {
      await createStockMovement(currentOrganization.id, {
        movement_type: form.movement_type as any,
        product_id: form.product_id,
        warehouse_id: form.warehouse_id,
        quantity: Number(form.quantity),
        reason: form.reason || undefined,
        notes: form.notes || undefined,
      })
      setDialogOpen(false)
      setForm({ movement_type: 'receipt', product_id: '', warehouse_id: '', quantity: '', reason: '', notes: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const stockItemFor = (productId: string, warehouseId: string) =>
    stockItems.find(s => s.product_id === productId && s.warehouse_id === warehouseId)

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Stock Movements</h1>
              <p className="text-sm text-zinc-500 mt-1">Every inventory change creates an auditable movement</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm({ movement_type: 'receipt', product_id: '', warehouse_id: '', quantity: '', reason: '', notes: '' })}><Plus className="h-4 w-4" /> Record Movement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Movement Type</Label>
                    <Select value={form.movement_type} onValueChange={(v) => setForm({ ...form, movement_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receipt">Receipt (+)</SelectItem>
                        <SelectItem value="issue">Issue (−)</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                        <SelectItem value="return">Return</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="opening_balance">Opening Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {Object.values(products).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Warehouse</Label>
                    <Select value={form.warehouse_id} onValueChange={(v) => setForm({ ...form, warehouse_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. goods received" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.product_id || !form.warehouse_id || !form.quantity} className="w-full">{submitting ? 'Saving...' : 'Record Movement'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-3">
              <CardTitle className="text-base">Movement History</CardTitle>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="receipt">Receipts</SelectItem>
                  <SelectItem value="issue">Issues</SelectItem>
                  <SelectItem value="adjustment">Adjustments</SelectItem>
                  <SelectItem value="transfer">Transfers</SelectItem>
                  <SelectItem value="return">Returns</SelectItem>
                  <SelectItem value="reservation">Reservations</SelectItem>
                  <SelectItem value="opening_balance">Opening balances</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading movements...</div>
              ) : paged.length === 0 ? (
                <EmptyState icon={Activity} title="No movements yet" description="Record a stock movement to start your audit trail." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['Type', 'Product', 'Quantity', 'Warehouse', 'Reason', 'Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((m) => {
                        const p = products[m.product_id]
                        const negative = ['issue', 'return', 'transfer'].includes(m.movement_type)
                        return (
                          <tr key={m.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                            <td className="px-4 py-3">
                              <Badge className={typeColor[m.movement_type] || 'bg-zinc-100 dark:bg-zinc-800'}>{m.movement_type}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{p?.name ?? m.product_id.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex items-center gap-1 font-semibold ${negative ? 'text-red-600' : 'text-emerald-600'}`}>
                                {negative ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                {negative ? '-' : '+'}{Number(m.quantity)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-500">{m.warehouse_id.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-sm text-zinc-500">{m.reason || '—'}</td>
                            <td className="px-4 py-3 text-sm text-zinc-500">{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4">
                <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
              </div>
            </CardContent>
          </Card>
        </div>
      </InventoryShell>
    </DashboardShell>
  )
}
