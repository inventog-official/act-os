'use client'

import { useState, useEffect, use, useCallback, useMemo } from 'react'
import { CalendarCheck, Plus, Trash2, Loader2, CalendarOff } from 'lucide-react'
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
import { getAttendance, getHolidays, recordAttendance, createHoliday, deleteAttendance, deleteHoliday, getEmployees } from '@/lib/actions/hr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

export default function AttendancePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [attendance, setAttendance] = useState<any[]>([])
  const [holidays, setHolidays] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [attDialogOpen, setAttDialogOpen] = useState(false)
  const [holDialogOpen, setHolDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [attForm, setAttForm] = useState({
    employeeId: '', attendanceDate: new Date().toISOString().slice(0, 10), checkIn: '', checkOut: '', status: 'present', notes: '',
  })
  const [holForm, setHolForm] = useState({ name: '', holidayDate: new Date().toISOString().slice(0, 10), holidayType: 'public', departmentId: '' })

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [att, hols, emps] = await Promise.all([
      getAttendance(currentOrganization.id).catch(() => []),
      getHolidays(currentOrganization.id).catch(() => []),
      getEmployees(currentOrganization.id).catch(() => []),
    ])
    setAttendance(att)
    setHolidays(hols)
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

  const handleRecord = async () => {
    if (!currentOrganization?.id || !attForm.employeeId) return
    setSubmitting(true)
    try {
      const minutes = (() => {
        if (!attForm.checkIn || !attForm.checkOut) return undefined
        const [hi, mi] = attForm.checkIn.split(':').map(Number)
        const [ho, mo] = attForm.checkOut.split(':').map(Number)
        return Math.max(0, (ho * 60 + mo) - (hi * 60 + mi))
      })()
      await recordAttendance({
        employeeId: attForm.employeeId,
        attendanceDate: attForm.attendanceDate,
        checkIn: attForm.checkIn || null,
        checkOut: attForm.checkOut || null,
        status: attForm.status,
        workingMinutes: minutes,
        organizationId: currentOrganization.id,
      })
      setAttDialogOpen(false)
      setAttForm({ employeeId: '', attendanceDate: new Date().toISOString().slice(0, 10), checkIn: '', checkOut: '', status: 'present', notes: '' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddHoliday = async () => {
    if (!currentOrganization?.id || !holForm.name || !holForm.holidayDate) return
    setSubmitting(true)
    try {
      await createHoliday({
        name: holForm.name,
        holidayDate: holForm.holidayDate,
        holidayType: holForm.holidayType,
        departmentId: holForm.departmentId || null,
        organizationId: currentOrganization.id,
      })
      setHolDialogOpen(false)
      setHolForm({ name: '', holidayDate: new Date().toISOString().slice(0, 10), holidayType: 'public', departmentId: '' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const statusColor: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    absent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    late: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    half_day: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    on_leave: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    holiday: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  }

  const timeOf = (t: string | null) => (t ? t.slice(11, 16) : '—')

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
              <h1 className="text-2xl font-semibold">Attendance</h1>
              <p className="text-sm text-zinc-500 mt-1">Track daily attendance and holidays</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setHolDialogOpen(true)}>
                <CalendarOff className="h-4 w-4 mr-2" /> Add Holiday
              </Button>
              <Button onClick={() => setAttDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Record Attendance
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500">
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Check-in</th>
                      <th className="px-4 py-3 font-medium">Check-out</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Minutes</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a) => (
                      <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-3 font-medium">{employeeName(a.employee_id)}</td>
                        <td className="px-4 py-3">{a.attendance_date}</td>
                        <td className="px-4 py-3">{timeOf(a.check_in)}</td>
                        <td className="px-4 py-3">{timeOf(a.check_out)}</td>
                        <td className="px-4 py-3"><Badge className={statusColor[a.status] || ''}>{a.status}</Badge></td>
                        <td className="px-4 py-3">{a.working_minutes ? `${Math.floor(a.working_minutes / 60)}h ${a.working_minutes % 60}m` : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteAttendance(a.id).then(load)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr><td colSpan={7}><EmptyState icon={CalendarCheck} title="No attendance records" description="Record attendance for your team." /></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><CalendarOff className="h-5 w-5" /> Holidays</h2>
            {holidays.length === 0 ? (
              <p className="text-sm text-zinc-500">No holidays configured</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {holidays.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="font-medium">{h.name}</span>
                    <span className="text-zinc-500">{h.holiday_date}</span>
                    <Badge variant="outline">{h.holiday_type}</Badge>
                    <Button variant="ghost" size="sm" className="text-red-600 h-6 w-6" onClick={() => deleteHoliday(h.id).then(load)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog open={attDialogOpen} onOpenChange={setAttDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <select value={attForm.employeeId} onChange={(e) => setAttForm({ ...attForm, employeeId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="">Select employee</option>
                  {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={attForm.attendanceDate} onChange={(e) => setAttForm({ ...attForm, attendanceDate: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={attForm.status} onChange={(e) => setAttForm({ ...attForm, status: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half day</option>
                    <option value="on_leave">On leave</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Check-in time</Label><Input type="time" value={attForm.checkIn} onChange={(e) => setAttForm({ ...attForm, checkIn: e.target.value })} /></div>
                <div className="space-y-2"><Label>Check-out time</Label><Input type="time" value={attForm.checkOut} onChange={(e) => setAttForm({ ...attForm, checkOut: e.target.value })} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setAttDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRecord} disabled={submitting || !attForm.employeeId}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={holDialogOpen} onOpenChange={setHolDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={holForm.name} onChange={(e) => setHolForm({ ...holForm, name: e.target.value })} placeholder="Independence Day" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date *</Label><Input type="date" value={holForm.holidayDate} onChange={(e) => setHolForm({ ...holForm, holidayDate: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select value={holForm.holidayType} onChange={(e) => setHolForm({ ...holForm, holidayType: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="public">Public</option>
                    <option value="company">Company</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setHolDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddHoliday} disabled={submitting || !holForm.name}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </HrShell>
    </DashboardShell>
  )
}