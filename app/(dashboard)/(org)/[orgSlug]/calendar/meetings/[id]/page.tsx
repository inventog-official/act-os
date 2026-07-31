'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Video, CalendarDays, MapPin, ArrowLeft, Plus, Loader2, CheckSquare, Gavel, FileText, XCircle, Clock, ArrowRight, History } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CalendarShell } from '@/components/calendar/calendar-shell'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import {
  getMeeting, listMeetingNotes, createMeetingNotes,
  listMeetingDecisions, createMeetingDecision, updateMeetingDecisionStatus,
  listMeetingActionItems, createMeetingActionItem, updateMeetingActionItem,
  cancelMeeting, completeMeeting, rescheduleMeeting, convertActionItemToTask,
  getMeetingActivities,
} from '@/lib/actions/calendar'
import { toast } from 'sonner'

const statusBadge: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  rescheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  completed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

export default function MeetingDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [meeting, setMeeting] = useState<any>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [decisions, setDecisions] = useState<any[]>([])
  const [actionItems, setActionItems] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [decisionText, setDecisionText] = useState('')
  const [actionText, setActionText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [savingDecision, setSavingDecision] = useState(false)
  const [savingAction, setSavingAction] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [newTime, setNewTime] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setLoading(true)
    try {
      const [m, n, d, a, act] = await Promise.all([
        getMeeting(currentOrganization.id, id),
        listMeetingNotes(currentOrganization.id, id).catch(() => []),
        listMeetingDecisions(currentOrganization.id, id).catch(() => []),
        listMeetingActionItems(currentOrganization.id, id).catch(() => []),
        getMeetingActivities(currentOrganization.id, id).catch(() => []),
      ])
      setMeeting(m)
      setNotes(n || [])
      setDecisions(d || [])
      setActionItems(a || [])
      setActivities(act || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentOrganization, id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (meeting?.startTime) {
      const d = new Date(meeting.startTime)
      setNewTime(`${d.toISOString().slice(0, 16)}`)
    }
  }, [meeting?.startTime])

  const handleAddNote = async () => {
    if (!noteText.trim() || !currentOrganization) return
    setSavingNote(true)
    try {
      await createMeetingNotes(currentOrganization.id, { meeting_id: id, content: noteText })
      toast.success('Note added')
      setNoteText('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingNote(false)
    }
  }

  const handleAddDecision = async () => {
    if (!decisionText.trim() || !currentOrganization) return
    setSavingDecision(true)
    try {
      await createMeetingDecision(currentOrganization.id, { meeting_id: id, decision: decisionText })
      toast.success('Decision recorded')
      setDecisionText('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingDecision(false)
    }
  }

  const handleAddAction = async () => {
    if (!actionText.trim() || !currentOrganization) return
    setSavingAction(true)
    try {
      await createMeetingActionItem(currentOrganization.id, { meeting_id: id, description: actionText })
      toast.success('Action item added')
      setActionText('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingAction(false)
    }
  }

  const handleActionStatus = async (item: any, status: string) => {
    if (!currentOrganization) return
    try {
      await updateMeetingActionItem(currentOrganization.id, item.id, { status: status as any })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDecisionStatus = async (decision: any, status: string) => {
    if (!currentOrganization) return
    try {
      await updateMeetingDecisionStatus(currentOrganization.id, decision.id, status as any)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleCancel = async () => {
    if (!currentOrganization) return
    try {
      await cancelMeeting(currentOrganization.id, id)
      toast.success('Meeting cancelled')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleComplete = async () => {
    if (!currentOrganization) return
    try {
      await completeMeeting(currentOrganization.id, id)
      toast.success('Meeting completed')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleReschedule = async () => {
    if (!currentOrganization || !newTime) return
    setRescheduling(true)
    try {
      const iso = new Date(newTime).toISOString()
      await rescheduleMeeting(currentOrganization.id, id, iso)
      toast.success('Meeting rescheduled')
      setShowReschedule(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRescheduling(false)
    }
  }

  const handleConvertToTask = async (item: any) => {
    if (!currentOrganization) return
    setConvertingId(item.id)
    try {
      await convertActionItemToTask(currentOrganization.id, item.id)
      toast.success('Action item converted to task')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setConvertingId(null)
    }
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <CalendarShell orgSlug={orgSlug}>
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
        </CalendarShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <CalendarShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/${orgSlug}/calendar/meetings`} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 flex items-center gap-1 mb-1">
                <ArrowLeft className="h-3 w-3" />Back to meetings
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{meeting?.title}</h1>
                <Badge className={cn('text-[10px]', statusBadge[meeting?.status] || '')}>{meeting?.status}</Badge>
              </div>
              <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                <CalendarDays className="h-3 w-3" />
                {meeting && `${formatDate(meeting.startTime)} · ${new Date(meeting.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} → ${new Date(meeting.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {meeting?.meetingLink && (
                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                  <Button size="sm"><Video className="h-4 w-4 mr-1" />Join</Button>
                </a>
              )}
              {meeting?.status === 'scheduled' || meeting?.status === 'confirmed' ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setShowReschedule(true)}>
                    <Clock className="h-4 w-4 mr-1" />Reschedule
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleComplete}>Complete</Button>
                  <Button size="sm" variant="destructive" onClick={handleCancel}>Cancel Meeting</Button>
                </>
              ) : null}
            </div>
          </div>

          {meeting && (meeting.companyId || meeting.contactId || meeting.dealId || meeting.leadId || meeting.employeeId || meeting.projectId) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-400">Related:</span>
              {meeting.companyId && <Link href={`/${orgSlug}/crm`}><Badge variant="outline">Company</Badge></Link>}
              {meeting.dealId && <Link href={`/${orgSlug}/crm`}><Badge variant="outline">Deal</Badge></Link>}
              {meeting.contactId && <Link href={`/${orgSlug}/crm`}><Badge variant="outline">Contact</Badge></Link>}
              {meeting.leadId && <Link href={`/${orgSlug}/crm`}><Badge variant="outline">Lead</Badge></Link>}
              {meeting.employeeId && <Badge variant="outline">Employee</Badge>}
              {meeting.projectId && <Link href={`/${orgSlug}/projects`}><Badge variant="outline">Project</Badge></Link>}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4" />Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {notes.length === 0 && <p className="text-sm text-zinc-400">No notes yet</p>}
                {notes.map((note: any) => (
                  <div key={note.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">{formatDate(note.createdAt)}</p>
                  </div>
                ))}
                <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add meeting notes..." />
                <Button size="sm" onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
                  {savingNote && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}Add note
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><Gavel className="h-4 w-4" />Decisions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {decisions.length === 0 && <p className="text-sm text-zinc-400">No decisions recorded</p>}
                {decisions.map((decision: any) => (
                  <div key={decision.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-sm">{decision.decision}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">{decision.status}</Badge>
                      <select
                        className="text-xs rounded border border-zinc-200 bg-white px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950"
                        value={decision.status}
                        onChange={e => handleDecisionStatus(decision, e.target.value)}
                      >
                        <option value="open">open</option>
                        <option value="in_progress">in progress</option>
                        <option value="done">done</option>
                        <option value="blocked">blocked</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
                <Textarea value={decisionText} onChange={e => setDecisionText(e.target.value)} placeholder="Record a decision..." />
                <Button size="sm" onClick={handleAddDecision} disabled={savingDecision || !decisionText.trim()}>
                  {savingDecision && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}Record decision
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><CheckSquare className="h-4 w-4" />Action Items</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {actionItems.length === 0 && <p className="text-sm text-zinc-400">No action items</p>}
              {actionItems.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <button
                    onClick={() => handleActionStatus(item, item.status === 'done' ? 'open' : 'done')}
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                      item.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'
                    )}
                    title="Toggle done"
                  >
                    {item.status === 'done' && <CheckSquare className="h-3 w-3" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', item.status === 'done' && 'line-through text-zinc-400')}>{item.description}</p>
                    {item.dueDate && <p className="text-[10px] text-zinc-400 mt-0.5">Due {formatDate(item.dueDate)}</p>}
                  </div>
                  <select
                    className="text-xs rounded border border-zinc-200 bg-white px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950"
                    value={item.status}
                    onChange={e => handleActionStatus(item, e.target.value)}
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in progress</option>
                    <option value="done">done</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!item.taskId || convertingId === item.id}
                    onClick={() => handleConvertToTask(item)}
                    title={item.taskId ? 'Already linked to a task' : 'Convert to a tracked task'}
                  >
                    {convertingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                    <span className="ml-1">{item.taskId ? 'Linked' : 'To task'}</span>
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={actionText} onChange={e => setActionText(e.target.value)} placeholder="Add an action item..." />
                <Button onClick={handleAddAction} disabled={savingAction || !actionText.trim()}>
                  {savingAction && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><History className="h-4 w-4" />Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {activities.length === 0 && <p className="text-sm text-zinc-400">No activity yet</p>}
              <div className="space-y-2">
                {activities.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-2.5 text-sm dark:border-zinc-800">
                    <Badge variant="outline" className="text-[9px] shrink-0">{a.action}</Badge>
                    <span className="text-xs text-zinc-500 truncate">{a.description}</span>
                    <span className="ml-auto text-[10px] text-zinc-400 shrink-0">{formatDate(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Reschedule Meeting</DialogTitle>
              <DialogDescription>Set a new start time. The duration will be preserved.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input label="New start time" type="datetime-local" value={newTime} onChange={e => setNewTime(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReschedule(false)}>Cancel</Button>
              <Button onClick={handleReschedule} disabled={rescheduling || !newTime}>
                {rescheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reschedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CalendarShell>
    </DashboardShell>
  )
}