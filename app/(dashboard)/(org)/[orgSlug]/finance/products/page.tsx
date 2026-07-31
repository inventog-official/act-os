'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, Pencil, Trash2, Package, Tags } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { FinanceShell } from '@/components/finance/finance-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { formatCurrency } from '@/lib/utils'
import { createProduct, updateProduct, deleteProduct, createProductCategory } from '@/lib/actions/finance'
import { getProductCategories } from '@/lib/actions/finance'

const typeBadge = (type: string) => {
  const variants: Record<string, 'info' | 'secondary'> = { product: 'info', service: 'secondary' }
  return <Badge variant={variants[type] || 'secondary'}>{type}</Badge>
}

const statusBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'destructive'> = {
    active: 'success', inactive: 'warning', discontinued: 'destructive',
  }
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
}

const defaultForm = {
  name: '', sku: '', categoryId: '', type: 'product', description: '', unitPrice: '', unit: 'piece', taxRateId: '', status: 'active',
}

export default function ProductsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [taxRates, setTaxRates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
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
      const [productsRes, categoriesRes, taxRatesRes] = await Promise.all([
        supabase
          .from('finance_products')
          .select('*, category:category_id(*)')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('finance_product_categories')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('finance_tax_rates')
          .select('id, name, rate')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('name'),
      ])
      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
      setTaxRates(taxRatesRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!p.name?.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q)) return false
    }
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const openEdit = (product: any) => {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      categoryId: product.category_id || '',
      type: product.type || 'product',
      description: product.description || '',
      unitPrice: String(Number(product.unit_price) || ''),
      unit: product.unit || 'piece',
      taxRateId: product.tax_rate_id || '',
      status: product.status || 'active',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentOrganization || !form.name || !form.unitPrice) return
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        sku: form.sku || null,
        categoryId: form.categoryId || null,
        type: form.type,
        description: form.description || null,
        unitPrice: Number(form.unitPrice),
        unit: form.unit,
        taxRateId: form.taxRateId || null,
        status: form.status,
      }

      if (editingId) {
        await updateProduct(editingId, payload)
      } else {
        await createProduct({ ...payload, organizationId: currentOrganization.id })
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

  const handleCatSubmit = async () => {
    if (!currentOrganization || !catForm.name) return
    setCatSubmitting(true)
    try {
      await createProductCategory({
        name: catForm.name,
        description: catForm.description || null,
        organizationId: currentOrganization.id,
      })
      setCatDialogOpen(false)
      setCatForm({ name: '', description: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setCatSubmitting(false)
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
        <Tabs defaultValue="products">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="products">Products & Services</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">Products & Services</h1>
                  <p className="text-sm text-zinc-500 mt-1">Manage your product and service catalog</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(defaultForm) }}}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Input
                          label="Name *"
                          placeholder="Product or service name"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <Input
                        label="SKU"
                        placeholder="Stock keeping unit"
                        value={form.sku}
                        onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                      />
                      <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No category</SelectItem>
                            {categories.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="discontinued">Discontinued</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        label="Unit"
                        placeholder="piece, hour, etc."
                        value={form.unit}
                        onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                      />
                      <Input
                        label="Unit Price *"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.unitPrice}
                        onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                      />
                      <div className="space-y-1.5">
                        <Label>Tax Rate</Label>
                        <Select value={form.taxRateId} onValueChange={v => setForm(f => ({ ...f, taxRateId: v }))}>
                          <SelectTrigger><SelectValue placeholder="No tax" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No tax</SelectItem>
                            {taxRates.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name} ({t.rate}%)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Description"
                          placeholder="Product description"
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <DialogClose asChild>
                        <Button variant="outline" type="button">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleSubmit} disabled={submitting || !form.name || !form.unitPrice}>
                        {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        {editingId ? 'Update' : 'Create'} Product
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filtered.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800">
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Type</th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Unit Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(p => (
                          <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                            <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                            <td className="px-4 py-3 text-sm text-zinc-500">{p.sku || '—'}</td>
                            <td className="px-4 py-3 text-sm">{p.category?.name || '—'}</td>
                            <td className="px-4 py-3 text-sm">{typeBadge(p.type)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(p.unit_price))}</td>
                            <td className="px-4 py-3 text-sm">{statusBadge(p.status)}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog open={deleteId === p.id} onOpenChange={o => !o && setDeleteId(null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(p.id)}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Product</AlertDialogTitle>
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
                <EmptyState icon={Package} title="No products found" description="Add your first product or service." />
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Product Categories</h2>
                  <p className="text-sm text-zinc-500 mt-1">Organize your products into categories</p>
                </div>
                <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Product Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        label="Name *"
                        placeholder="Category name"
                        value={catForm.name}
                        onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                      />
                      <Input
                        label="Description"
                        placeholder="Optional description"
                        value={catForm.description}
                        onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                      />
                      <div className="flex justify-end gap-3 pt-2">
                        <DialogClose asChild>
                          <Button variant="outline" type="button">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleCatSubmit} disabled={catSubmitting || !catForm.name}>
                          {catSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                          Create Category
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {categories.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800">
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(c => (
                          <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                            <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                            <td className="px-4 py-3 text-sm text-zinc-500">{c.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState icon={Tags} title="No categories" description="Create your first product category." />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </FinanceShell>
    </DashboardShell>
  )
}
