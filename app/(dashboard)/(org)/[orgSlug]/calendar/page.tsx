'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar as CalendarIcon, Clock, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

const eventTypeConfig = {
  task: { label: 'Task', color: 'bg-blue-500', dot: 'bg-blue-500' },
  milestone: { label: 'Milestone', color: 'bg-purple-500', dot: 'bg-purple-500' },
  meeting: { label: 'Meeting', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
  deadline: { label: 'Deadline', color: 'bg-red-500', dot: 'bg-red-500' },
} as const

type EventType = keyof typeof eventTypeConfig

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: EventType
  description?: string
  time?: string
}

export default function CalendarPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ title: '', date: '', type: 'meeting' as EventType, description: '', time: '' })

  const fetchData = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString()
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString()

      const [eRes, tRes] = await Promise.all([
        supabase.from('calendar_events')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
          .is('deleted_at', null)
          .order('date', { ascending: true }),
        supabase.from('tasks')
          .select('id, title, due_date, status')
          .eq('organization_id', currentOrganization.id)
          .not('due_date', 'is', null)
          .gte('due_date', startOfMonth)
          .lte('due_date', endOfMonth)
          .is('deleted_at', null),
      ])

      const calendarEvents: CalendarEvent[] = (eRes.data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        type: e.type || 'meeting',
        description: e.description,
        time: e.time,
      }))

      const taskEvents: CalendarEvent[] = (tRes.data || []).map((t: any) => ({
        id: `task-${t.id}`,
        title: t.title,
        date: t.due_date,
        type: 'task' as EventType,
        description: t.status,
      }))

      setEvents([...calendarEvents, ...taskEvents])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth, currentYear, currentOrganization, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const prefix = Array.from({ length: firstDayOfMonth }, (_, i) => null)

  const getEventsForDay = (day: number) =>
    events.filter(e => {
      const eventDate = new Date(e.date)
      return eventDate.getDate() === day && eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
    })

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const handleAddEvent = async () => {
    if (!formData.title.trim() || !formData.date || !currentOrganization) return
    setSaving(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      const { error } = await supabase.from('calendar_events').insert({
        title: formData.title,
        date: new Date(formData.date).toISOString(),
        type: formData.type,
        description: formData.description || null,
        time: formData.time || null,
        organization_id: currentOrganization.id,
        created_by: user?.id,
      })
      if (error) throw error
      toast.success('Event added')
      setShowAdd(false)
      setFormData({ title: '', date: '', type: 'meeting', description: '', time: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Calendar</h1>
            <p className="text-sm text-zinc-500">{events.length} events this month</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800">
              <Button variant="ghost" size="icon-sm" onClick={() => {
                if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
                else setCurrentMonth(m => m - 1)
              }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium min-w-[140px] text-center">{monthName} {currentYear}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => {
                if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
                else setCurrentMonth(m => m + 1)
              }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => {
              setFormData({ ...formData, date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` })
              setShowAdd(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {Object.entries(eventTypeConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn('h-2 w-2 rounded-full', cfg.dot)} />
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
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
                            const cfg = eventTypeConfig[event.type] || eventTypeConfig.meeting
                            return (
                              <div
                                key={event.id}
                                className="flex items-center gap-1 rounded px-1 py-0.5"
                                style={{ backgroundColor: cfg.color.replace('bg-', '').replace('-500', '') + '15' }}
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
                  {selectedDay
                    ? `${monthName} ${selectedDay}, ${currentYear}`
                    : 'Select a day'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {selectedDay && selectedDayEvents.length === 0 && (
                  <p className="text-sm text-zinc-400 text-center py-4">No events</p>
                )}
                <div className="space-y-2">
                  {selectedDayEvents.map(event => {
                    const cfg = eventTypeConfig[event.type] || eventTypeConfig.meeting
                    return (
                      <div key={event.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="flex items-start gap-2">
                          <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', cfg.dot)} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[9px]">{cfg.label}</Badge>
                              {event.time && (
                                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />{event.time}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-zinc-400 mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (selectedDay) {
                    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
                    setFormData({ ...formData, date: dayStr })
                  }
                  setShowAdd(true)
                }}
                disabled={!selectedDay}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>Create a new calendar event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Title *"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="Event title"
            />
            <Input
              label="Date *"
              type="date"
              value={formData.date}
              onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
            />
            <Input
              label="Time"
              type="time"
              value={formData.time}
              onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Type</label>
              <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v as EventType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
    </DashboardShell>
  )
}
