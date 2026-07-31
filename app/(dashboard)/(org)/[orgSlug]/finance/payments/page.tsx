'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, Trash2, CreditCard } from 'lucide-react'
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
import { formatDate, formatCurrency } from '@/lib/utils'
import { recordPayment, deletePayment } from '@/lib/actions/finance'

const statusBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'destructive' | 'info'> = {
    completed: 'success',
    pending: 'warning',
    failed: 'destructive',
    refunded: 'info',
  }
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
}

export default function PaymentsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()

  const [payments, setPayments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMethodId: '',
    transactionReference: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [paymentsRes, invoicesRes, methodsRes] = await Promise.all([
        supabase
          .from('finance_payments')
          .select('*, payment_method:payment_method_id(*)')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('payment_date', { ascending: false }),
        supabase
          .from('finance_invoices')
          .select('id, invoice_number, client_name, total, status')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .in('status', ['sent', 'partial', 'overdue', 'paid'])
          .order('created_at', { ascending: false }),
        supabase
          .from('finance_payment_methods')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .is('deleted_at', null)
          .order('name'),
      ])
      setPayments(paymentsRes.data || [])
      setInvoices(invoicesRes.data || [])
      setPaymentMethods(methodsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = payments.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchRef = p.transaction_reference?.toLowerCase().includes(q)
      const matchNotes = p.notes?.toLowerCase().includes(q)
      const matchInvoice = p.invoice_id?.toLowerCase().includes(q)
      if (!matchRef && !matchNotes && !matchInvoice) return false
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (dateRange.from && p.payment_date < dateRange.from) return false
    if (dateRange.to && p.payment_date > dateRange.to) return false
    return true
  })

  const handleSubmit = async () => {
    if (!currentOrganization || !form.amount) return
    setSubmitting(true)
    try {
      await recordPayment({
        invoiceId: form.invoiceId || null,
        amount: Number(form.amount),
        paymentMethodId: form.paymentMethodId || null,
        transactionReference: form.transactionReference || null,
        paymentDate: form.paymentDate,
        notes: form.notes || null,
        organizationId: currentOrganization.id,
      })
      setDialogOpen(false)
      setForm({
        invoiceId: '', amount: '', paymentMethodId: '', transactionReference: '',
        paymentDate: new Date().toISOString().slice(0, 10), notes: '',
      })
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
      await deletePayment(deleteId)
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
              <h1 className="text-2xl font-semibold">Payments</h1>
              <p className="text-sm text-zinc-500 mt-1">Record and track incoming payments</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Invoice</Label>
                    <Select value={form.invoiceId} onValueChange={v => setForm(f => ({ ...f, invoiceId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select invoice (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No invoice</SelectItem>
                        {invoices.map(inv => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.invoice_number} — {inv.client_name} ({formatCurrency(Number(inv.total))})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    label="Amount *"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  />
                  <div className="space-y-1.5">
                    <Label>Payment Method</Label>
                    <Select value={form.paymentMethodId} onValueChange={v => setForm(f => ({ ...f, paymentMethodId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    label="Transaction Reference"
                    placeholder="e.g. check #, transaction ID"
                    value={form.transactionReference}
                    onChange={e => setForm(f => ({ ...f, transactionReference: e.target.value }))}
                  />
                  <Input
                    label="Payment Date"
                    type="date"
                    value={form.paymentDate}
                    onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                  />
                  <Input
                    label="Notes"
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={submitting || !form.amount}>
                      {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Record Payment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Invoice #</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Payment Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Transaction Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Notes</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-3 text-sm">{formatDate(p.payment_date)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{p.invoice_id ? p.invoice_id.slice(0, 8) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(p.amount))}</td>
                        <td className="px-4 py-3 text-sm">{p.payment_method?.name || p.payment_method_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{p.transaction_reference || '—'}</td>
                        <td className="px-4 py-3 text-sm">{statusBadge(p.status)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500 max-w-[150px] truncate">{p.notes || '—'}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <AlertDialog open={deleteId === p.id} onOpenChange={o => !o && setDeleteId(null)}>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(p.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                                <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={CreditCard} title="No payments found" description="Record your first payment to get started." />
          )}
        </div>
      </FinanceShell>
    </DashboardShell>
  )
}
