'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, Pencil, Trash2, Receipt } from 'lucide-react'
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
import { formatDate, formatCurrency } from '@/lib/utils'
import { createExpense, updateExpense, deleteExpense } from '@/lib/actions/finance'

export default function ExpensesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()

  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

  const defaultForm = {
    title: '',
    categoryId: '',
    vendor: '',
    projectId: '',
    amount: '',
    currency: 'USD',
    taxAmount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: '',
    billable: false,
  }
  const [form, setForm] = useState(defaultForm)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [expensesRes, categoriesRes, projectsRes] = await Promise.all([
        supabase
          .from('finance_expenses')
          .select('*, category:category_id(*)')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('expense_date', { ascending: false }),
        supabase
          .from('finance_expense_categories')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('projects')
          .select('id, name')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('name'),
      ])
      setExpenses(expensesRes.data || [])
      setCategories(categoriesRes.data || [])
      setProjects(projectsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = expenses.filter(e => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!e.title?.toLowerCase().includes(q) && !e.vendor?.toLowerCase().includes(q)) return false
    }
    if (categoryFilter !== 'all' && e.category_id !== categoryFilter) return false
    if (dateRange.from && e.expense_date < dateRange.from) return false
    if (dateRange.to && e.expense_date > dateRange.to) return false
    return true
  })

  const openEdit = (expense: any) => {
    setEditingId(expense.id)
    setForm({
      title: expense.title || '',
      categoryId: expense.category_id || '',
      vendor: expense.vendor || '',
      projectId: expense.project_id || '',
      amount: String(Number(expense.amount) || ''),
      currency: expense.currency || 'USD',
      taxAmount: expense.tax_amount ? String(Number(expense.tax_amount)) : '',
      expenseDate: expense.expense_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      notes: expense.notes || '',
      billable: expense.billable || false,
    })
    setReceiptUrl(expense.receipt_url || null)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!currentOrganization || !form.title || !form.amount) return
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        categoryId: form.categoryId || null,
        vendor: form.vendor || null,
        projectId: form.projectId || null,
        amount: Number(form.amount),
        currency: form.currency,
        taxAmount: form.taxAmount ? Number(form.taxAmount) : undefined,
        expenseDate: form.expenseDate,
        receiptUrl: receiptUrl,
        notes: form.notes || null,
        billable: form.billable,
      }

      if (editingId) {
        await updateExpense(editingId, payload)
      } else {
        await createExpense({ ...payload, organizationId: currentOrganization.id })
      }

      setDialogOpen(false)
      setEditingId(null)
      setForm(defaultForm)
      setReceiptUrl(null)
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
      await deleteExpense(deleteId)
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
              <h1 className="text-2xl font-semibold">Expenses</h1>
              <p className="text-sm text-zinc-500 mt-1">Track and manage business expenses</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(defaultForm); setReceiptUrl(null) }}}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Input
                      label="Title *"
                      placeholder="Expense title"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>
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
                    label="Vendor"
                    placeholder="Vendor name"
                    value={form.vendor}
                    onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                  />
                  <Input
                    label="Amount *"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  />
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    label="Tax Amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.taxAmount}
                    onChange={e => setForm(f => ({ ...f, taxAmount: e.target.value }))}
                  />
                  <Input
                    label="Date"
                    type="date"
                    value={form.expenseDate}
                    onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                  />
                  <Input
                    label="Notes"
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="col-span-2"
                  />
                  <div className="col-span-2 space-y-1.5">
                    <Label>Receipt</Label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const objectUrl = URL.createObjectURL(file)
                          setReceiptUrl(objectUrl)
                        }
                      }}
                    />
                    {receiptUrl && <p className="text-xs text-emerald-500">Receipt uploaded</p>}
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <Switch
                      id="billable"
                      checked={form.billable}
                      onCheckedChange={v => setForm(f => ({ ...f, billable: v }))}
                    />
                    <Label htmlFor="billable">Billable</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSubmit} disabled={submitting || !form.title || !form.amount}>
                    {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    {editingId ? 'Update' : 'Create'} Expense
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))}
              className="w-[150px]"
            />
            <Input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))}
              className="w-[150px]"
            />
          </div>

          {filtered.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Vendor</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Tax</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Project</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Billable</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => (
                      <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-3 text-sm">{formatDate(e.expense_date)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{e.title}</td>
                        <td className="px-4 py-3 text-sm">{e.category?.name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{e.vendor || '—'}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(e.amount))}</td>
                        <td className="px-4 py-3 text-sm text-right">{e.tax_amount ? formatCurrency(Number(e.tax_amount)) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{e.project_id ? e.project_id.slice(0, 8) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {e.billable ? <Badge variant="success" className="text-[10px]">Yes</Badge> : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(e)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={deleteId === e.id} onOpenChange={o => !o && setDeleteId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(e.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Expense</AlertDialogTitle>
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
            <EmptyState icon={Receipt} title="No expenses found" description="Add your first expense to start tracking." />
          )}
        </div>
      </FinanceShell>
    </DashboardShell>
  )
}
