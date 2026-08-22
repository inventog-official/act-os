'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, FileText, Send, CheckCircle2, XCircle, Pencil } from 'lucide-react'
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
import { listPurchaseRequests, createPurchaseRequest, submitPurchaseRequest, approvePurchaseRequest, cancelPurchaseRequest, updatePurchaseRequest, getPurchaseRequestById } from '@/lib/actions/inventory'
import { searchProducts } from '@/lib/actions/inventory'
import { listSuppliers } from '@/lib/actions/inventory'
import { listUnits } from '@/lib/actions/inventory'

const statusBadge = (s: string) => {
  const variants: Record<string, 'default' | 'warning' | 'success' | 'secondary' | 'destructive'> = {
    draft: 'secondary', pending_review: 'warning', approved: 'success', rejected: 'destructive', cancelled: 'destructive',
  }
  return <Badge variant={variants[s] || 'secondary'}>{s?.replace(/_/g, ' ')}</Badge>
}

export default function PurchaseRequestsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [requests, setRequests] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ request_number: '', title: '', description: '', department_id: '', currency: 'USD', notes: '' })
  const [lines, setLines] = useState([{ product_id: '', description: '', quantity: '', unit_price: '', unit_id: '', preferred_supplier_id: '' }])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({ request_number: '', title: '', description: '', department_id: '', currency: 'USD', notes: '' })
  const [editLines, setEditLines] = useState([{ product_id: '', description: '', quantity: '', unit_price: '', unit_id: '', preferred_supplier_id: '' }])

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [prRes, prodRes, supRes, unitRes, depRes] = await Promise.all([
        listPurchaseRequests(currentOrganization.id),
        searchProducts(currentOrganization.id),
        listSuppliers(currentOrganization.id),
        listUnits(currentOrganization.id),
        supabase.from('hr_departments').select('id, name').eq('organization_id', currentOrganization.id),
      ])
      setRequests(prRes ?? [])
      setProducts(prodRes ?? [])
      setSuppliers(supRes ?? [])
      setUnits(unitRes ?? [])
      setDepartments(depRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const prodName = (id: string) => products.find(p => p.id === id)?.name ?? id.slice(0, 8)
  const unitName = (id: string) => units.find(u => u.id === id)?.symbol ?? ''

  const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const genNumber = () => `PR-2024-${String(requests.length + 1).padStart(3, '0')}`

  const handleSubmit = async () => {
    if (!currentOrganization || !form.title) return
    const validLines = lines.filter(l => l.description && l.quantity)
    if (validLines.length === 0) return
    setSubmitting(true)
    try {
      await createPurchaseRequest(currentOrganization.id, {
        request_number: form.request_number,
        title: form.title,
        description: form.description || undefined,
        department_id: form.department_id || null,
        currency: form.currency,
        notes: form.notes || undefined,
      }, validLines.map(l => ({
        product_id: l.product_id || null,
        description: l.description,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price || 0),
        preferred_supplier_id: l.preferred_supplier_id || null,
      })))
      setDialogOpen(false)
      setForm({ request_number: genNumber(), title: '', description: '', department_id: '', currency: 'USD', notes: '' })
      setLines([{ product_id: '', description: '', quantity: '', unit_price: '', unit_id: '', preferred_supplier_id: '' }])
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitPr = async (id: string) => {
    try { await submitPurchaseRequest(currentOrganization!.id, id); fetchData() } catch (err) { console.error(err) }
  }
  const handleApprove = async (id: string) => {
    try { await approvePurchaseRequest(currentOrganization!.id, id); fetchData() } catch (err) { console.error(err) }
  }
  const handleCancel = async (id: string) => {
    try { await cancelPurchaseRequest(currentOrganization!.id, id); fetchData() } catch (err) { console.error(err) }
  }

  const openEdit = async (r: any) => {
    if (!currentOrganization) return
    try {
      const full = await getPurchaseRequestById(currentOrganization.id, r.id)
      if (!full) return
      setEditingId(r.id)
      setEditForm({
        request_number: full.requestNumber ?? '',
        title: full.title ?? '',
        description: full.description ?? '',
        department_id: full.departmentId ?? '',
        currency: full.currency ?? 'USD',
        notes: full.notes ?? '',
      })
      setEditLines((full.lines ?? []).map((l: any) => ({
        product_id: l.productId ?? '',
        description: l.description ?? '',
        quantity: String(l.quantity ?? ''),
        unit_price: String(l.unitPrice ?? ''),
        unit_id: '',
        preferred_supplier_id: l.preferredSupplierId ?? '',
      })))
      setEditDialogOpen(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = async () => {
    if (!currentOrganization || !editingId || !editForm.title) return
    const validLines = editLines.filter(l => l.description && l.quantity)
    if (validLines.length === 0) return
    setEditSubmitting(true)
    try {
      await updatePurchaseRequest(currentOrganization.id, editingId, {
        request_number: editForm.request_number,
        title: editForm.title,
        description: editForm.description || undefined,
        department_id: editForm.department_id || null,
        currency: editForm.currency,
        notes: editForm.notes || undefined,
      }, validLines.map(l => ({
        product_id: l.product_id || null,
        description: l.description,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price || 0),
        preferred_supplier_id: l.preferred_supplier_id || null,
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
              <h1 className="text-2xl font-semibold">Purchase Requests</h1>
              <p className="text-sm text-zinc-500 mt-1">Request materials, get approvals, convert to purchase orders</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setForm({ request_number: genNumber(), title: '', description: '', department_id: '', currency: 'USD', notes: '' }); setLines([{ product_id: '', description: '', quantity: '', unit_price: '', unit_id: '', preferred_supplier_id: '' }]) }}><Plus className="h-4 w-4" /> New Request</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Purchase Request</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Request Number</Label>
                      <Input value={form.request_number} onChange={(e) => setForm({ ...form, request_number: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={form.department_id || 'none'} onValueChange={(v) => setForm({ ...form, department_id: v === 'none' ? '' : v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No department</SelectItem>
                          {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Q1 License Renewal" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Line Items</Label>
                    {lines.map((line, i) => (
                      <div key={i} className="space-y-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                        <div className="space-y-2">
                          <Label>Product</Label>
                          <Select value={line.product_id || 'none'} onValueChange={(v) => { const nl = [...lines]; nl[i] = { ...nl[i], product_id: v === 'none' ? '' : v }; setLines(nl) }}>
                            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No product</SelectItem>
                              {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input value={line.description} onChange={(e) => { const nl = [...lines]; nl[i] = { ...nl[i], description: e.target.value }; setLines(nl) }} placeholder="What do you need?" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input type="number" value={line.quantity} onChange={(e) => { const nl = [...lines]; nl[i] = { ...nl[i], quantity: e.target.value }; setLines(nl) }} />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <Input type="number" value={line.unit_price} onChange={(e) => { const nl = [...lines]; nl[i] = { ...nl[i], unit_price: e.target.value }; setLines(nl) }} />
                          </div>
                          <div className="space-y-2">
                            <Label>Preferred Supplier</Label>
                            <Select value={line.preferred_supplier_id || 'none'} onValueChange={(v) => { const nl = [...lines]; nl[i] = { ...nl[i], preferred_supplier_id: v === 'none' ? '' : v }; setLines(nl) }}>
                              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Any</SelectItem>
                                {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.supplierCode || s.contactName}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {lines.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setLines(lines.filter((_, j) => j !== i))}>Remove line</Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setLines([...lines, { product_id: '', description: '', quantity: '', unit_price: '', unit_id: '', preferred_supplier_id: '' }])}>
                      <Plus className="h-4 w-4" /> Add line
                    </Button>
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.title} className="w-full">{submitting ? 'Saving...' : 'Create Request'}</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Edit Purchase Request</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={editForm.department_id || 'none'} onValueChange={(v) => setEditForm({ ...editForm, department_id: v === 'none' ? '' : v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No department</SelectItem>
                          {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Line Items</Label>
                    {editLines.map((line, i) => (
                      <div key={i} className="space-y-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                        <div className="space-y-2">
                          <Label>Product</Label>
                          <Select value={line.product_id || 'none'} onValueChange={(v) => { const nl = [...editLines]; nl[i] = { ...nl[i], product_id: v === 'none' ? '' : v }; setEditLines(nl) }}>
                            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No product</SelectItem>
                              {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input value={line.description} onChange={(e) => { const nl = [...editLines]; nl[i] = { ...nl[i], description: e.target.value }; setEditLines(nl) }} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input type="number" value={line.quantity} onChange={(e) => { const nl = [...editLines]; nl[i] = { ...nl[i], quantity: e.target.value }; setEditLines(nl) }} />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <Input type="number" value={line.unit_price} onChange={(e) => { const nl = [...editLines]; nl[i] = { ...nl[i], unit_price: e.target.value }; setEditLines(nl) }} />
                          </div>
                          <div className="space-y-2">
                            <Label>Preferred Supplier</Label>
                            <Select value={line.preferred_supplier_id || 'none'} onValueChange={(v) => { const nl = [...editLines]; nl[i] = { ...nl[i], preferred_supplier_id: v === 'none' ? '' : v }; setEditLines(nl) }}>
                              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Any</SelectItem>
                                {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.supplierCode || s.contactName}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {editLines.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setEditLines(editLines.filter((_, j) => j !== i))}>Remove line</Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setEditLines([...editLines, { product_id: '', description: '', quantity: '', unit_price: '', unit_id: '', preferred_supplier_id: '' }])}>
                      <Plus className="h-4 w-4" /> Add line
                    </Button>
                  </div>
                  <Button onClick={handleEdit} disabled={editSubmitting || !editForm.title} className="w-full">{editSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-3">
              <CardTitle className="text-base">Requests</CardTitle>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading requests...</div>
              ) : paged.length === 0 ? (
                <EmptyState icon={FileText} title="No purchase requests" description="Create a request for the materials your team needs." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['Request', 'Title', 'Status', 'Total', 'Date', 'Action'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((r) => (
                        <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="px-4 py-3 text-sm font-mono">{r.requestNumber}</td>
                          <td className="px-4 py-3 text-sm font-medium">{r.title}</td>
                          <td className="px-4 py-3">{statusBadge(r.status)}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(Number(r.totalAmount))}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {r.status === 'draft' && (
                                <Button size="sm" variant="outline" onClick={() => handleSubmitPr(r.id)}><Send className="h-3.5 w-3.5" /> Submit</Button>
                              )}
                              {r.status === 'pending_review' && (
                                <Button size="sm" variant="default" onClick={() => handleApprove(r.id)}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button>
                              )}
                              {['draft', 'pending_review'].includes(r.status) && (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)} title="Edit request"><Pencil className="h-3.5 w-3.5" /></Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleCancel(r.id)} title="Cancel request"><XCircle className="h-3.5 w-3.5 text-zinc-400" /></Button>
                                </>
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