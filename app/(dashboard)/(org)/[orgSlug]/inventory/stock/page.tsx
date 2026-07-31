'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Search, Boxes, Package, Warehouse, Settings2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'
import { listStockItems, listWarehouses, createAdjustment, reserveStock, releaseStock } from '@/lib/actions/inventory'

type StockAction = { item: any; type: 'adjust' | 'reserve' | 'release' } | null

export default function StockPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [stock, setStock] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [action, setAction] = useState<StockAction>(null)
  const [actionQty, setActionQty] = useState('')
  const [actionDirection, setActionDirection] = useState<'increase' | 'decrease'>('increase')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [stockRes, whs, prodRes] = await Promise.all([
        listStockItems(currentOrganization.id),
        listWarehouses(currentOrganization.id),
        supabase.from('finance_products').select('id, name, sku').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      ])
      setStock(stockRes ?? [])
      setWarehouses(whs ?? [])
      const map: Record<string, any> = {}
      for (const p of prodRes.data || []) map[p.id] = p
      setProducts(map)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const whName = (id: string) => warehouses.find(w => w.id === id)?.name ?? id.slice(0, 8)

  const filtered = stock.filter(s => {
    const p = products[s.product_id]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!p?.name?.toLowerCase().includes(q) && !p?.sku?.toLowerCase().includes(q) && !s.sku?.toLowerCase().includes(q)) return false
    }
    if (warehouseFilter !== 'all' && s.warehouse_id !== warehouseFilter) return false
    if (lowStockOnly && Number(s.available_quantity ?? 0) > Number(s.reorder_point ?? 0)) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const totals = stock.reduce((acc, s) => ({
    qty: acc.qty + Number(s.available_quantity ?? 0),
    value: acc.value + Number(s.available_quantity ?? 0) * Number(s.unit_cost ?? 0),
  }), { qty: 0, value: 0 })

  const openAction = (item: any, type: NonNullable<StockAction>['type']) => {
    setAction({ item, type })
    setActionQty('')
    setActionDirection('increase')
    setError(null)
  }

  const handleAction = async () => {
    if (!currentOrganization || !action) return
    const qty = Number(actionQty)
    if (!qty || qty <= 0) { setError('Enter a positive quantity'); return }
    setSubmitting(true)
    setError(null)
    try {
      if (action.type === 'adjust') {
        const change = actionDirection === 'decrease' ? -qty : qty
        await createAdjustment(currentOrganization.id, {
          adjustment_number: `ADJ-${Date.now()}`,
          product_id: action.item.product_id,
          warehouse_id: action.item.warehouse_id,
          quantity_change: change,
          reason: actionDirection === 'decrease' ? 'Stock reduction' : 'Stock increase',
        })
      } else if (action.type === 'reserve') {
        await reserveStock(currentOrganization.id, {
          product_id: action.item.product_id,
          warehouse_id: action.item.warehouse_id,
          quantity: qty,
          reservation_type: 'internal',
          reference_type: 'manual',
          notes: 'Manual reservation from stock page',
        })
      } else {
        await releaseStock(currentOrganization.id, {
          product_id: action.item.product_id,
          warehouse_id: action.item.warehouse_id,
          quantity: qty,
          reservation_type: 'internal',
          reference_type: 'manual',
          notes: 'Manual release from stock page',
        })
      }
      setAction(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Stock Levels</h1>
              <p className="text-sm text-zinc-500 mt-1">Available, reserved, and incoming quantities per product</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{Number(totals.qty).toLocaleString()} units</Badge>
              <Badge variant="outline">{formatCurrency(totals.value)}</Badge>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-3">
              <CardTitle className="text-base">Stock</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input placeholder="Search product or SKU..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }} className="pl-9" />
                </div>
                <Select value={warehouseFilter} onValueChange={(v) => { setWarehouseFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All warehouses</SelectItem>
                    {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant={lowStockOnly ? 'default' : 'outline'} size="sm" onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1) }}>
                  Low stock
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading stock...</div>
              ) : paged.length === 0 ? (
                <EmptyState icon={Boxes} title="No stock found" description="Adjust filters or receive goods to add stock." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['Product', 'SKU', 'Warehouse', 'Available', 'Reserved', 'On Hand', 'Unit Cost', 'Stock Value', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((s) => {
                        const p = products[s.product_id]
                        const available = Number(s.available_quantity ?? 0)
                        const reserved = Number(s.reserved_quantity ?? 0)
                        const onHand = Number(s.quantity_on_hand ?? 0)
                        const reorderPoint = Number(s.reorder_point ?? 0)
                        return (
                          <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800"><Package className="h-3.5 w-3.5 text-zinc-500" /></span>
                                <span className="text-sm font-medium">{p?.name ?? s.product_id.slice(0, 8)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-500 font-mono">{s.sku || p?.sku || '—'}</td>
                            <td className="px-4 py-3 text-sm text-zinc-500">{whName(s.warehouse_id)}</td>
                            <td className="px-4 py-3 text-sm font-semibold">{available}</td>
                            <td className="px-4 py-3 text-sm text-zinc-500">{reserved}</td>
                            <td className="px-4 py-3 text-sm">{onHand}</td>
                            <td className="px-4 py-3 text-sm">{formatCurrency(Number(s.unit_cost))}</td>
                            <td className="px-4 py-3 text-sm">{formatCurrency(Number(s.unit_cost) * available)}</td>
                            <td className="px-4 py-3">
                              {available <= 0 ? <Badge variant="destructive">Out</Badge> : reorderPoint > 0 && available <= reorderPoint ? <Badge variant="warning">Low</Badge> : <Badge variant="success">In stock</Badge>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openAction(s, 'adjust')} title="Adjust stock"><Settings2 className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => openAction(s, 'reserve')} title="Reserve stock" disabled={available <= 0}><ArrowDownToLine className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => openAction(s, 'release')} title="Release stock" disabled={reserved <= 0}><ArrowUpFromLine className="h-3.5 w-3.5" /></Button>
                              </div>
                            </td>
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

        <Dialog open={!!action} onOpenChange={(o) => { if (!o) setAction(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action?.type === 'adjust' ? 'Adjust Stock' : action?.type === 'reserve' ? 'Reserve Stock' : 'Release Stock'}
              </DialogTitle>
            </DialogHeader>
            {action && (
              <div className="space-y-4 py-2">
                <div>
                  <p className="text-sm font-medium">{products[action.item.product_id]?.name ?? action.item.product_id.slice(0, 8)}</p>
                  <p className="text-xs text-zinc-500">
                    Available: {Number(action.item.available_quantity)} · Reserved: {Number(action.item.reserved_quantity)} · On hand: {Number(action.item.quantity_on_hand)}
                  </p>
                </div>
                {action.type === 'adjust' && (
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select value={actionDirection} onValueChange={(v) => setActionDirection(v as 'increase' | 'decrease')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase">Increase (+)</SelectItem>
                        <SelectItem value="decrease">Decrease (−)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input type="number" min="0.001" step="any" value={actionQty} onChange={(e) => setActionQty(e.target.value)} placeholder="0" />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button onClick={handleAction} disabled={submitting} className="w-full">
                  {submitting ? 'Processing...' : action?.type === 'adjust' ? 'Apply Adjustment' : action?.type === 'reserve' ? 'Reserve' : 'Release'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </InventoryShell>
    </DashboardShell>
  )
}