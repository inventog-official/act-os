'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Box, Trash2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { listUnits, createUnit } from '@/lib/actions/inventory'

const unitTypeLabel: Record<string, string> = {
  length: 'Length', weight: 'Weight', volume: 'Volume', area: 'Area', count: 'Count', custom: 'Custom',
}

export default function UnitsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [units, setUnits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', symbol: '', unit_type: 'custom' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const rows = await listUnits(currentOrganization.id)
      setUnits(rows ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    if (!currentOrganization || !form.name || !form.symbol) return
    setSubmitting(true)
    try {
      await createUnit(currentOrganization.id, { name: form.name, symbol: form.symbol, unit_type: form.unit_type as any })
      setDialogOpen(false)
      setForm({ name: '', symbol: '', unit_type: 'custom' })
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
              <h1 className="text-2xl font-semibold">Units of Measurement</h1>
              <p className="text-sm text-zinc-500 mt-1">Define units used across your inventory</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm({ name: '', symbol: '', unit_type: 'custom' })}><Plus className="h-4 w-4" /> Add Unit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Unit</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kilogram" />
                  </div>
                  <div className="space-y-2">
                    <Label>Symbol *</Label>
                    <Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="kg" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.unit_type} onValueChange={(v) => setForm({ ...form, unit_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(unitTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting || !form.name || !form.symbol} className="w-full">{submitting ? 'Saving...' : 'Create Unit'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">All Units</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-500">Loading units...</div>
              ) : units.length === 0 ? (
                <EmptyState icon={Box} title="No units yet" description="Add units like Each, Kilogram, or Box to track quantities." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {units.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold">{u.symbol}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-zinc-500">{unitTypeLabel[u.unit_type] || u.unit_type}</p>
                      </div>
                      {u.is_system && <Badge variant="secondary">System</Badge>}
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
