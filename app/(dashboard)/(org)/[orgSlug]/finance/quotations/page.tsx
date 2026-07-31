'use client'

import { useState, use, useEffect, useCallback } from 'react'
import {
  Plus, Search, MoreHorizontal, FileText, Eye, Pencil, Copy, ArrowRightFromLine,
  ArrowLeftFromLine, Trash2, Loader2, FileInput, Download, Send
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { FinanceShell } from '@/components/finance/finance-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  createQuotation, updateQuotation, deleteQuotation, updateQuotationStatus,
  duplicateQuotation, convertQuoteToInvoice, convertEstimateToQuote, sendQuotationEmail
} from '@/lib/actions/finance'

const statusConfig: Record<string, { label: string; variant: string }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  declined: { label: 'Declined', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'warning' },
  converted: { label: 'Converted', variant: 'default' },
}

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN']
const discountTypes = ['none', 'percentage', 'fixed']

interface QuotationItem {
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_rate: number
}

interface QuotationFormData {
  client_name: string
  client_email: string
  client_phone: string
  company_id: string
  deal_id: string
  project_id: string
  issue_date: string
  expiry_date: string
  currency: string
  discount_type: string
  discount_value: number
  notes: string
  terms: string
  type: 'quote' | 'estimate'
  items: QuotationItem[]
}

const emptyItem = (): QuotationItem => ({
  description: '',
  quantity: 1,
  unit_price: 0,
  discount_percent: 0,
  tax_rate: 0,
})

const defaultForm = (type: 'quote' | 'estimate'): QuotationFormData => ({
  client_name: '',
  client_email: '',
  client_phone: '',
  company_id: '',
  deal_id: '',
  project_id: '',
  issue_date: new Date().toISOString().split('T')[0],
  expiry_date: '',
  currency: 'USD',
  discount_type: 'none',
  discount_value: 0,
  notes: '',
  terms: '',
  type,
  items: [emptyItem()],
})

function calcItemTotal(item: QuotationItem): number {
  const lineTotal = item.quantity * item.unit_price
  const discount = lineTotal * (item.discount_percent / 100)
  const taxable = lineTotal - discount
  const tax = taxable * (item.tax_rate / 100)
  return taxable + tax
}

