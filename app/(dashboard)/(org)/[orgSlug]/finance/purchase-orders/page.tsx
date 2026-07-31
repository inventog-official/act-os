'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, Eye, Pencil, Trash2, ShoppingCart, CheckCircle, XCircle, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { FinanceShell } from '@/components/finance/finance-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { formatDate, formatCurrency } from '@/lib/utils'
import { createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, approvePurchaseOrder, updatePurchaseOrderStatus } from '@/lib/actions/finance'

const statusBadge = (status: string) => {
  const variants: Record<string, 'secondary' | 'warning' | 'success' | 'info' | 'success' | 'destructive'> = {
    draft: 'secondary',
    pending_approval: 'warning',
    approved: 'success',
    ordered: 'info',
    received: 'success',
    cancelled: 'destructive',
  }
  return <Badge variant={variants[status] || 'secondary'}>{status.replace(/_/g, ' ')}</Badge>
}

const emptyLineItem = { description: '', quantity: '1', unitPrice: '0' }

export default function PurchaseOrdersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [orders, setOrders] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewing, setViewing] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const defaultForm = {
    vendorName: '', vendorEmail: '', vendorPhone: '', projectId: '',
    issueDate: new Date().toISOString().slice(0, 10), deliveryDate: '',
    currency: 'USD', notes: '', terms: '',
    items: [{ ...emptyLineItem }],
  }
  const [form, setForm] = useState(defaultForm)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [ordersRes, projectsRes] = await Promise.all([
        supabase
          .from('finance_purchase_orders')
          .select('*, items:finance_purchase_order_items(*)')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select('id, name')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('name'),
      ])
      setOrders(ordersRes.data || [])
      setProjects(projectsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = orders.filter(o => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!o.vendor_name?.toLowerCase().includes(q) && !o.po_number?.toLowerCase().includes(q)) return false
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedOrders = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const addLineItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyLineItem }] }))
  const removeLineItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  const updateLineItem = (idx: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }))
  }

  const openEdit = (order: any) => {
    setEditingId(order.id)
    setForm({
      vendorName: order.vendor_name || '',
      vendorEmail: order.vendor_email || '',
      vendorPhone: order.vendor_phone || '',
      projectId: order.project_id || '',
      issueDate: order.issue_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      deliveryDate: order.delivery_date?.slice(0, 10) || '',
      currency: order.currency || 'USD',
      notes: order.notes || '',
      terms: order.terms || '',
      items: (order.items || []).length > 0
        ? order.items.map((i: any) => ({
            description: i.description || '',
            quantity: String(Number(i.quantity) || '1'),
            unitPrice: String(Number(i.unit_price) || '0'),
          }))
        : [{ ...emptyLineItem }],
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentOrganization || !form.vendorName) return
    setSubmitting(true)
    try {
      const payload = {
        vendorName: form.vendorName,
        vendorEmail: form.vendorEmail || undefined,
        vendorPhone: form.vendorPhone || undefined,
        projectId: form.projectId || undefined,
        issueDate: form.issueDate,
        deliveryDate: form.deliveryDate || undefined,
        currency: form.currency,
        notes: form.notes || undefined,
        terms: form.terms || undefined,
        items: form.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      }

      if (editingId) {
        await updatePurchaseOrder(editingId, payload)
      } else {
        await createPurchaseOrder({ ...payload, organizationId: currentOrganization.id })
      }

      setDialogOpen(false)
      setEditingId(null)
      setForm(defaultForm)
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deletePurchaseOrder(deleteId)
      setDeleteId(null)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approvePurchaseOrder(id)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <FinanceShell orgSlug={orgSlug}>
          <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
        </FinanceShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <FinanceShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Purchase Orders</h1>
              <p className="text-sm text-zinc-500 mt-1">Create and manage purchase orders</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(defaultForm) }}}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />Create PO
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Vendor Name *"
                      placeholder="Vendor name"
                      value={form.vendorName}
                      onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                    />
                    <Input
                      label="Vendor Email"
                      type="email"
                      placeholder="vendor@example.com"
                      value={form.vendorEmail}
                      onChange={e => setForm(f => ({ ...f, vendorEmail: e.target.value }))}
                    />
                    <Input
                      label="Vendor Phone"
                      placeholder="+1 (555) 000-0000"
                      value={form.vendorPhone}
                      onChange={e => setForm(f => ({ ...f, vendorPhone: e.target.value }))}
                    />
                    <div className="space-y-1.5">
                      <Label>Project</Label>
                      <Select value={form.projectId} onValueChange={v => setForm(f => ({ ...f, projectId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No project</SelectItem>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      label="Issue Date"
                      type="date"
                      value={form.issueDate}
                      onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                    />
                    <Input
                      label="Delivery Date"
                      type="date"
                      value={form.deliveryDate}
                      onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                    />
                    <div className="space-y-1.5">
                      <Label>Currency</Label>
                      <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Terms</Label>
                    <Select value={form.terms} onValueChange={v => setForm(f => ({ ...f, terms: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No terms</SelectItem>
                        <SelectItem value="net_15">Net 15</SelectItem>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="net_60">Net 60</SelectItem>
                        <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Input
                    label="Notes"
                    placeholder="Additional notes"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Line Items</Label>
                      <Button variant="outline" size="sm" onClick={addLineItem}>
                        <Plus className="h-3 w-3 mr-1" />Add Item
                      </Button>
                    </div>
                    {form.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <div className="flex-1 min-w-0">
                          <input
                            placeholder="Description"
                            value={item.description}
                            onChange={e => updateLineItem(idx, 'description', e.target.value)}
                            className="w-full mb-2 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                          />
                          <div className="flex gap-2">
                            <div>
                              <span className="text-xs text-zinc-500">Qty</span>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => updateLineItem(idx, 'quantity', e.target.value)}
                                className="w-20 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                              />
                            </div>
                            <div>
                              <span className="text-xs text-zinc-500">Unit Price</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)}
                                className="w-24 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
                              />
                            </div>
                            <div className="pt-4">
                              <span className="text-sm font-medium">
                                {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                              </span>
                            </div>
                          </div>
                        </div>
                        {form.items.length > 1 && (
                          <Button variant="ghost" size="icon-sm" onClick={() => removeLineItem(idx)} className="shrink-0 mt-1">
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={submitting || !form.vendorName}>
                      {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      {editingId ? 'Update' : 'Create'} PO
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                placeholder="Search POs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">PO #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedOrders.map(o => (
                      <tr key={o.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-3 text-sm font-medium">{o.po_number || o.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-sm">{o.vendor_name}</td>
                        <td className="px-4 py-3 text-sm">{o.issue_date ? formatDate(o.issue_date) : formatDate(o.created_at)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(o.total))}</td>
                        <td className="px-4 py-3 text-sm">{statusBadge(o.status)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => { setViewing(o); setViewDialogOpen(true) }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(o)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => window.open(`/api/finance/pdf/po?id=${o.id}`, '_blank')}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {o.status === 'pending_approval' && (
                              <Button variant="ghost" size="icon-sm" onClick={() => handleApprove(o.id)}>
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              </Button>
                            )}
                            <AlertDialog open={deleteId === o.id} onOpenChange={o2 => !o2 && setDeleteId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(o.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={ShoppingCart} title="No purchase orders" description="Create your first purchase order." />
          )}

          {filtered.length > 0 && (
            <Pagination
              total={filtered.length}
              page={safePage}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}

          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Purchase Order {viewing?.po_number || ''}</DialogTitle>
              </DialogHeader>
              {viewing && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500">Vendor</p>
                      <p className="font-medium">{viewing.vendor_name}</p>
                      {viewing.vendor_email && <p className="text-zinc-500">{viewing.vendor_email}</p>}
                      {viewing.vendor_phone && <p className="text-zinc-500">{viewing.vendor_phone}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500">Status</p>
                      <p>{statusBadge(viewing.status)}</p>
                      <p className="text-zinc-500 mt-1">Issue Date: {viewing.issue_date ? formatDate(viewing.issue_date) : '—'}</p>
                      {viewing.delivery_date && <p className="text-zinc-500">Delivery: {formatDate(viewing.delivery_date)}</p>}
                    </div>
                  </div>
                  {viewing.items?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Line Items</p>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800">
                            <th className="py-1 text-left text-xs font-medium text-zinc-500">Description</th>
                            <th className="py-1 text-right text-xs font-medium text-zinc-500">Qty</th>
                            <th className="py-1 text-right text-xs font-medium text-zinc-500">Unit Price</th>
                            <th className="py-1 text-right text-xs font-medium text-zinc-500">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewing.items.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800/50">
                              <td className="py-1.5">{item.description}</td>
                              <td className="py-1.5 text-right">{item.quantity}</td>
                              <td className="py-1.5 text-right">{formatCurrency(Number(item.unit_price))}</td>
                              <td className="py-1.5 text-right font-medium">{formatCurrency(Number(item.total || item.quantity * item.unit_price))}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="py-1.5 text-right font-medium">Total</td>
                            <td className="py-1.5 text-right font-medium">{formatCurrency(Number(viewing.total))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                  {viewing.notes && (
                    <div>
                      <p className="text-sm text-zinc-500">Notes</p>
                      <p className="text-sm">{viewing.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </FinanceShell>
    </DashboardShell>
  )
}
