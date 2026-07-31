'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Shield, UserRound, Undo2 } from 'lucide-react'
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
import { listAssetAssignments, assignAsset, returnAsset } from '@/lib/actions/inventory'
import { searchProducts } from '@/lib/actions/inventory'

const statusBadge = (s: string) => {
  const variants: Record<string, 'default' | 'success' | 'secondary'> = {
    assigned: 'default', returned: 'success',
  }
  return <Badge variant={variants[s] || 'secondary'}>{s}</Badge>
}

export default function AssetsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [assignments, setAssignments] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ product_id: '', employee_id: '', serial_number: '', assigned_date: '', notes: '' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [assignRes, prodRes, empRes] = await Promise.all([
        listAssetAssignments(currentOrganization.id),
        searchProducts(currentOrganization.id),
        supabase.from('hr_employees').select('id, first_name, last_name').eq('organization_id', currentOrganization.id).is('deleted_at', null),
      ])
      setAssignments(assignRes ?? [])
      setProducts(prodRes ?? [])
      setEmployees(empRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const prodName = (id: string) => products.find(p => p.id === id)?.name ?? id.slice(0, 8)
  const empName = (id: string) => {
    const e = employees.find(em => em.id === id)
    return e ? `${e.first_name || ''} ${e.last_name || ''}`.trim() || id.slice(0, 8) : id.slice(0, 8)
  }

  const filtered = assignments
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSubmit = async () => {
    if (!currentOrganization || !form.product_id || !form.employee_id) return
    setSubmitting(true)
    try {
      await assignAsset(currentOrganization.id, {
        product_id: form.product_id,
        employee_id: form.employee_id,
        serial_number: form.serial_number || undefined,
        assigned_date: form.assigned_date || new Date().toISOString().slice(0, 10),
        notes: form.notes || undefined,
      })
      setDialogOpen(false)
      setForm({ product_id: '', employee_id: '', serial_number: '', assigned_date: new Date().toISOString().slice(0, 10), notes: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturn = async (id: string) => {
    try { await returnAsset(currentOrganization!.id, id); fetchData() } catch (err) { console.error(err) }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <InventoryShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Asset Assignments</h1>
              <p className="text-sm text-zinc-500 mt-1">Assign inventory assets to employees</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm({ product_id: '', employee_id: '', serial_number: '', assigned_date: new Date().toISOString().slice(0, 10), notes: '' })}><Plus className="h-4 w-4" /> Assign Asset</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign Asset</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Product / Asset *</Label>
                    <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Employee *</Label>
                    <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{`${e.first_name || ''} ${e.last_name || ''}`.trim() || e.id.slice(0, 8)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Serial Number</Label>
                      <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                      <Label>Assigned Date</Label>
                      <Input type="date" value={form.assigned_date} onChange={(e) => setForm({ ...form, assigned_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.product_id || !form.employee_id} className="w-full">{submitting ? 'Saving...' : 'Assign Asset'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Assignments</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading assignments...</div>
              ) : paged.length === 0 ? (
                <EmptyState icon={Shield} title="No asset assignments" description="Assign products like laptops, phones, and tools to employees." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['Asset', 'Employee', 'Serial', 'Assigned', 'Status', 'Action'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((a) => (
                        <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800"><Shield className="h-3.5 w-3.5 text-zinc-500" /></span>
                              <span className="text-sm font-medium">{prodName(a.productId)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                              <UserRound className="h-3.5 w-3.5" /> {empName(a.employeeId)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-zinc-500">{a.serialNumber || '—'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{a.assignedDate ? new Date(a.assignedDate).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">{statusBadge(a.status)}</td>
                          <td className="px-4 py-3">
                            {a.status === 'assigned' && (
                              <Button size="sm" variant="outline" onClick={() => handleReturn(a.id)}><Undo2 className="h-3.5 w-3.5" /> Return</Button>
                            )}
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