function calcTotals(items: QuotationItem[], discountType: string, discountValue: number) {
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

export default function QuotationsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [quotations, setQuotations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<QuotationFormData>(defaultForm('quote'))

  const [companies, setCompanies] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

  const fetchQuotations = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('finance_quotations')
        .select('*, items:finance_quotation_items(*)')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (typeFilter !== 'all') query = query.eq('type', typeFilter)

      const { data } = await query
      setQuotations(data || [])
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }, [currentOrganization, statusFilter, typeFilter, supabase])

  const fetchReferenceData = useCallback(async () => {
    if (!currentOrganization) return
    const [cmpRes, dlRes, projRes] = await Promise.all([
      supabase.from('crm_companies').select('id, name').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      supabase.from('crm_deals').select('id, name').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      supabase.from('projects').select('id, name').eq('organization_id', currentOrganization.id).is('deleted_at', null),
    ])
    setCompanies(cmpRes.data || [])
    setDeals(dlRes.data || [])
    setProjects(projRes.data || [])
  }, [currentOrganization, supabase])

  useEffect(() => { fetchQuotations() }, [fetchQuotations])
  useEffect(() => { fetchReferenceData() }, [fetchReferenceData])

  const openCreate = (type: 'quote' | 'estimate') => {
    setEditingId(null)
    setFormData({ ...defaultForm(type), issue_date: new Date().toISOString().split('T')[0] })
    setShowDialog(true)
  }

  const openEdit = (q: any) => {
    setEditingId(q.id)
    setFormData({
      client_name: q.client_name || '',
      client_email: q.client_email || '',
      client_phone: q.client_phone || '',
      company_id: q.company_id || '',
      deal_id: q.deal_id || '',
      project_id: q.project_id || '',
      issue_date: q.issue_date?.split('T')[0] || '',
      expiry_date: q.expiry_date?.split('T')[0] || '',
      currency: q.currency || 'USD',
      discount_type: q.discount_type || 'none',
      discount_value: q.discount_value || 0,
      notes: q.notes || '',
      terms: q.terms || '',
      type: q.type || 'quote',
      items: q.items?.length ? q.items.map((i: any) => ({
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
        issueDate: formData.issue_date || new Date().toISOString().split('T')[0],
        expiryDate: formData.expiry_date || null,
        currency: formData.currency,
        discountType: formData.discount_type,
        discountValue: formData.discount_value,
        notes: formData.notes || null,
        terms: formData.terms || null,
        type: formData.type,
        items: formData.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          discountPercent: i.discount_percent || 0,
        })),
      }

      if (editingId) {
        await updateQuotation(editingId, payload)
        toast.success('Quotation updated')
      } else {
        await createQuotation(payload)
        toast.success('Quotation created')
      }
      setShowDialog(false)
      fetchQuotations()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteQuotation(id)
      toast.success('Quotation deleted')
      fetchQuotations()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateQuotation(id)
      toast.success('Quotation duplicated')
      fetchQuotations()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleConvertToInvoice = async (id: string) => {
    try {
      await convertQuoteToInvoice(id)
      toast.success('Converted to invoice')
      fetchQuotations()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleConvertToQuote = async (id: string) => {
    try {
      await convertEstimateToQuote(id)
      toast.success('Converted to quote')
      fetchQuotations()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleSend = async (id: string) => {
    try {
      const res = await sendQuotationEmail(id)
      if (res?.email?.delivered) {
        toast.success('Quote sent')
      } else if (res?.email?.reason === 'RESEND_API_KEY not configured') {
        toast.success('Quote marked as sent (email not configured)')
      } else if (res?.email?.reason === 'No client email set') {
        toast.warning('Quote not sent — no client email set')
      } else {
        toast.success('Quote sent')
      }
      fetchQuotations()
    } catch (err: any) { toast.error(err.message) }
  }

  const addItem = () => setFormData(p => ({ ...p, items: [...p.items, emptyItem()] }))

  const removeItem = (idx: number) => {
    if (formData.items.length <= 1) return
    setFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))
  }

  const updateItem = (idx: number, field: keyof QuotationItem, value: string | number) => {
    setFormData(p => ({
      ...p,
      items: p.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }))
  }

  const filtered = quotations.filter(q => {
    if (!searchQuery) return true
    const ql = searchQuery.toLowerCase()
    return (
      (q.quote_number || '').toLowerCase().includes(ql) ||
      (q.client_name || '').toLowerCase().includes(ql) ||
      (q.client_email || '').toLowerCase().includes(ql)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedQuotations = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const totals = calcTotals(formData.items, formData.discount_type, formData.discount_value)

  return (
    <DashboardShell orgSlug={orgSlug}>
      <FinanceShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Quotations & Estimates</h1>
              <p className="text-sm text-zinc-500 mt-1">{quotations.length} total</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => openCreate('estimate')}>
                <FileInput className="mr-2 h-4 w-4" />New Estimate
              </Button>
              <Button size="sm" onClick={() => openCreate('quote')}>
                <Plus className="mr-2 h-4 w-4" />New Quote
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                placeholder="Search quotations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
                <SelectItem value="estimate">Estimate</SelectItem>
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
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'No quotations found' : 'No quotations yet'}
              description={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first quotation or estimate'}
              action={
                !searchQuery && statusFilter === 'all' && typeFilter === 'all' ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openCreate('quote')}><Plus className="mr-2 h-4 w-4" />New Quote</Button>
                    <Button size="sm" variant="outline" onClick={() => openCreate('estimate')}><FileInput className="mr-2 h-4 w-4" />New Estimate</Button>
                  </div>
                ) : undefined
              }
            />
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedQuotations.map(q => {
                    const cfg = statusConfig[q.status] || statusConfig.draft
                    return (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.quote_number || '—'}</TableCell>
                        <TableCell>{q.client_name || '—'}</TableCell>
                        <TableCell className="text-zinc-500">{q.issue_date ? formatDate(q.issue_date) : '—'}</TableCell>
                        <TableCell className="text-zinc-500">{q.expiry_date ? formatDate(q.expiry_date) : '—'}</TableCell>
                        <TableCell>{formatCurrency(q.total || 0, q.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant as any}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{q.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(q)}>
                                <Eye className="mr-2 h-4 w-4" />View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(q)}>
                                <Pencil className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(q.id)}>
                                <Copy className="mr-2 h-4 w-4" />Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSend(q.id)}>
                                <Send className="mr-2 h-4 w-4" />Send
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {q.type === 'quote' && q.status !== 'converted' && (
                                <DropdownMenuItem onClick={() => handleConvertToInvoice(q.id)}>
                                  <ArrowRightFromLine className="mr-2 h-4 w-4" />Convert to Invoice
                                </DropdownMenuItem>
                              )}
                              {q.type === 'estimate' && q.status !== 'converted' && (
                                <DropdownMenuItem onClick={() => handleConvertToQuote(q.id)}>
                                  <ArrowLeftFromLine className="mr-2 h-4 w-4" />Convert to Quote
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => window.open(`/api/finance/pdf/quote?id=${q.id}`, '_blank')}>
                                <Download className="h-4 w-4 mr-2" />Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(q.id)}>
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
            <DialogTitle>{editingId ? 'Edit' : 'Create'} {formData.type === 'quote' ? 'Quote' : 'Estimate'}</DialogTitle>
            <DialogDescription>Fill in the details below</DialogDescription>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Issue Date</Label>
                  <DatePicker value={formData.issue_date} onChange={v => setFormData(p => ({ ...p, issue_date: v }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <DatePicker value={formData.expiry_date} onChange={v => setFormData(p => ({ ...p, expiry_date: v }))} />
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
              </div>

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
    </DashboardShell>
  )
}