'use client'

import { useState, use, useEffect, useCallback } from 'react'
import {
  Plus, Search, MoreHorizontal, FileText, Eye, Pencil, Copy, Send,
  Trash2, Loader2, Banknote, Repeat, Download
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { FinanceShell } from '@/components/finance/finance-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus,
  sendInvoice, duplicateInvoice, processRecurringInvoices, recordPayment
} from '@/lib/actions/finance'

const statusConfig: Record<string, { label: string; variant: string }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'info' },
  paid: { label: 'Paid', variant: 'success' },
  partial: { label: 'Partial', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
  refunded: { label: 'Refunded', variant: 'default' },
}

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN']
const discountTypes = ['none', 'percentage', 'fixed']

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_rate: number
}

interface InvoiceFormData {
  client_name: string
  client_email: string
  client_phone: string
  company_id: string
  deal_id: string
  project_id: string
  quotation_id: string
  issue_date: string
  due_date: string
  currency: string
  discount_type: string
  discount_value: number
  notes: string
  terms: string
  is_recurring: boolean
  recurring_frequency: string
  recurring_next_date: string
  recurring_end_date: string
  items: InvoiceItem[]
}

const emptyItem = (): InvoiceItem => ({
  description: '',
  quantity: 1,
  unit_price: 0,
  discount_percent: 0,
  tax_rate: 0,
})

const defaultForm: InvoiceFormData = {
  client_name: '',
  client_email: '',
  client_phone: '',
  company_id: '',
  deal_id: '',
  project_id: '',
  quotation_id: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  currency: 'USD',
  discount_type: 'none',
  discount_value: 0,
  notes: '',
  terms: '',
  is_recurring: false,
  recurring_frequency: 'monthly',
  recurring_next_date: '',
  recurring_end_date: '',
  items: [emptyItem()],
}

function calcItemTotal(item: InvoiceItem): number {
  const lineTotal = item.quantity * item.unit_price
  const discount = lineTotal * (item.discount_percent / 100)
  const taxable = lineTotal - discount
  const tax = taxable * (item.tax_rate / 100)
  return taxable + tax
}

function calcTotals(items: InvoiceItem[], discountType: string, discountValue: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const itemDiscounts = items.reduce((sum, item) => sum + (item.quantity * item.unit_price) * (item.discount_percent / 100), 0)
  const afterItemDiscounts = subtotal - itemDiscounts
  const globalDiscount = discountType === 'percentage' ? afterItemDiscounts * (discountValue / 100) : discountType === 'fixed' ? discountValue : 0
  const afterDiscount = afterItemDiscounts - globalDiscount
  const tax = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price
    const disc = lineTotal * (item.discount_percent / 100)
    return sum + (lineTotal - disc) * (item.tax_rate / 100)
  }, 0)
  const total = afterDiscount + tax
  return { subtotal, itemDiscounts, globalDiscount, afterDiscount, tax, total }
}

