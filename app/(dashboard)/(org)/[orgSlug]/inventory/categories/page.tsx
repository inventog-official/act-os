'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Folder, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { InventoryShell } from '@/components/inventory/inventory-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { createProductCategory, updateProductCategory, deleteProductCategory } from '@/lib/actions/finance'

export default function CategoriesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', parentId: 'none' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const res = await supabase.from('finance_product_categories').select('*').eq('organization_id', currentOrganization.id).is('deleted_at', null).order('name')
      setCategories(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const roots = categories.filter(c => !c.parent_id)
  const childrenOf = (parentId: string) => categories.filter(c => c.parent_id === parentId)
  const productCount = async (categoryId: string) => {
    const res = await supabase.from('finance_products').select('id', { count: 'exact', head: true }).eq('category_id', categoryId).eq('organization_id', currentOrganization!.id)
    return res.count ?? 0
  }

  const openEdit = (cat: any) => {
    setEditingId(cat.id)
    setForm({ name: cat.name || '', description: cat.description || '', parentId: cat.parent_id || 'none' })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentOrganization || !form.name) return
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        parentId: form.parentId === 'none' ? null : form.parentId,
      }
      if (editingId) {
        await updateProductCategory(editingId, payload)
      } else {
        await createProductCategory({ ...payload, organizationId: currentOrganization.id })
      }
      setDialogOpen(false)
      setEditingId(null)
      setForm({ name: '', description: '', parentId: 'none' })
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
      await deleteProductCategory(deleteId)
      setDeleteId(null)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const renderCategory = (cat: any, depth = 0) => {
    const kids = childrenOf(cat.id)
    return (
      <div key={cat.id}>
        <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50" style={{ marginLeft: depth * 24 }}>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Folder className="h-4 w-4 text-zinc-500" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{cat.name}</p>
            <p className="text-xs text-zinc-500 truncate">{cat.description || '—'}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(cat.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete category?</AlertDialogTitle>
                  <AlertDialogDescription>This will soft-delete &quot;{cat.name}&quot;. Products in this category will not be deleted.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {kids.map(k => renderCategory(k, depth + 1))}
      </div>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Product Categories</h1>
              <p className="text-sm text-zinc-500 mt-1">Organize products into nested categories</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingId(null); setForm({ name: '', description: '', parentId: 'none' }) }}><Plus className="h-4 w-4" /> Add Category</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Electronics" />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Category</Label>
                    <Select value={form.parentId} onValueChange={(v) => setForm({ ...form, parentId: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent (top level)</SelectItem>
                        {categories.filter(c => c.id !== editingId).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.name} className="w-full">{submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Category'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">All Categories</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading categories...</div>
              ) : categories.length === 0 ? (
                <EmptyState icon={Folder} title="No categories yet" description="Create categories to organize your product catalog." />
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {roots.map(c => renderCategory(c))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </InventoryShell>
    </DashboardShell>
  )
}
