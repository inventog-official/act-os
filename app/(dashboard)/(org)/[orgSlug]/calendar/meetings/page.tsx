'use client'

import { useState, use, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Video, Plus, Loader2, CalendarDays, MapPin, Clock, XCircle, CheckCircle2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CalendarShell } from '@/components/calendar/calendar-shell'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import { listMeetings, createMeeting, cancelMeeting, completeMeeting } from '@/lib/actions/calendar'
import { toast } from 'sonner'

const meetingTypeBadge: Record<string, string> = {
  internal: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  customer: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  project: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  one_on_one: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  recruitment: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  standup: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  other: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

const statusBadge: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  rescheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  completed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

export default function MeetingsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '', date: '', start_time: '', meeting_type: 'internal', location: '', meeting_link: '', agenda: '',
  })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setLoading(true)
    try {
      const opts: any = {}
      if (status !== 'all') opts.status = status
      const data = await listMeetings(currentOrganization.id, opts)
      setMeetings(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentOrganization, status])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.date || !formData.start_time || !currentOrganization) return
    setSaving(true)
    try {
      await createMeeting(currentOrganization.id, {
        title: formData.title,
        meeting_type: formData.meeting_type as any,
        start_time: `${formData.date}T${formData.start_time}`,
        location: formData.location || undefined,
        meeting_link: formData.meeting_link || undefined,
        agenda: formData.agenda || undefined,
        duration_minutes: 60,
      })
      toast.success('Meeting scheduled')
      setShowAdd(false)
      setFormData({ title: '', date: '', start_time: '', meeting_type: 'internal', location: '', meeting_link: '', agenda: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!currentOrganization) return
    try {
      await cancelMeeting(currentOrganization.id, id)
      toast.success('Meeting cancelled')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleComplete = async (id: string) => {
    if (!currentOrganization) return
    try {
      await completeMeeting(currentOrganization.id, id)
      toast.success('Meeting completed')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <CalendarShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Meetings</h1>
              <p className="text-sm text-zinc-500">{meetings.length} meetings</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
          ) : meetings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Video className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No meetings found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {meetings.map(meeting => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/${orgSlug}/calendar/meetings/${meeting.id}`} className="hover:underline">
                        <CardTitle className="text-base">{meeting.title}</CardTitle>
                      </Link>
                      <Badge className={cn('text-[10px]', statusBadge[meeting.status] || '')}>{meeting.status}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(meeting.startTime)} · {new Date(meeting.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={cn('text-[10px]', meetingTypeBadge[meeting.meetingType] || '')}>{meeting.meetingType.replace('_', ' ')}</Badge>
                      {meeting.meetingType === 'customer' && meeting.companyId && <span className="text-[10px] text-zinc-400">customer</span>}
                    </div>
                    {meeting.location && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{meeting.location}</p>
                    )}
                    {meeting.meetingLink && (
                      <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 underline flex items-center gap-1">
                        <Video className="h-3 w-3" />Join link
                      </a>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link href={`/${orgSlug}/calendar/meetings/${meeting.id}`}>Open</Link>
                      </Button>
                      {meeting.status === 'scheduled' || meeting.status === 'confirmed' ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleComplete(meeting.id)} title="Complete">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleCancel(meeting.id)} title="Cancel">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Schedule Meeting</DialogTitle>
              <DialogDescription>Create a new meeting</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input label="Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Meeting title" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date *" type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                <Input label="Start time *" type="time" value={formData.start_time} onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Meeting type</label>
                <Select value={formData.meeting_type} onValueChange={v => setFormData(p => ({ ...p, meeting_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="one_on_one">One-on-one</SelectItem>
                    <SelectItem value="recruitment">Recruitment</SelectItem>
                    <SelectItem value="standup">Standup</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Location" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Room or address" />
                <Input label="Meeting link" value={formData.meeting_link} onChange={e => setFormData(p => ({ ...p, meeting_link: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Agenda</label>
                <textarea
                  className="w-full min-h-[80px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={formData.agenda}
                  onChange={e => setFormData(p => ({ ...p, agenda: e.target.value }))}
                  placeholder="Agenda items..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !formData.title.trim() || !formData.date || !formData.start_time}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CalendarShell>
    </DashboardShell>
  )
}