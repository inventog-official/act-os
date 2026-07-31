'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Package, Copy, Archive } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { InventoryShell } from '@/components/inventory/inventory-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { formatCurrency } from '@/lib/utils'
import { createProduct, updateProduct, deleteProduct, createProductCategory, getProductCategories } from '@/lib/actions/finance'
import { listStockItems } from '@/lib/actions/inventory'

const statusBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
    active: 'success', inactive: 'warning', discontinued: 'destructive',
  }
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
}

const defaultForm = {
  name: '', sku: '', categoryId: '', type: 'product', description: '', unitPrice: '', unit: 'piece', status: 'active',
}

export default function ProductsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', description: '' })
  const [catSubmitting, setCatSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [productsRes, categoriesRes, stock] = await Promise.all([
        supabase.from('finance_products').select('*, category:category_id(*)').eq('organization_id', currentOrganization.id).is('deleted_at', null).order('name'),
        supabase.from('finance_product_categories').select('*').eq('organization_id', currentOrganization.id).is('deleted_at', null).order('name'),
        listStockItems(currentOrganization.id).catch(() => []),
      ])
      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
      setStockItems(stock ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const stockFor = (productId: string) => {
    const items = stockItems.filter((s: any) => s.product_id === productId)
    return {
      qty: items.reduce((a: number, s: any) => a + Number(s.available_quantity ?? 0), 0),
      value: items.reduce((a: number, s: any) => a + Number(s.available_quantity ?? 0) * Number(s.unit_cost ?? 0), 0),
    }
  }

  const filtered = products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!p.name?.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q)) return false
    }
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const openEdit = (product: any) => {
    setEditingId(product.id)
    setForm({
      name: product.name || '', sku: product.sku || '', categoryId: product.category_id || '', type: product.type || 'product',
      description: product.description || '', unitPrice: String(Number(product.unit_price) || ''), unit: product.unit || 'piece', status: product.status || 'active',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentOrganization || !form.name || !form.unitPrice) return
    setSubmitting(true)
    try {
      const payload = {
        name: form.name, sku: form.sku || null, categoryId: form.categoryId || null, type: form.type,
        description: form.description || null, unitPrice: Number(form.unitPrice), unit: form.unit, status: form.status,
        organizationId: currentOrganization.id, workspaceId: (currentOrganization as any).workspace_id ?? null,
      }
      if (editingId) {
        await updateProduct(editingId, payload)
      } else {
        await createProduct(payload)
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
      await deleteProduct(deleteId)
      setDeleteId(null)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDuplicate = async (product: any) => {
    try {
      await createProduct({
        name: `${product.name} (copy)`, sku: product.sku ? `${product.sku}-COPY` : null, categoryId: product.category_id || null,
        type: product.type || 'product', description: product.description || null, unitPrice: Number(product.unit_price || 0),
        unit: product.unit || 'piece', status: 'inactive', organizationId: currentOrganization!.id,
        workspaceId: (currentOrganization as any).workspace_id ?? null,
      })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleArchive = async (product: any) => {
    try {
      await updateProduct(product.id, { status: product.status === 'inactive' ? 'active' : 'inactive' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCategorySubmit = async () => {
    if (!currentOrganization || !catForm.name) return
    setCatSubmitting(true)
    try {
      await createProductCategory({ name: catForm.name, description: catForm.description || null, organizationId: currentOrganization.id })
      setCatDialogOpen(false)
      setCatForm({ name: '', description: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setCatSubmitting(false)
    }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Products</h1>
              <p className="text-sm text-zinc-500 mt-1">Product catalog shared with Finance</p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Plus className="h-4 w-4" /> Category</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Electronics" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} placeholder="Optional" />
                    </div>
                    <Button onClick={handleCategorySubmit} disabled={catSubmitting} className="w-full">{catSubmitting ? 'Saving...' : 'Create Category'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingId(null); setForm(defaultForm) }}><Plus className="h-4 w-4" /> Add Product</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Product Name *</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Starter License" />
                      </div>
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="LIC-STAR" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No category</SelectItem>
                            {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Unit Price *</Label>
                        <Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="piece" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="discontinued">Discontinued</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
                    </div>
                    <Button onClick={handleSubmit} disabled={submitting || !form.name || !form.unitPrice} className="w-full">{submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">All Products</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input placeholder="Search by name or SKU..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }} className="pl-9" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <Tabs value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="product">Products</TabsTrigger>
                    <TabsTrigger value="service">Services</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading products...</div>
              ) : paged.length === 0 ? (
                <EmptyState icon={Package} title="No products found" description="Create your first product to start tracking inventory." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['Product', 'SKU', 'Category', 'Type', 'Stock', 'Unit Price', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((p) => {
                        const stock = stockFor(p.id)
                        return (
                          <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                            <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                            <td className="px-4 py-3 text-sm text-zinc-500">{p.sku || '—'}</td>
                            <td className="px-4 py-3 text-sm">{p.category?.name || '—'}</td>
                            <td className="px-4 py-3 text-sm capitalize">{p.type}</td>
                            <td className="px-4 py-3 text-sm">{stock.qty}<span className="text-zinc-400"> · {formatCurrency(stock.value)}</span></td>
                            <td className="px-4 py-3 text-sm">{formatCurrency(Number(p.unit_price))}</td>
                            <td className="px-4 py-3">{statusBadge(p.status)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(p)}><Copy className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon-sm" onClick={() => handleArchive(p)}><Archive className="h-4 w-4" /></Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete product?</AlertDialogTitle>
                                      <AlertDialogDescription>This will soft-delete &quot;{p.name}&quot;. This action can be reversed.</AlertDialogDescription>
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
