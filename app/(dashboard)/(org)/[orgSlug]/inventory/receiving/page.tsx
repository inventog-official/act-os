'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, PackageCheck, Package } from 'lucide-react'
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
import { listPurchaseOrders, receiveGoods } from '@/lib/actions/inventory'
import { listPurchaseOrderLines, listWarehouses, listSuppliers } from '@/lib/actions/inventory'
import { searchProducts } from '@/lib/actions/inventory'

export default function ReceivingPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [orders, setOrders] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ receipt_number: '', po_id: '', warehouse_id: '', supplier_id: '', received_date: '', notes: '' })
  const [lines, setLines] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [poRes, supRes, whRes, prodRes] = await Promise.all([
        listPurchaseOrders(currentOrganization.id),
        listSuppliers(currentOrganization.id),
        listWarehouses(currentOrganization.id),
        searchProducts(currentOrganization.id),
      ])
      setOrders(poRes ?? [])
      setSuppliers(supRes ?? [])
      setWarehouses(whRes ?? [])
      setProducts(prodRes ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const supplierName = (id: string) => suppliers.find(s => s.id === id)?.supplierCode || suppliers.find(s => s.id === id)?.contactName || id.slice(0, 8)
  const whName = (id: string) => warehouses.find(w => w.id === id)?.name ?? id.slice(0, 8)
  const prodName = (id: string) => products.find(p => p.id === id)?.name ?? id.slice(0, 8)

  const openReceive = async (po: any) => {
    setForm({ receipt_number: `GRN-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`, po_id: po.id, warehouse_id: warehouses[0]?.id || '', supplier_id: po.supplierId, received_date: new Date().toISOString().slice(0, 10), notes: '' })
    const poLines = await listPurchaseOrderLines(currentOrganization!.id, po.id).catch(() => [])
    setLines((poLines ?? []).map((l: any) => ({
      po_line_id: l.id,
      product_id: l.productId,
      quantity: Number(l.quantity),
      unit_price: Number(l.unitPrice ?? 0),
      received_quantity: String(Number(l.quantity) - Number(l.receivedQuantity ?? 0)),
      damaged_quantity: '0',
      missing_quantity: '0',
      rejected_quantity: '0',
    })))
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentOrganization || !form.po_id || !form.warehouse_id || !form.supplier_id) return
    const validLines = lines.filter(l => l.product_id && (Number(l.received_quantity) > 0 || Number(l.damaged_quantity || 0) > 0 || Number(l.missing_quantity || 0) > 0 || Number(l.rejected_quantity || 0) > 0))
    if (validLines.length === 0) return
    setSubmitting(true)
    try {
      await receiveGoods(currentOrganization.id, {
        receipt_number: form.receipt_number,
        po_id: form.po_id,
        warehouse_id: form.warehouse_id,
        supplier_id: form.supplier_id,
        received_date: form.received_date,
        currency: 'USD',
        notes: form.notes || undefined,
      }, validLines.map(l => ({
        po_line_id: l.po_line_id || null,
        product_id: l.product_id,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price || 0),
        received_quantity: Number(l.received_quantity),
        damaged_quantity: Number(l.damaged_quantity || 0),
        missing_quantity: Number(l.missing_quantity || 0),
        rejected_quantity: Number(l.rejected_quantity || 0),
        notes: l.notes || undefined,
      })))
      setDialogOpen(false)
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
          <div>
            <h1 className="text-2xl font-semibold">Goods Receiving</h1>
            <p className="text-sm text-zinc-500 mt-1">Receive goods against purchase orders and update stock</p>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Open Purchase Orders</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading purchase orders...</div>
              ) : orders.length === 0 ? (
                <EmptyState icon={PackageCheck} title="No purchase orders" description="Create a purchase order to start receiving goods." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['PO Number', 'Supplier', 'Status', 'Total', 'Delivery', 'Action'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => ['sent', 'partially_received'].includes(o.status)).map((o) => (
                        <tr key={o.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="px-4 py-3 text-sm font-mono">{o.poNumber}</td>
                          <td className="px-4 py-3 text-sm font-medium">{supplierName(o.supplierId)}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{o.status?.replace(/_/g, ' ')}</Badge></td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(Number(o.totalAmount))}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">
                            <Button size="sm" onClick={() => openReceive(o)}><Package className="h-3.5 w-3.5" /> Receive Goods</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Receive Goods</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Receipt Number</Label>
                    <Input value={form.receipt_number} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Received Date</Label>
                    <Input type="date" value={form.received_date} onChange={(e) => setForm({ ...form, received_date: e.target.value })} />
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
                  <Label className="text-base font-medium">Line Items — Receiving Quantities</Label>
                  {lines.length === 0 ? (
                    <p className="text-sm text-zinc-500">No lines found for this purchase order.</p>
                  ) : lines.map((line, i) => (
                    <div key={i} className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{prodName(line.product_id)}</p>
                        <p className="text-xs text-zinc-500">Ordered: {line.quantity} × {formatCurrency(line.unit_price)}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Received *</Label>
                          <Input type="number" value={line.received_quantity} onChange={(e) => { const nl = [...lines]; nl[i] = { ...nl[i], received_quantity: e.target.value }; setLines(nl) }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Damaged</Label>
                          <Input type="number" value={line.damaged_quantity} onChange={(e) => { const nl = [...lines]; nl[i] = { ...nl[i], damaged_quantity: e.target.value }; setLines(nl) }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Missing</Label>
                          <Input type="number" value={line.missing_quantity} onChange={(e) => { const nl = [...lines]; nl[i] = { ...nl[i], missing_quantity: e.target.value }; setLines(nl) }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Rejected</Label>
                          <Input type="number" value={line.rejected_quantity} onChange={(e) => { const nl = [...lines]; nl[i] = { ...nl[i], rejected_quantity: e.target.value }; setLines(nl) }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !form.warehouse_id} className="w-full">{submitting ? 'Recording...' : 'Complete Receipt'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </InventoryShell>
    </DashboardShell>
  )
}