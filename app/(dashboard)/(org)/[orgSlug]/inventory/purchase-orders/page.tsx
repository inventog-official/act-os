'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, ShoppingCart, Send, CheckCircle2, Pencil, XCircle } from 'lucide-react'
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
import { listPurchaseOrders, createPurchaseOrder, sendPurchaseOrder, approvePurchaseOrder, cancelPurchaseOrder, updatePurchaseOrder, listPurchaseOrderLines } from '@/lib/actions/inventory'
import { searchProducts, listSuppliers, listWarehouses } from '@/lib/actions/inventory'

const statusBadge = (s: string) => {
  const variants: Record<string, 'default' | 'warning' | 'success' | 'secondary' | 'destructive' | 'info'> = {
    draft: 'secondary', pending_approval: 'warning', approved: 'default', sent: 'info', partially_received: 'warning', received: 'success', cancelled: 'destructive', closed: 'secondary',
  }
  return <Badge variant={variants[s] || 'secondary'}>{s?.replace(/_/g, ' ')}</Badge>
}

export default function PurchaseOrdersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ po_number: '', supplier_id: '', currency: 'USD', expected_delivery: '', terms: '', notes: '' })
  const [lines, setLines] = useState([{ product_id: '', description: '', quantity: '', unit_price: '' }])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({ po_number: '', supplier_id: '', currency: 'USD', expected_delivery: '', terms: '', notes: '' })
  const [editLines, setEditLines] = useState([{ product_id: '', description: '', quantity: '', unit_price: '' }])

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [poRes, prodRes, supRes, whRes] = await Promise.all([
        listPurchaseOrders(currentOrganization.id),
        searchProducts(currentOrganization.id),
        listSuppliers(currentOrganization.id),
        listWarehouses(currentOrganization.id),
      ])
      setOrders(poRes ?? [])
      setProducts(prodRes ?? [])
      setSuppliers(supRes ?? [])
      setWarehouses(whRes ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const supplierName = (id: string) => suppliers.find(s => s.id === id)?.supplierCode || suppliers.find(s => s.id === id)?.contactName || id.slice(0, 8)

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const genNumber = () => `PO-2024-${String(orders.length + 1).padStart(4, '0')}`

  const handleSubmit = async () => {
    if (!currentOrganization || !form.supplier_id) return
    const validLines = lines.filter(l => l.product_id && l.quantity)
    if (validLines.length === 0) return
    setSubmitting(true)
    try {
      await createPurchaseOrder(currentOrganization.id, {
        po_number: form.po_number,
        supplier_id: form.supplier_id,
        currency: form.currency,
        subtotal: 0,
        tax_amount: 0,
        shipping_cost: 0,
        discount_amount: 0,
        expected_delivery: form.expected_delivery || null,
        terms: form.terms || undefined,
        notes: form.notes || undefined,
      }, validLines.map(l => ({
        product_id: l.product_id,
        description: l.description || products.find(p => p.id === l.product_id)?.name || '',
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price || 0),
      })))
      setDialogOpen(false)
      setForm({ po_number: genNumber(), supplier_id: '', currency: 'USD', expected_delivery: '', terms: '', notes: '' })
      setLines([{ product_id: '', description: '', quantity: '', unit_price: '' }])
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSend = async (id: string) => {
    try { await sendPurchaseOrder(currentOrganization!.id, id); fetchData() } catch (err) { console.error(err) }
  }

  const handleApprove = async (id: string) => {
    try { await approvePurchaseOrder(currentOrganization!.id, id); fetchData() } catch (err) { console.error(err) }
  }

  const handleCancel = async (id: string) => {
    try { await cancelPurchaseOrder(currentOrganization!.id, id); fetchData() } catch (err) { console.error(err) }
  }

  const openEdit = async (o: any) => {
    if (!currentOrganization) return
    try {
      const poLines = await listPurchaseOrderLines(currentOrganization.id, o.id).catch(() => [])
      setEditingId(o.id)
      setEditForm({
        po_number: o.poNumber ?? '',
        supplier_id: o.supplierId ?? '',
        currency: o.currency ?? 'USD',
        expected_delivery: o.expectedDelivery ? new Date(o.expectedDelivery).toISOString().slice(0, 10) : '',
        terms: o.terms ?? '',
        notes: o.notes ?? '',
      })
      setEditLines((poLines ?? []).map((l: any) => ({
        product_id: l.productId ?? '',
        description: l.description ?? '',
        quantity: String(l.quantity ?? ''),
        unit_price: String(l.unitPrice ?? ''),
      })))
      setEditDialogOpen(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = async () => {
    if (!currentOrganization || !editingId || !editForm.supplier_id) return
    const validLines = editLines.filter(l => l.product_id && l.quantity)
    if (validLines.length === 0) return
    setEditSubmitting(true)
    try {
      await updatePurchaseOrder(currentOrganization.id, editingId, {
        po_number: editForm.po_number,
        supplier_id: editForm.supplier_id,
        currency: editForm.currency,
        subtotal: 0,
        tax_amount: 0,
        shipping_cost: 0,
        discount_amount: 0,
        expected_delivery: editForm.expected_delivery || null,
        terms: editForm.terms || undefined,
        notes: editForm.notes || undefined,
      }, validLines.map(l => ({
        product_id: l.product_id,
        description: l.description || products.find(p => p.id === l.product_id)?.name || '',
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price || 0),
      })))
      setEditDialogOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setEditSubmitting(false)
    }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Purchase Orders</h1>
              <p className="text-sm text-zinc-500 mt-1">Order goods from your suppliers</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setForm({ po_number: genNumber(), supplier_id: '', currency: 'USD', expected_delivery: '', terms: '', notes: '' }); setLines([{ product_id: '', description: '', quantity: '', unit_price: '' }]) }}><Plus className="h-4 w-4" /> New Purchase Order</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>PO Number</Label>
                      <Input value={form.po_number} onChange={(e) => setForm({ ...form, po_number: e.target.value })} />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expected Delivery</Label>
                      <Input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Line Items</Label>
                    {lines.map((line, i) => (
                      <div key={i} className="space-y-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                        <div className="space-y-2">
                          <Label>Product *</Label>
                          <Select value={line.product_id || 'none'} onValueChange={(v) => {
                            const nl = [...lines]
                            const prod = products.find((p: any) => p.id === v)
                            nl[i] = { ...nl[i], product_id: v === 'none' ? '' : v, description: prod?.name || '' }
                            setLines(nl)
                          }}>
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
                    <Button variant="outline" size="sm" onClick={() => setLines([...lines, { product_id: '', description: '', quantity: '', unit_price: '' }])}>
                      <Plus className="h-4 w-4" /> Add line
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.supplier_id} className="w-full">{submitting ? 'Saving...' : 'Create Purchase Order'}</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Edit Purchase Order</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>PO Number</Label>
                      <Input value={editForm.po_number} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier *</Label>
                      <Select value={editForm.supplier_id} onValueChange={(v) => setEditForm({ ...editForm, supplier_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.supplierCode || s.contactName || s.id.slice(0, 8)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expected Delivery</Label>
                      <Input type="date" value={editForm.expected_delivery} onChange={(e) => setEditForm({ ...editForm, expected_delivery: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Line Items</Label>
                    {editLines.map((line, i) => (
                      <div key={i} className="space-y-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                        <div className="space-y-2">
                          <Label>Product *</Label>
                          <Select value={line.product_id || 'none'} onValueChange={(v) => {
                            const nl = [...editLines]
                            const prod = products.find((p: any) => p.id === v)
                            nl[i] = { ...nl[i], product_id: v === 'none' ? '' : v, description: prod?.name || '' }
                            setEditLines(nl)
                          }}>
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
                            <Input type="number" value={line.quantity} onChange={(e) => { const nl = [...editLines]; nl[i] = { ...nl[i], quantity: e.target.value }; setEditLines(nl) }} />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <Input type="number" value={line.unit_price} onChange={(e) => { const nl = [...editLines]; nl[i] = { ...nl[i], unit_price: e.target.value }; setEditLines(nl) }} />
                          </div>
                        </div>
                        {editLines.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setEditLines(editLines.filter((_, j) => j !== i))}>Remove line</Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setEditLines([...editLines, { product_id: '', description: '', quantity: '', unit_price: '' }])}>
                      <Plus className="h-4 w-4" /> Add line
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Optional" />
                  </div>
                  <Button onClick={handleEdit} disabled={editSubmitting || !editForm.supplier_id} className="w-full">{editSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-3">
              <CardTitle className="text-base">Purchase Orders</CardTitle>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="partially_received">Partially Received</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading purchase orders...</div>
              ) : paged.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="No purchase orders" description="Create a purchase order to send to your suppliers." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['PO Number', 'Supplier', 'Status', 'Total', 'Expected Delivery', 'Date', 'Action'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((o) => (
                        <tr key={o.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="px-4 py-3 text-sm font-mono">{o.poNumber}</td>
                          <td className="px-4 py-3 text-sm font-medium">{supplierName(o.supplierId)}</td>
                          <td className="px-4 py-3">{statusBadge(o.status)}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(Number(o.totalAmount))}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {o.status === 'draft' && (
                                <Button size="sm" variant="default" onClick={() => handleApprove(o.id)}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button>
                              )}
                              {['draft', 'approved'].includes(o.status) && (
                                <Button size="sm" variant="outline" onClick={() => handleSend(o.id)}><Send className="h-3.5 w-3.5" /> Send</Button>
                              )}
                              {o.status === 'draft' && (
                                <Button size="sm" variant="ghost" onClick={() => openEdit(o)} title="Edit order"><Pencil className="h-3.5 w-3.5" /></Button>
                              )}
                              {['draft', 'approved', 'sent'].includes(o.status) && (
                                <Button size="sm" variant="ghost" onClick={() => handleCancel(o.id)} title="Cancel order"><XCircle className="h-3.5 w-3.5 text-zinc-400" /></Button>
                              )}
                            </div>
                          </td>
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