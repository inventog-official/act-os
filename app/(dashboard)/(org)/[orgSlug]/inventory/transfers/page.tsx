'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Truck, Package } from 'lucide-react'
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
import { listTransfers, listWarehouses, createTransfer, receiveTransfer } from '@/lib/actions/inventory'
import { listStockItems } from '@/lib/actions/inventory'

const statusBadge = (s: string) => {
  const variants: Record<string, 'default' | 'warning' | 'success' | 'secondary' | 'destructive'> = {
    pending: 'warning', shipped: 'default', received: 'success', cancelled: 'destructive',
  }
  return <Badge variant={variants[s] || 'secondary'}>{s}</Badge>
}

export default function TransfersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [transfers, setTransfers] = useState<any[]>([])
  const [products, setProducts] = useState<Record<string, any>>({})
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ transfer_number: '', product_id: '', warehouse_id: '', destination_warehouse_id: '', quantity: '', notes: '' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [trfRes, prodRes, whs, stock] = await Promise.all([
        listTransfers(currentOrganization.id),
        supabase.from('finance_products').select('id, name, sku').eq('organization_id', currentOrganization.id).is('deleted_at', null),
        listWarehouses(currentOrganization.id),
        listStockItems(currentOrganization.id),
      ])
      const map: Record<string, any> = {}
      for (const p of prodRes.data || []) map[p.id] = p
      setProducts(map)
      setWarehouses(whs ?? [])
      setStockItems(stock ?? [])
      setTransfers(trfRes ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const whName = (id: string) => warehouses.find(w => w.id === id)?.name ?? id.slice(0, 8)
  const availableFor = (productId: string, warehouseId: string) => {
    const item = stockItems.find(s => s.productId === productId && s.warehouseId === warehouseId)
    return item ? Number(item.available_quantity ?? 0) : 0
  }

  const handleSubmit = async () => {
    if (!currentOrganization || !form.product_id || !form.warehouse_id || !form.destination_warehouse_id || !form.quantity) return
    setSubmitting(true)
    try {
      await createTransfer(currentOrganization.id, {
        transfer_number: form.transfer_number,
        product_id: form.product_id,
        warehouse_id: form.warehouse_id,
        destination_warehouse_id: form.destination_warehouse_id,
        quantity: Number(form.quantity),
        notes: form.notes || undefined,
      })
      setDialogOpen(false)
      setForm({ transfer_number: '', product_id: '', warehouse_id: '', destination_warehouse_id: '', quantity: '', notes: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReceive = async (transfer: any) => {
    try {
      await receiveTransfer(currentOrganization!.id, transfer.id)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const generateNumber = () => {
    const n = transfers.length + 1
    return `TRF-2024-${String(n).padStart(3, '0')}`
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Stock Transfers</h1>
              <p className="text-sm text-zinc-500 mt-1">Move stock between warehouses and locations</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm({ transfer_number: generateNumber(), product_id: '', warehouse_id: '', destination_warehouse_id: '', quantity: '', notes: '' })}><Plus className="h-4 w-4" /> Create Transfer</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Stock Transfer</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Transfer Number</Label>
                    <Input value={form.transfer_number} onChange={(e) => setForm({ ...form, transfer_number: e.target.value })} />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Source Warehouse</Label>
                      <Select value={form.warehouse_id} onValueChange={(v) => setForm({ ...form, warehouse_id: v })}>
                        <SelectTrigger><SelectValue placeholder="From" /></SelectTrigger>
                        <SelectContent>
                          {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Destination Warehouse</Label>
                      <Select value={form.destination_warehouse_id} onValueChange={(v) => setForm({ ...form, destination_warehouse_id: v })}>
                        <SelectTrigger><SelectValue placeholder="To" /></SelectTrigger>
                        <SelectContent>
                          {warehouses.filter((w: any) => w.id !== form.warehouse_id).map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                    {form.product_id && form.warehouse_id && (
                      <p className="text-xs text-zinc-500">Available: {availableFor(form.product_id, form.warehouse_id)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.product_id || !form.warehouse_id || !form.destination_warehouse_id || !form.quantity} className="w-full">{submitting ? 'Saving...' : 'Create Transfer'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Transfers</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading transfers...</div>
              ) : transfers.length === 0 ? (
                <EmptyState icon={Truck} title="No transfers yet" description="Move stock between warehouses to track relocation." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['Transfer', 'Product', 'Source', 'Destination', 'Quantity', 'Status', 'Date', 'Action'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((t) => (
                        <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="px-4 py-3 text-sm font-mono">{t.transferNumber || t.id.slice(0, 8)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800"><Package className="h-3.5 w-3.5 text-zinc-500" /></span>
                              <span className="text-sm font-medium">{products[t.productId]?.name ?? t.productId?.slice(0, 8)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{whName(t.warehouseId)}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{t.destinationWarehouseId ? whName(t.destinationWarehouseId) : '—'}</td>
                          <td className="px-4 py-3 text-sm font-semibold">{Number(t.quantity)}</td>
                          <td className="px-4 py-3">{statusBadge(t.status)}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">
                            {t.status !== 'received' && (
                              <Button size="sm" variant="outline" onClick={() => handleReceive(t)}>Receive</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </InventoryShell>
    </DashboardShell>
  )
}
