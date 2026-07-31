'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Map, Trash2 } from 'lucide-react'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { InventoryShell } from '@/components/inventory/inventory-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { listWarehouses, listLocations, createLocation } from '@/lib/actions/inventory'

export default function LocationsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', description: '', warehouse_id: '', row_location: '', rack: '', bin: '', capacity: '' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const [whs, locs] = await Promise.all([
        listWarehouses(currentOrganization.id),
        listLocations(currentOrganization.id),
      ])
      setWarehouses(whs ?? [])
      setLocations(locs ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const warehouseName = (id: string) => warehouses.find(w => w.id === id)?.name ?? id.slice(0, 8)

  const handleSubmit = async () => {
    if (!currentOrganization || !form.code || !form.name || !form.warehouse_id) return
    setSubmitting(true)
    try {
      await createLocation(currentOrganization.id, {
        code: form.code, name: form.name, description: form.description || undefined,
        warehouse_id: form.warehouse_id, row_location: form.row_location || undefined,
        rack: form.rack || undefined, bin: form.bin || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      })
      setDialogOpen(false)
      setForm({ code: '', name: '', description: '', warehouse_id: '', row_location: '', rack: '', bin: '', capacity: '' })
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
              <h1 className="text-2xl font-semibold">Storage Locations</h1>
              <p className="text-sm text-zinc-500 mt-1">Aisles, racks, and bins inside your warehouses</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm({ code: '', name: '', description: '', warehouse_id: warehouses[0]?.id || '', row_location: '', rack: '', bin: '', capacity: '' })}><Plus className="h-4 w-4" /> Add Location</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Location</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Warehouse *</Label>
                    <Select value={form.warehouse_id} onValueChange={(v) => setForm({ ...form, warehouse_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Code *</Label>
                      <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="A01" />
                    </div>
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reception" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Aisle / Row</Label>
                      <Input value={form.row_location} onChange={(e) => setForm({ ...form, row_location: e.target.value })} placeholder="A" />
                    </div>
                    <div className="space-y-2">
                      <Label>Rack</Label>
                      <Input value={form.rack} onChange={(e) => setForm({ ...form, rack: e.target.value })} placeholder="R1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Bin</Label>
                      <Input value={form.bin} onChange={(e) => setForm({ ...form, bin: e.target.value })} placeholder="B1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.code || !form.name || !form.warehouse_id} className="w-full">{submitting ? 'Saving...' : 'Create Location'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">All Locations</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading locations...</div>
              ) : locations.length === 0 ? (
                <EmptyState icon={Map} title="No locations yet" description="Add locations inside your warehouses to track stock precisely." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {locations.map((l) => (
                    <div key={l.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                          <Map className="h-5 w-5 text-zinc-500" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{l.name}</p>
                          <p className="text-xs text-zinc-500 font-mono">{l.code} · {warehouseName(l.warehouse_id)}</p>
                        </div>
                      </div>
                      {(l.row_location || l.rack || l.bin) && (
                        <p className="mt-3 text-xs text-zinc-500 font-mono">
                          {[l.row_location && `Row ${l.row_location}`, l.rack && `Rack ${l.rack}`, l.bin && `Bin ${l.bin}`].filter(Boolean).join(' / ')}
                        </p>
                      )}
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
