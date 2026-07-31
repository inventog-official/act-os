'use client'

import { useState, use, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Loader2, Clock, MapPin, Repeat, Trash2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CalendarShell } from '@/components/calendar/calendar-shell'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import { listEvents, createEvent, deleteEvent, updateEventStatus } from '@/lib/actions/calendar'
import { toast } from 'sonner'

const eventTypeConfig: Record<string, { label: string; dot: string; chip: string }> = {
  task: { label: 'Task', dot: 'bg-blue-500', chip: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  milestone: { label: 'Milestone', dot: 'bg-purple-500', chip: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
  meeting: { label: 'Meeting', dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  deadline: { label: 'Deadline', dot: 'bg-red-500', chip: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
  reminder: { label: 'Reminder', dot: 'bg-amber-500', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  event: { label: 'Event', dot: 'bg-teal-500', chip: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400' },
  appointment: { label: 'Appointment', dot: 'bg-indigo-500', chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' },
  call: { label: 'Call', dot: 'bg-orange-500', chip: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
}

export default function CalendarPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const today = new Date()
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [focusDate, setFocusDate] = useState(today)
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '', date: '', time: '', end_time: '', type: 'event',
    location: '', meeting_link: '', all_day: false, timezone: 'UTC', description: '',
  })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      const from = new Date(focusDate)
      from.setDate(from.getDate() - 15)
      const to = new Date(focusDate)
      to.setDate(to.getDate() + 45)
      const data = await listEvents(currentOrganization.id, {
        startDate: from.toISOString(),
        endDate: to.toISOString(),
        includeRecurring: true,
      })
      setEvents(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [focusDate, currentOrganization])

  useEffect(() => { fetchData() }, [fetchData])

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const getEventsOn = (day: Date) =>
    events.filter(e => {
      const d = new Date(e.startDate)
      return sameDay(d, day) && e.status !== 'cancelled'
    })

  const weekDays = useMemo(() => {
    const start = new Date(focusDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [focusDate])

  const navigate = (dir: 1 | -1) => {
    const d = new Date(focusDate)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir)
    else if (view === 'day') d.setDate(d.getDate() + dir)
    else d.setDate(d.getDate() + 30 * dir)
    setFocusDate(d)
    setSelectedDay(null)
  }

  useEffect(() => {
    setCurrentMonth(focusDate.getMonth())
    setCurrentYear(focusDate.getFullYear())
  }, [focusDate])

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const prefix = Array.from({ length: firstDayOfMonth }, (_, i) => null)

  const getEventsForDay = (day: number) =>
    events.filter(e => {
      const eventDate = new Date(e.startDate)
      return eventDate.getDate() === day && eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
    })

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const handleAddEvent = async () => {
    if (!formData.title.trim() || !formData.date || !currentOrganization) return
    setSaving(true)
    try {
      const startDate = formData.all_day
        ? `${formData.date}T00:00:00`
        : formData.time
          ? `${formData.date}T${formData.time}`
          : `${formData.date}T09:00:00`
      const endDate = formData.all_day
        ? `${formData.date}T23:59:59`
        : formData.end_time
          ? `${formData.date}T${formData.end_time}`
          : undefined
      await createEvent(currentOrganization.id, {
        title: formData.title,
        description: formData.description || undefined,
        event_type: formData.type as any,
        start_date: startDate,
        end_date: endDate,
        all_day: formData.all_day,
        location: formData.location || undefined,
        meeting_link: formData.meeting_link || undefined,
        timezone: formData.timezone,
      })
      toast.success('Event created')
      setShowAdd(false)
      setFormData({ title: '', date: '', time: '', end_time: '', type: 'event', location: '', meeting_link: '', all_day: false, timezone: 'UTC', description: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e: any) => {
    if (!currentOrganization) return
    try {
      await deleteEvent(currentOrganization.id, e.id)
      toast.success('Event deleted')
      setSelectedEvent(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleCancel = async (e: any) => {
    if (!currentOrganization) return
    try {
      await updateEventStatus(currentOrganization.id, e.id, 'cancelled')
      toast.success('Event cancelled')
      setSelectedEvent(null)
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
              <h1 className="text-2xl font-semibold">Calendar</h1>
              <p className="text-sm text-zinc-500">{events.length} events this month</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium min-w-[140px] text-center">{monthName} {currentYear}</span>
                <Button variant="ghost" size="icon-sm" onClick={() => navigate(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setFocusDate(new Date()); setSelectedDay(new Date().getDate()) }}>
                Today
              </Button>
              <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5">
                {(['month', 'week', 'day', 'agenda'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors',
                      view === v ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <Button onClick={() => {
                const d = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
                setFormData({ ...formData, date: view === 'day' || view === 'week' || view === 'agenda' ? focusDate.toISOString().slice(0, 10) : d })
                setShowAdd(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
            {Object.entries(eventTypeConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
                ) : view === 'week' ? (
                  <div className="grid grid-cols-7 gap-px">
                    {weekDays.map((day, i) => {
                      const dayEvents = getEventsOn(day)
                      const isToday = sameDay(day, new Date())
                      return (
                        <div key={i} className={cn('min-h-[320px] p-1.5', isToday && 'bg-blue-50 dark:bg-blue-950/30')}>
                          <div className="text-center">
                            <p className="text-[10px] uppercase text-zinc-400">{day.toLocaleDateString('default', { weekday: 'short' })}</p>
                            <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-sm', isToday && 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-medium')}>
                              {day.getDate()}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {dayEvents.slice(0, 6).map(event => {
                              const cfg = eventTypeConfig[event.eventType] || eventTypeConfig.event
                              return (
                                <div
                                  key={event.id || `${event.title}-${event.startDate}`}
                                  onClick={(e) => { e.stopPropagation(); if (event.id) setSelectedEvent(event) }}
                                  className="rounded px-1.5 py-1 cursor-pointer text-[10px] font-medium truncate"
                                  style={{ backgroundColor: (event.color || '#3b82f6') + '22' }}
                                >
                                  {!event.allDay && (
                                    <span className="text-[9px] text-zinc-400 mr-1">{formatDate(event.startDate, { hour: 'numeric', minute: '2-digit' })}</span>
                                  )}
                                  {event.title}
                                </div>
                              )
                            })}
                            {dayEvents.length > 6 && <p className="text-[9px] text-zinc-400 pl-1">+{dayEvents.length - 6} more</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : view === 'day' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium mb-3">{focusDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    {getEventsOn(focusDate).length === 0 && <p className="text-sm text-zinc-400 py-8 text-center">No events this day</p>}
                    {[...getEventsOn(focusDate)].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(event => {
                      const cfg = eventTypeConfig[event.eventType] || eventTypeConfig.event
                      return (
                        <button
                          key={event.id || `${event.title}-${event.startDate}`}
                          onClick={() => event.id && setSelectedEvent(event)}
                          className="w-full text-left rounded-lg border border-zinc-200 p-3 hover:border-zinc-400 transition-colors dark:border-zinc-800 dark:hover:border-zinc-600"
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', cfg.dot)} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{event.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[9px]">{cfg.label}</Badge>
                                {!event.allDay && (
                                  <span className="text-[10px] text-zinc-400">
                                    {formatDate(event.startDate, { hour: 'numeric', minute: '2-digit' })} – {event.endDate ? formatDate(event.endDate, { hour: 'numeric', minute: '2-digit' }) : ''}
                                  </span>
                                )}
                                {event.recurrenceRule && <Repeat className="h-3 w-3 text-zinc-400" />}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : view === 'agenda' ? (
                  <div className="space-y-1">
                    {[...events].filter(e => e.status !== 'cancelled' && new Date(e.startDate) >= new Date(focusDate)).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).length === 0 && (
                      <p className="text-sm text-zinc-400 py-8 text-center">No upcoming events</p>
                    )}
                    {[...events].filter(e => e.status !== 'cancelled' && new Date(e.startDate) >= new Date(focusDate)).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(event => {
                      const cfg = eventTypeConfig[event.eventType] || eventTypeConfig.event
                      return (
                        <button
                          key={event.id || `${event.title}-${event.startDate}`}
                          onClick={() => event.id && setSelectedEvent(event)}
                          className="w-full text-left rounded-lg border border-zinc-100 px-3 py-2.5 hover:border-zinc-400 transition-colors dark:border-zinc-800 dark:hover:border-zinc-600"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-32 shrink-0 text-[11px] text-zinc-400">
                              {formatDate(event.startDate, { weekday: 'short', month: 'short', day: 'numeric' })}
                              {!event.allDay && ` · ${formatDate(event.startDate, { hour: 'numeric', minute: '2-digit' })}`}
                            </div>
                            <div className={cn('h-2 w-2 rounded-full shrink-0', cfg.dot)} />
                            <p className="text-sm font-medium truncate">{event.title}</p>
                            <Badge variant="outline" className="text-[9px] ml-auto shrink-0">{cfg.label}</Badge>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-px">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <div key={day} className="p-2 text-center text-xs font-medium text-zinc-400">{day.slice(0, 3)}</div>
                    ))}
                    {prefix.map((_, i) => <div key={`p-${i}`} className="min-h-[90px] p-2" />)}
                    {days.map(day => {
                      const dayEvents = getEventsForDay(day)
                      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                      return (
                        <div
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={cn(
                            'min-h-[90px] border-t border-zinc-100 p-1.5 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 transition-colors',
                            isToday && 'bg-blue-50 dark:bg-blue-950/30'
                          )}
                        >
                          <span className={cn(
                            'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm',
                            isToday && 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-medium'
                          )}>
                            {day}
                          </span>
                          <div className="mt-1 space-y-0.5">
                            {dayEvents.slice(0, 3).map(event => {
                              const cfg = eventTypeConfig[event.eventType] || eventTypeConfig.event
                              return (
                                <div
                                  key={event.id || `${event.title}-${event.startDate}`}
                                  onClick={(e) => { e.stopPropagation(); if (event.id) setSelectedEvent(event) }}
                                  className={cn(
                                    'flex items-center gap-1 rounded px-1 py-0.5 cursor-pointer',
                                    event.status === 'cancelled' && 'opacity-50 line-through'
                                  )}
                                  style={{ backgroundColor: (event.color || '#3b82f6') + '22' }}
                                >
                                  <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
                                  <span className="text-[10px] truncate font-medium">{event.title}</span>
                                </div>
                              )
                            })}
                            {dayEvents.length > 3 && (
                              <span className="text-[9px] text-zinc-400 pl-1">+{dayEvents.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-medium">
                    {view === 'month'
                      ? (selectedDay ? `${monthName} ${selectedDay}, ${currentYear}` : 'Select a day')
                      : focusDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {(() => {
                    const sidebarEvents = view === 'month' ? selectedDayEvents : getEventsOn(focusDate)
                    return (
                      <>
                        {sidebarEvents.length === 0 && (
                          <p className="text-sm text-zinc-400 text-center py-4">No events</p>
                        )}
                        <div className="space-y-2">
                          {sidebarEvents.map(event => {
                      const cfg = eventTypeConfig[event.eventType] || eventTypeConfig.event
                      return (
                        <button
                          key={event.id || `${event.title}-${event.startDate}`}
                          onClick={() => event.id && setSelectedEvent(event)}
                          className="w-full text-left rounded-lg border border-zinc-200 p-3 hover:border-zinc-400 transition-colors dark:border-zinc-800 dark:hover:border-zinc-600"
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', cfg.dot)} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{event.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-[9px]">{cfg.label}</Badge>
                                {!event.allDay && (
                                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{formatDate(event.startDate, { hour: 'numeric', minute: '2-digit' })}
                                  </span>
                                )}
                                {event.recurrenceRule && (
                                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                    <Repeat className="h-3 w-3" />Recurring
                                  </span>
                                )}
                              </div>
                              {event.location && (
                                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />{event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const dayStr = view === 'month' && selectedDay
                    ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
                    : focusDate.toISOString().slice(0, 10)
                  setFormData({ ...formData, date: dayStr })
                  setShowAdd(true)
                }}
                disabled={view === 'month' && !selectedDay}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
              <DialogDescription>Create a new calendar event</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input label="Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Event title" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date *" type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                <div>
                  <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Type</label>
                  <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(eventTypeConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start time" type="time" value={formData.time} onChange={e => setFormData(p => ({ ...p, time: e.target.value }))} disabled={formData.all_day} />
                <Input label="End time" type="time" value={formData.end_time} onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))} disabled={formData.all_day} />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <input type="checkbox" checked={formData.all_day} onChange={e => setFormData(p => ({ ...p, all_day: e.target.checked }))} />
                All day
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Location" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Room, address..." />
                <Input label="Meeting link" value={formData.meeting_link} onChange={e => setFormData(p => ({ ...p, meeting_link: e.target.value }))} placeholder="https://..." />
              </div>
              <Input label="Timezone" value={formData.timezone} onChange={e => setFormData(p => ({ ...p, timezone: e.target.value }))} />
              <div>
                <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea
                  className="w-full min-h-[60px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Add details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAddEvent} disabled={saving || !formData.title.trim() || !formData.date}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
              <DialogDescription>
                {selectedEvent && `${formatDate(selectedEvent.startDate)}${selectedEvent.endDate ? ' → ' + formatDate(selectedEvent.endDate) : ''}`}
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{eventTypeConfig[selectedEvent.eventType]?.label || selectedEvent.eventType}</Badge>
                  {selectedEvent.status === 'cancelled' && <Badge variant="destructive">Cancelled</Badge>}
                  {selectedEvent.recurrenceRule && <Badge variant="outline"><Repeat className="h-3 w-3 mr-1" />Recurring</Badge>}
                </div>
                {selectedEvent.description && <p className="text-sm text-zinc-600 dark:text-zinc-300">{selectedEvent.description}</p>}
                {selectedEvent.location && (
                  <p className="text-sm text-zinc-500 flex items-center gap-2"><MapPin className="h-4 w-4" />{selectedEvent.location}</p>
                )}
                {selectedEvent.meetingLink && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    <a href={selectedEvent.meetingLink} target="_blank" rel="noopener noreferrer" className="underline">Join meeting</a>
                  </p>
                )}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {selectedEvent.status !== 'cancelled' && (
                    <Button variant="outline" size="sm" onClick={() => handleCancel(selectedEvent)}>
                      <XCircle className="h-4 w-4 mr-1" />Cancel
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedEvent)}>
                    <Trash2 className="h-4 w-4 mr-1" />Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CalendarShell>
    </DashboardShell>
  )
}