'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { Plus, Check, X, Trash2, Loader2, Coffee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getLeaveRequests, getLeaveTypes, getLeaveBalances, createLeaveRequest, updateLeaveRequestStatus, deleteLeaveRequest, getEmployees } from '@/lib/actions/hr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

export default function LeavePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [requests, setRequests] = useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [balances, setBalances] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    employeeId: '', leaveTypeId: '', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), reason: '',
  })

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [reqs, types, bals, emps] = await Promise.all([
      getLeaveRequests(currentOrganization.id).catch(() => []),
      getLeaveTypes(currentOrganization.id).catch(() => []),
      getLeaveBalances(currentOrganization.id).catch(() => []),
      getEmployees(currentOrganization.id).catch(() => []),
    ])
    setRequests(reqs)
    setLeaveTypes(types)
    setBalances(bals)
    setEmployees(emps)
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const employeeName = (id: string | null) => {
    const e = employees.find((e) => e.id === id)
    return e ? `${e.first_name} ${e.last_name}` : '—'
  }

  const handleCreate = async () => {
    if (!currentOrganization?.id || !form.employeeId || !form.leaveTypeId) return
    setSubmitting(true)
    try {
      await createLeaveRequest({
        employeeId: form.employeeId,
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || null,
        organizationId: currentOrganization.id,
      })
      setDialogOpen(false)
      setForm({ employeeId: '', leaveTypeId: '', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), reason: '' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    cancelled: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <Skeleton className="h-10 w-64 mb-6" />
          <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </HrShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <HrShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Leave Management</h1>
              <p className="text-sm text-zinc-500 mt-1">Request and manage employee leave</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Leave Request
            </Button>
          </div>

          {balances.length > 0 && (
            <div className="grid gap-4 grid-cols-4">
              {balances.slice(0, 8).map((b) => {
                const remaining = Math.max(0, (b.total_days || 0) - (b.used_days || 0))
                const pct = b.total_days ? Math.min(100, Math.round(((b.total_days - remaining) / b.total_days) * 100)) : 0
                return (
                  <Card key={b.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{b.leave_type?.name || employeeName(b.employee_id)}</span>
                        <span className="text-zinc-500">{b.year}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{remaining} of {b.total_days} days remaining</p>
                      <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: b.leave_type?.color || '#10b981' }} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500">
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Dates</th>
                      <th className="px-4 py-3 font-medium">Days</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{employeeName(r.employee_id)}</p>
                            {r.reason && <p className="text-xs text-zinc-500">{r.reason}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge style={{ backgroundColor: `${r.leave_type?.color || '#3b82f6'}20`, color: r.leave_type?.color || '#3b82f6' }}>
                            {r.leave_type?.name || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{r.start_date?.slice(0, 10)} → {r.end_date?.slice(0, 10)}</td>
                        <td className="px-4 py-3">{r.days}</td>
                        <td className="px-4 py-3"><Badge className={statusColor[r.status] || ''}>{r.status}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {r.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => updateLeaveRequestStatus(r.id, 'approved', currentOrganization!.id).then(load)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateLeaveRequestStatus(r.id, 'rejected', currentOrganization!.id).then(load)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteLeaveRequest(r.id).then(load)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr><td colSpan={6}><EmptyState icon={Coffee} title="No leave requests" description="New requests will appear here." /></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="">Select employee</option>
                  {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Leave type *</Label>
                <select value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="">Select type</option>
                  {leaveTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div className="space-y-2"><Label>End date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Reason</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting || !form.employeeId || !form.leaveTypeId}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </HrShell>
    </DashboardShell>
  )
}