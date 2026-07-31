'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Building, MapPin } from 'lucide-react'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { InventoryShell } from '@/components/inventory/inventory-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { listWarehouses, createWarehouse } from '@/lib/actions/inventory'

export default function WarehousesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', description: '', city: '', state: '', country: '' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const rows = await listWarehouses(currentOrganization.id)
      setWarehouses(rows ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    if (!currentOrganization || !form.code || !form.name) return
    setSubmitting(true)
    try {
      await createWarehouse(currentOrganization.id, {
        code: form.code, name: form.name, description: form.description || undefined,
        city: form.city || undefined, state: form.state || undefined, country: form.country || undefined,
      })
      setDialogOpen(false)
      setForm({ code: '', name: '', description: '', city: '', state: '', country: '' })
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
              <h1 className="text-2xl font-semibold">Warehouses</h1>
              <p className="text-sm text-zinc-500 mt-1">Physical locations where stock is stored</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm({ code: '', name: '', description: '', city: '', state: '', country: '' })}><Plus className="h-4 w-4" /> Add Warehouse</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Warehouse</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Code *</Label>
                      <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WH-MAIN" />
                    </div>
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Main Warehouse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="San Francisco" />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="CA" />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="US" />
                    </div>
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.code || !form.name} className="w-full">{submitting ? 'Saving...' : 'Create Warehouse'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">All Warehouses</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading warehouses...</div>
              ) : warehouses.length === 0 ? (
                <EmptyState icon={Building} title="No warehouses yet" description="Create a warehouse to start tracking stock locations." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {warehouses.map((w) => (
                    <div key={w.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                            <Building className="h-5 w-5 text-zinc-500" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{w.name}</p>
                            <p className="text-xs text-zinc-500 font-mono">{w.code}</p>
                          </div>
                        </div>
                        {w.is_default && <Badge>Default</Badge>}
                      </div>
                      {w.city && (
                        <p className="mt-3 flex items-center gap-1 text-xs text-zinc-500"><MapPin className="h-3.5 w-3.5" /> {[w.city, w.state, w.country].filter(Boolean).join(', ')}</p>
                      )}
                      {w.description && <p className="mt-1 text-xs text-zinc-500">{w.description}</p>}
                      <div className="mt-3">
                        <Badge variant={w.is_active ? 'success' : 'secondary'}>{w.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </InventoryShell>
    </DashboardShell>
  )
}