export default function InvoicesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<InvoiceFormData>(defaultForm)

  const [companies, setCompanies] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  const [payDialog, setPayDialog] = useState<{ invoice: any } | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('')
  const [payRef, setPayRef] = useState('')
  const [processingRecurring, setProcessingRecurring] = useState(false)

  const fetchInvoices = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('finance_invoices')
        .select('*, items:finance_invoice_items(*)')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)

      const { data } = await query
      setInvoices(data || [])
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }, [currentOrganization, statusFilter, supabase])

  const fetchReferenceData = useCallback(async () => {
    if (!currentOrganization) return
    const [cmpRes, dlRes, projRes, quoRes] = await Promise.all([
      supabase.from('crm_companies').select('id, name').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      supabase.from('crm_deals').select('id, name').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      supabase.from('projects').select('id, name').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      supabase.from('finance_quotations').select('id, quotation_number, client_name').eq('organization_id', currentOrganization.id).in('status', ['sent', 'accepted']).is('deleted_at', null),
    ])
    setCompanies(cmpRes.data || [])
    setDeals(dlRes.data || [])
    setProjects(projRes.data || [])
    setQuotations(quoRes.data || [])
  }, [currentOrganization, supabase])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])
  useEffect(() => { fetchReferenceData() }, [fetchReferenceData])

  const openCreate = () => {
    setEditingId(null)
    setFormData({ ...defaultForm, issue_date: new Date().toISOString().split('T')[0] })
    setShowDialog(true)
  }

  const openEdit = (inv: any) => {
    setEditingId(inv.id)
    setFormData({
      client_name: inv.client_name || '',
      client_email: inv.client_email || '',
      client_phone: inv.client_phone || '',
      company_id: inv.company_id || '',
      deal_id: inv.deal_id || '',
      project_id: inv.project_id || '',
      quotation_id: inv.quotation_id || '',
      issue_date: inv.issue_date?.split('T')[0] || '',
      due_date: inv.due_date?.split('T')[0] || '',
      currency: inv.currency || 'USD',
      discount_type: inv.discount_type || 'none',
      discount_value: inv.discount_value || 0,
      notes: inv.notes || '',
      terms: inv.terms || '',
      is_recurring: inv.is_recurring || false,
      recurring_frequency: inv.recurring_frequency || 'monthly',
      recurring_next_date: inv.recurring_next_date?.split('T')[0] || '',
      recurring_end_date: inv.recurring_end_date?.split('T')[0] || '',
      items: inv.items?.length ? inv.items.map((i: any) => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount_percent: i.discount_percent || 0,
        tax_rate: i.tax_rate || 0,
      })) : [emptyItem()],
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!currentOrganization || !formData.client_name.trim()) {
      toast.error('Client name is required')
      return
    }
    if (!formData.items.length || !formData.items[0].description.trim()) {
      toast.error('At least one line item with a description is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        organizationId: currentOrganization.id,
        clientName: formData.client_name,
        clientEmail: formData.client_email || null,
        clientPhone: formData.client_phone || null,
        companyId: formData.company_id || null,
        dealId: formData.deal_id || null,
        projectId: formData.project_id || null,
        quotationId: formData.quotation_id || null,
        issueDate: formData.issue_date || new Date().toISOString().split('T')[0],
        dueDate: formData.due_date || new Date().toISOString().split('T')[0],
        currency: formData.currency,
        discountType: formData.discount_type,
        discountValue: formData.discount_value,
        notes: formData.notes || null,
        terms: formData.terms || null,
        isRecurring: formData.is_recurring,
        recurringFrequency: formData.is_recurring ? formData.recurring_frequency : null,
        recurringNextDate: formData.is_recurring ? formData.recurring_next_date || null : null,
        recurringEndDate: formData.is_recurring ? formData.recurring_end_date || null : null,
        items: formData.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          discountPercent: i.discount_percent || 0,
        })),
      }

      if (editingId) {
        await updateInvoice(editingId, payload)
        toast.success('Invoice updated')
      } else {
        await createInvoice(payload)
        toast.success('Invoice created')
      }
      setShowDialog(false)
      fetchInvoices()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice(id)
      toast.success('Invoice deleted')
      fetchInvoices()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateInvoice(id)
      toast.success('Invoice duplicated')
      fetchInvoices()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleSend = async (id: string) => {
    try {
      const res = await sendInvoice(id)
      if (res?.email?.delivered) {
        toast.success('Invoice sent')
      } else if (res?.email?.reason === 'RESEND_API_KEY not configured') {
        toast.success('Invoice marked as sent (email not configured)')
      } else if (res?.email?.reason === 'No client email set') {
        toast.warning('Invoice marked as sent — no client email set')
      } else {
        toast.success('Invoice sent')
      }
      fetchInvoices()
    } catch (err: any) { toast.error(err.message) }
  }

  const openPayDialog = async (inv: any) => {
    setPayDialog({ invoice: inv })
    setPayAmount(String(Number(inv.total) - Number(inv.amount_paid || 0)))
    setPayMethod('')
    setPayRef('')
    if (!paymentMethods.length) {
      const { data } = await supabase
        .from('finance_payment_methods')
        .select('*')
        .order('name')
      setPaymentMethods(data || [])
    }
  }

  const handleRecordPayment = async () => {
    if (!currentOrganization || !payDialog || !payAmount) return
    try {
      await recordPayment({
        invoiceId: payDialog.invoice.id,
        amount: Number(payAmount),
        paymentMethodId: payMethod || null,
        transactionReference: payRef || null,
        organizationId: currentOrganization.id,
      })
      toast.success('Payment recorded')
      setPayDialog(null)
      fetchInvoices()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleProcessRecurring = async () => {
    if (!currentOrganization) return
    setProcessingRecurring(true)
    try {
      const res = await processRecurringInvoices()
      toast.success(res.count > 0 ? `Generated ${res.count} recurring invoice${res.count > 1 ? 's' : ''}` : 'No recurring invoices due')
      fetchInvoices()
    } catch (err: any) { toast.error(err.message) }
    finally { setProcessingRecurring(false) }
  }

  const addItem = () => setFormData(p => ({ ...p, items: [...p.items, emptyItem()] }))

  const removeItem = (idx: number) => {
    if (formData.items.length <= 1) return
    setFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))
  }

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setFormData(p => ({
      ...p,
      items: p.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }))
  }

  const filtered = invoices.filter(inv => {
    if (!searchQuery) return true
    const ql = searchQuery.toLowerCase()
    return (
      (inv.invoice_number || '').toLowerCase().includes(ql) ||
      (inv.client_name || '').toLowerCase().includes(ql) ||
      (inv.client_email || '').toLowerCase().includes(ql)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedInvoices = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const totals = calcTotals(formData.items, formData.discount_type, formData.discount_value)

  return (
    <DashboardShell orgSlug={orgSlug}>
      <FinanceShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Invoices</h1>
              <p className="text-sm text-zinc-500 mt-1">{invoices.length} total</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleProcessRecurring} disabled={processingRecurring}>
              {processingRecurring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
              Process Recurring
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />New Invoice
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={searchQuery || statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
              description={searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first invoice'}
              action={
                !searchQuery && statusFilter === 'all' ? (
                  <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Invoice</Button>
                ) : undefined
              }
            />
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedInvoices.map(inv => {
                    const cfg = statusConfig[inv.status] || statusConfig.draft
                    const paid = inv.amount_paid || 0
                    const balance = (inv.total || 0) - paid
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoice_number || '—'}</TableCell>
                        <TableCell>{inv.client_name || '—'}</TableCell>
                        <TableCell className="text-zinc-500">{inv.issue_date ? formatDate(inv.issue_date) : '—'}</TableCell>
                        <TableCell className="text-zinc-500">{inv.due_date ? formatDate(inv.due_date) : '—'}</TableCell>
                        <TableCell>{formatCurrency(inv.total || 0, inv.currency)}</TableCell>
                        <TableCell>{formatCurrency(paid, inv.currency)}</TableCell>
                        <TableCell className={balance > 0 ? 'text-red-500 font-medium' : 'text-zinc-500'}>
                          {formatCurrency(balance, inv.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant as any}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(inv)}>
                                <Eye className="mr-2 h-4 w-4" />View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(inv)}>
                                <Pencil className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(inv.id)}>
                                <Copy className="mr-2 h-4 w-4" />Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSend(inv.id)}>
                                <Send className="mr-2 h-4 w-4" />Send
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPayDialog(inv)}>
                                <Banknote className="mr-2 h-4 w-4" />Record Payment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => window.open(`/api/finance/pdf/invoice?id=${inv.id}`, '_blank')}>
                                <Download className="mr-2 h-4 w-4" />Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(inv.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && filtered.length > 0 && (
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Create'} Invoice</DialogTitle>
            <DialogDescription>Fill in the invoice details below</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Client Name *" value={formData.client_name} onChange={e => setFormData(p => ({ ...p, client_name: e.target.value }))} />
                <Input label="Client Email" type="email" value={formData.client_email} onChange={e => setFormData(p => ({ ...p, client_email: e.target.value }))} />
              </div>
              <Input label="Client Phone" value={formData.client_phone} onChange={e => setFormData(p => ({ ...p, client_phone: e.target.value }))} />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Company</Label>
                  <Select value={formData.company_id} onValueChange={v => setFormData(p => ({ ...p, company_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Deal</Label>
                  <Select value={formData.deal_id} onValueChange={v => setFormData(p => ({ ...p, deal_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select deal" /></SelectTrigger>
                    <SelectContent>
                      {deals.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Project</Label>
                  <Select value={formData.project_id} onValueChange={v => setFormData(p => ({ ...p, project_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Quotation (optional)</Label>
                <Select value={formData.quotation_id} onValueChange={v => setFormData(p => ({ ...p, quotation_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select quotation" /></SelectTrigger>
                  <SelectContent>
                    {quotations.map(q => <SelectItem key={q.id} value={q.id}>{q.quotation_number || q.client_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Issue Date</Label>
                  <DatePicker value={formData.issue_date} onChange={v => setFormData(p => ({ ...p, issue_date: v }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <DatePicker value={formData.due_date} onChange={v => setFormData(p => ({ ...p, due_date: v }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={v => setFormData(p => ({ ...p, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={formData.is_recurring} onCheckedChange={v => setFormData(p => ({ ...p, is_recurring: v }))} />
                <div className="flex items-center gap-1.5">
                  <Repeat className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Recurring invoice</span>
                </div>
              </div>

              {formData.is_recurring && (
                <div className="grid grid-cols-3 gap-4 pl-8">
                  <div className="space-y-1.5">
                    <Label>Frequency</Label>
                    <Select value={formData.recurring_frequency} onValueChange={v => setFormData(p => ({ ...p, recurring_frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Next Date</Label>
                    <DatePicker value={formData.recurring_next_date} onChange={v => setFormData(p => ({ ...p, recurring_next_date: v }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Date</Label>
                    <DatePicker value={formData.recurring_end_date} onChange={v => setFormData(p => ({ ...p, recurring_end_date: v }))} />
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-1.5">
                <Label>Line Items</Label>
                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-4">
                        <input
                          placeholder="Description *"
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          className="w-full h-9 px-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number" placeholder="Qty"
                          value={item.quantity || ''}
                          onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full h-9 px-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number" placeholder="Price"
                          value={item.unit_price || ''}
                          onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full h-9 px-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number" placeholder="Disc%"
                          value={item.discount_percent || ''}
                          onChange={e => updateItem(idx, 'discount_percent', parseFloat(e.target.value) || 0)}
                          className="w-full h-9 px-1 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number" placeholder="Tax%"
                          value={item.tax_rate || ''}
                          onChange={e => updateItem(idx, 'tax_rate', parseFloat(e.target.value) || 0)}
                          className="w-full h-9 px-1 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="col-span-1 flex items-center text-xs text-zinc-500 pt-2">
                        {formatCurrency(calcItemTotal(item), formData.currency)}
                      </div>
                      <div className="col-span-1 pt-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => removeItem(idx)} disabled={formData.items.length <= 1}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addItem} className="mt-1">
                    <Plus className="mr-1 h-3 w-3" />Add Item
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Subtotal</span><span>{formatCurrency(totals.subtotal, formData.currency)}</span></div>
                  {totals.itemDiscounts > 0 && (
                    <div className="flex justify-between"><span className="text-zinc-500">Item Discounts</span><span className="text-red-500">-{formatCurrency(totals.itemDiscounts, formData.currency)}</span></div>
                  )}
                  {formData.discount_type !== 'none' && formData.discount_value > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">
                        {formData.discount_type === 'percentage' ? `${formData.discount_value}% Discount` : 'Discount'}
                      </span>
                      <span className="text-red-500">-{formatCurrency(totals.globalDiscount, formData.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between"><span className="text-zinc-500">Tax</span><span>{formatCurrency(totals.tax, formData.currency)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span><span>{formatCurrency(totals.total, formData.currency)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Terms</Label>
                  <textarea
                    rows={3}
                    value={formData.terms}
                    onChange={e => setFormData(p => ({ ...p, terms: e.target.value }))}
                    placeholder="Terms & conditions..."
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={v => setFormData(p => ({ ...p, discount_type: v, discount_value: v === 'none' ? 0 : p.discount_value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {discountTypes.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {formData.discount_type !== 'none' && (
                  <Input label="Discount Value" type="number" value={formData.discount_value.toString()} onChange={e => setFormData(p => ({ ...p, discount_value: parseFloat(e.target.value) || 0 }))} />
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payDialog} onOpenChange={o => !o && setPayDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {payDialog && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                <p className="font-medium">{payDialog.invoice.invoice_number}</p>
                <p className="text-zinc-500 mt-0.5">{payDialog.invoice.client_name}</p>
                <div className="flex justify-between mt-1 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500">Balance due</span>
                  <span className="font-semibold">{formatCurrency(Number(payDialog.invoice.total) - Number(payDialog.invoice.amount_paid || 0), payDialog.invoice.currency)}</span>
                </div>
              </div>
              <Input
                label="Amount"
                type="number"
                step="0.01"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
              />
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
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
                placeholder="Optional reference"
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
                <Button onClick={handleRecordPayment} disabled={!payAmount}>
                  Record Payment
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}