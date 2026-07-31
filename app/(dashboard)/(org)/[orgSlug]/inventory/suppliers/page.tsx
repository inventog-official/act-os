'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Users, Pencil, Star } from 'lucide-react'
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
import { listSuppliers, createSupplier } from '@/lib/actions/inventory'

export default function SuppliersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ company_id: '', supplier_code: '', payment_terms: '', currency: 'USD', lead_time_days: '0', contact_name: '', contact_email: '', contact_phone: '', tax_number: '', is_preferred: false })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [supRes, coRes] = await Promise.all([
        listSuppliers(currentOrganization.id),
        supabase.from('crm_companies').select('id, name').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      ])
      setSuppliers(supRes ?? [])
      setCompanies(coRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const companyName = (id: string) => companies.find(c => c.id === id)?.name ?? id.slice(0, 8)

  const filtered = suppliers.filter(s => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!s.supplier_code?.toLowerCase().includes(q) && !s.contact_name?.toLowerCase().includes(q) && !companyName(s.company_id).toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSubmit = async () => {
    if (!currentOrganization || !form.company_id) return
    setSubmitting(true)
    try {
      await createSupplier(currentOrganization.id, {
        company_id: form.company_id,
        supplier_code: form.supplier_code || undefined,
        payment_terms: form.payment_terms || undefined,
        currency: form.currency,
        lead_time_days: Number(form.lead_time_days || 0),
        contact_name: form.contact_name || undefined,
        contact_email: form.contact_email || undefined,
        contact_phone: form.contact_phone || undefined,
        tax_number: form.tax_number || undefined,
        is_preferred: form.is_preferred,
      })
      setDialogOpen(false)
      setForm({ company_id: '', supplier_code: '', payment_terms: '', currency: 'USD', lead_time_days: '0', contact_name: '', contact_email: '', contact_phone: '', tax_number: '', is_preferred: false })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Suppliers</h1>
              <p className="text-sm text-zinc-500 mt-1">Vendors reused from your CRM companies</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm({ company_id: '', supplier_code: '', payment_terms: '', currency: 'USD', lead_time_days: '0', contact_name: '', contact_email: '', contact_phone: '', tax_number: '', is_preferred: false })}><Plus className="h-4 w-4" /> Add Supplier</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select CRM company" /></SelectTrigger>
                      <SelectContent>
                        {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Supplier Code</Label>
                      <Input value={form.supplier_code} onChange={(e) => setForm({ ...form, supplier_code: e.target.value })} placeholder="SUP-ACME" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Number</Label>
                      <Input value={form.tax_number} onChange={(e) => setForm({ ...form, tax_number: e.target.value })} placeholder="Optional" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="Net 30" />
                    </div>
                    <div className="space-y-2">
                      <Label>Lead Time (days)</Label>
                      <Input type="number" value={form.lead_time_days} onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Alice Chen" />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="alice@acme.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred</Label>
                      <Select value={form.is_preferred ? 'yes' : 'no'} onValueChange={(v) => setForm({ ...form, is_preferred: v === 'yes' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.company_id} className="w-full">{submitting ? 'Saving...' : 'Create Supplier'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">All Suppliers</CardTitle>
              <div className="relative w-64">
                <Input placeholder="Search suppliers..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading suppliers...</div>
              ) : paged.length === 0 ? (
                <EmptyState icon={Users} title="No suppliers yet" description="Add suppliers linked to your CRM companies." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['Company', 'Code', 'Contact', 'Payment', 'Lead Time', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((s) => (
                        <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800"><Users className="h-3.5 w-3.5 text-zinc-500" /></span>
                              <span className="text-sm font-medium">{companyName(s.companyId)}</span>
                              {s.isPreferred && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-zinc-500">{s.supplierCode || '—'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{s.contactName || '—'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{s.paymentTerms || '—'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{s.leadTimeDays ?? 0} days</td>
                          <td className="px-4 py-3">
                            <Badge variant={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
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