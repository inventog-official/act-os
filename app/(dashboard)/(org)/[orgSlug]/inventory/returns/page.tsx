'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Package } from 'lucide-react'
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
import { listStockMovements, listWarehouses, listSuppliers, createPurchaseReturn } from '@/lib/actions/inventory'
import { searchProducts } from '@/lib/actions/inventory'

export default function ReturnsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [returns, setReturns] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ return_number: '', supplier_id: '', warehouse_id: '', reason: '', notes: '' })
  const [lines, setLines] = useState([{ product_id: '', quantity: '', unit_price: '', reason: '' }])

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [movRes, supRes, whRes, prodRes] = await Promise.all([
        listStockMovements(currentOrganization.id, { type: 'return', limit: 200 }),
        listSuppliers(currentOrganization.id),
        listWarehouses(currentOrganization.id),
        searchProducts(currentOrganization.id),
      ])
      setSuppliers(supRes ?? [])
      setWarehouses(whRes ?? [])
      setProducts(prodRes ?? [])
      const byRef: Record<string, any> = {}
      for (const m of movRes ?? []) {
        if (m.referenceId) byRef[m.referenceId] = { ...(byRef[m.referenceId] || {}), id: m.referenceId, productId: m.productId, warehouseId: m.warehouseId, quantity: m.quantity, createdAt: m.createdAt, status: 'completed' }
      }
      setReturns(Object.values(byRef))
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const supplierName = (id: string) => suppliers.find(s => s.id === id)?.supplierCode || suppliers.find(s => s.id === id)?.contactName || id.slice(0, 8)
  const prodName = (id: string) => products.find(p => p.id === id)?.name ?? id.slice(0, 8)

  const filtered = returns
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSubmit = async () => {
    if (!currentOrganization || !form.supplier_id || !form.warehouse_id || !form.reason) return
    const validLines = lines.filter(l => l.product_id && l.quantity)
    if (validLines.length === 0) return
    setSubmitting(true)
    try {
      await createPurchaseReturn(currentOrganization.id, {
        return_number: form.return_number,
        supplier_id: form.supplier_id,
        warehouse_id: form.warehouse_id,
        reason: form.reason,
        notes: form.notes || undefined,
        currency: 'USD',
      }, validLines.map(l => ({
        product_id: l.product_id,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price || 0),
        reason: l.reason || undefined,
      })))
      setDialogOpen(false)
      setForm({ return_number: `RET-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`, supplier_id: '', warehouse_id: '', reason: '', notes: '' })
      setLines([{ product_id: '', quantity: '', unit_price: '', reason: '' }])
      fetchData()
    } catch (err) {
      console.error(err)
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
              <h1 className="text-2xl font-semibold">Purchase Returns</h1>
              <p className="text-sm text-zinc-500 mt-1">Return damaged or excess goods to suppliers</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setForm({ return_number: `RET-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`, supplier_id: '', warehouse_id: '', reason: '', notes: '' }); setLines([{ product_id: '', quantity: '', unit_price: '', reason: '' }]) }}><Plus className="h-4 w-4" /> Create Return</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Purchase Return</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Return Number</Label>
                      <Input value={form.return_number} onChange={(e) => setForm({ ...form, return_number: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier *</Label>
                      <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.supplierCode || s.contactName || s.id.slice(0, 8)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Warehouse *</Label>
                    <Select value={form.warehouse_id} onValueChange={(v) => setForm({ ...form, warehouse_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason *</Label>
                    <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Damaged goods, excess stock, wrong item..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Return Lines</Label>
                    {lines.map((line, i) => (
                      <div key={i} className="space-y-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                        <div className="space-y-2">
                          <Label>Product *</Label>
                          <Select value={line.product_id || 'none'} onValueChange={(v) => { const nl = [...lines]; nl[i] = { ...nl[i], product_id: v === 'none' ? '' : v }; setLines(nl) }}>
                            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select product</SelectItem>
                              {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input type="number" value={line.quantity} onChange={(e) => { const nl = [...lines]; nl[i] = { ...nl[i], quantity: e.target.value }; setLines(nl) }} />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <Input type="number" value={line.unit_price} onChange={(e) => { const nl = [...lines]; nl[i] = { ...nl[i], unit_price: e.target.value }; setLines(nl) }} />
                          </div>
                        </div>
                        {lines.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setLines(lines.filter((_, j) => j !== i))}>Remove line</Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setLines([...lines, { product_id: '', quantity: '', unit_price: '', reason: '' }])}>
                      <Plus className="h-4 w-4" /> Add line
                    </Button>
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.supplier_id || !form.warehouse_id || !form.reason} className="w-full">{submitting ? 'Saving...' : 'Create Return'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Returns</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading returns...</div>
              ) : paged.length === 0 ? (
                <EmptyState icon={RefreshCw} title="No returns yet" description="Return damaged or excess goods to your suppliers." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['Return', 'Product', 'Warehouse', 'Quantity', 'Date', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((r) => (
                        <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="px-4 py-3 text-sm font-mono">{r.id.slice(0, 8)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800"><Package className="h-3.5 w-3.5 text-zinc-500" /></span>
                              <span className="text-sm font-medium">{prodName(r.productId)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{r.warehouseId?.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-sm font-semibold">{Number(r.quantity)}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3"><Badge variant="secondary">{r.status}</Badge></td>
                        </tr>
                      ))}
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