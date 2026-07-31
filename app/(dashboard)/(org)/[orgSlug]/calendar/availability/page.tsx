'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Clock, Loader2, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CalendarShell } from '@/components/calendar/calendar-shell'
import { useOrganizationStore } from '@/lib/store'
import { listAvailability, saveAvailability, deleteAvailability } from '@/lib/actions/calendar'
import { toast } from 'sonner'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AvailabilityPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<number, { start: string; end: string }>>({})
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setLoading(true)
    try {
      const data = await listAvailability(currentOrganization.id)
      setSlots(data || [])
      const d: Record<number, { start: string; end: string }> = {}
      for (const s of data || []) {
        d[s.dayOfWeek] = { start: s.startTime.slice(0, 5), end: s.endTime.slice(0, 5) }
      }
      setDrafts(d)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (day: number) => {
    if (!currentOrganization) return
    const draft = drafts[day]
    if (!draft?.start || !draft?.end) return
    setSaving(true)
    try {
      await saveAvailability(currentOrganization.id, {
        day_of_week: day,
        start_time: draft.start,
        end_time: draft.end,
        timezone: 'UTC',
        is_active: true,
      })
      toast.success(`${DAYS[day]} availability saved`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentOrganization) return
    try {
      await deleteAvailability(currentOrganization.id, id)
      toast.success('Availability removed')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <CalendarShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Availability</h1>
            <p className="text-sm text-zinc-500">Set your recurring working hours for scheduling</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DAYS.map((dayName, dayIndex) => {
                const existing = slots.find(s => s.dayOfWeek === dayIndex)
                const draft = drafts[dayIndex]
                return (
                  <Card key={dayName}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400" />{dayName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {existing ? (existing.isActive ? 'Active' : 'Inactive') : 'Not configured'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="time"
                          value={draft?.start || '09:00'}
                          onChange={e => setDrafts(d => ({ ...d, [dayIndex]: { start: e.target.value, end: d[dayIndex]?.end || '17:00' } }))}
                        />
                        <Input
                          type="time"
                          value={draft?.end || '17:00'}
                          onChange={e => setDrafts(d => ({ ...d, [dayIndex]: { start: d[dayIndex]?.start || '09:00', end: e.target.value } }))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSave(dayIndex)} disabled={saving}>
                          {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          <Save className="h-3 w-3 mr-1" />Save
                        </Button>
                        {existing && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(existing.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </CalendarShell>
    </DashboardShell>
  )
}