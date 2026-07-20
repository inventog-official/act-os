'use client'

import { useState, use } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { cn } from '@/lib/utils'

const events = [
  { day: 12, title: 'Design Review', time: '10:00 AM - 11:00 AM', color: 'bg-blue-500', type: 'Meeting' },
  { day: 14, title: 'Sprint Planning', time: '2:00 PM - 3:30 PM', color: 'bg-emerald-500', type: 'Planning' },
  { day: 17, title: 'Client Meeting', time: '11:00 AM - 12:00 PM', color: 'bg-amber-500', type: 'Client' },
  { day: 19, title: 'Team Standup', time: '9:00 AM - 9:30 AM', color: 'bg-purple-500', type: 'Recurring' },
  { day: 22, title: 'Quarterly Review', time: '1:00 PM - 3:00 PM', color: 'bg-red-500', type: 'Review' },
  { day: 28, title: 'Product Launch', time: '10:00 AM - 11:00 AM', color: 'bg-cyan-500', type: 'Launch' },
]

export default function CalendarPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear] = useState(today.getFullYear())

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const prefix = Array.from({ length: firstDayOfMonth }, (_, i) => null)

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
              <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(m => m - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium">{monthName} {currentYear}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(m => m + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-px">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-zinc-400">{day.slice(0, 3)}</div>
              ))}
              {prefix.map((_, i) => <div key={`p-${i}`} className="min-h-[100px] p-2" />)}
              {days.map(day => {
                const dayEvents = events.filter(e => e.day === day)
                const isToday = day === today.getDate() && currentMonth === today.getMonth()
                return (
                  <div
                    key={day}
                    className={cn(
                      'min-h-[100px] border-t border-zinc-100 p-2 dark:border-zinc-800',
                      isToday && 'bg-zinc-50 dark:bg-zinc-900'
                    )}
                  >
                    <span className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm',
                      isToday && 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-medium'
                    )}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.map(event => (
                        <div
                          key={`${event.day}-${event.title}`}
                          className="rounded-md px-1.5 py-0.5 text-[10px] cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: event.color.replace('bg-', '').replace('-500', '') + '20' }}
                        >
                          <div className="flex items-center gap-1">
                            <div className={cn('h-1.5 w-1.5 rounded-full', event.color)} />
                            <span className="truncate font-medium">{event.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          {events.map(event => (
            <div key={`${event.day}-${event.title}`} className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex flex-col items-center min-w-[48px]">
                <span className="text-lg font-semibold">{event.day}</span>
                <span className="text-xs text-zinc-400">{monthName.slice(0, 3)}</span>
              </div>
              <div className={cn('h-10 w-1 rounded-full', event.color)} />
              <div className="flex-1">
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-zinc-500">{event.time}</p>
              </div>
              <Badge variant="outline">{event.type}</Badge>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}
