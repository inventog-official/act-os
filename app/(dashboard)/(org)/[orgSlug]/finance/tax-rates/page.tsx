'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, Pencil, Trash2, Percent } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { FinanceShell } from '@/components/finance/finance-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { createTaxRate, updateTaxRate, deleteTaxRate } from '@/lib/actions/finance'

const typeBadge = (type: string) => {
  const variants: Record<string, 'info' | 'warning' | 'secondary'> = {
    gst: 'info',
    vat: 'warning',
    sales_tax: 'secondary',
    custom: 'secondary',
  }
  return <Badge variant={variants[type] || 'secondary'}>{type.replace(/_/g, ' ').toUpperCase()}</Badge>
}

const defaultForm = { name: '', rate: '', type: 'sales_tax', isDefault: false, isCompound: false }

export default function TaxRatesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [taxRates, setTaxRates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState(defaultForm)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const { data } = await supabase
        .from('finance_tax_rates')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('name')
      setTaxRates(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = taxRates.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!t.name?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedTaxRates = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const openEdit = (rate: any) => {
    setEditingId(rate.id)
    setForm({
      name: rate.name || '',
      rate: String(Number(rate.rate) || ''),
      type: rate.type || 'sales_tax',
      isDefault: rate.is_default || false,
      isCompound: rate.is_compound || false,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentOrganization || !form.name || !form.rate) return
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        rate: Number(form.rate),
        type: form.type,
        isDefault: form.isDefault,
        isCompound: form.isCompound,
      }

      if (editingId) {
        await updateTaxRate(editingId, payload)
      } else {
        await createTaxRate({ ...payload, organizationId: currentOrganization.id })
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
      await deleteTaxRate(deleteId)
      setDeleteId(null)
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
              <h1 className="text-2xl font-semibold">Tax Rates</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage tax rates for invoices and products</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(defaultForm) }}}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />Add Tax Rate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    label="Name *"
                    placeholder="e.g. VAT 20%"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <div className="relative">
                    <Input
                      label="Rate *"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.rate}
                      onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                    />
                    <span className="absolute right-3 top-[38px] text-sm text-zinc-400">%</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gst">GST</SelectItem>
                        <SelectItem value="vat">VAT</SelectItem>
                        <SelectItem value="sales_tax">Sales Tax</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="isDefault"
                      checked={form.isDefault}
                      onCheckedChange={v => setForm(f => ({ ...f, isDefault: v }))}
                    />
                    <Label htmlFor="isDefault">Default tax rate</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="isCompound"
                      checked={form.isCompound}
                      onCheckedChange={v => setForm(f => ({ ...f, isCompound: v }))}
                    />
                    <Label htmlFor="isCompound">Compound tax (tax on tax)</Label>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={submitting || !form.name || !form.rate}>
                      {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      {editingId ? 'Update' : 'Create'} Tax Rate
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              placeholder="Search tax rates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          {filtered.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Name</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Type</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Default</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Compound</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTaxRates.map(t => (
                      <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-3 text-sm font-medium">{t.name}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{Number(t.rate)}%</td>
                        <td className="px-4 py-3 text-sm">{typeBadge(t.type)}</td>
                        <td className="px-4 py-3 text-sm text-center">{t.is_default ? <Badge variant="success" className="text-[10px]">Yes</Badge> : '—'}</td>
                        <td className="px-4 py-3 text-sm text-center">{t.is_compound ? <Badge variant="warning" className="text-[10px]">Yes</Badge> : '—'}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={deleteId === t.id} onOpenChange={o => !o && setDeleteId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(t.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Tax Rate</AlertDialogTitle>
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
            <EmptyState icon={Percent} title="No tax rates" description="Add your first tax rate." />
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
        </div>
      </FinanceShell>
    </DashboardShell>
  )
}
