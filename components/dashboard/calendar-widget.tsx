'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const events = [
  { day: 12, title: 'Design Review', time: '10:00 AM', color: 'bg-blue-500' },
  { day: 14, title: 'Sprint Planning', time: '2:00 PM', color: 'bg-emerald-500' },
  { day: 17, title: 'Client Meeting', time: '11:00 AM', color: 'bg-amber-500' },
  { day: 19, title: 'Team Standup', time: '9:00 AM', color: 'bg-purple-500' },
]

export function CalendarWidget() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear] = useState(today.getFullYear())

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const prefix = Array.from({ length: firstDayOfMonth }, (_, i) => null)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Calendar</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(m => m - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{monthName} {currentYear}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setCurrentMonth(m => m + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {prefix.map((_, i) => <div key={`p-${i}`} />)}
          {days.map(day => {
            const dayEvents = events.filter(e => e.day === day)
            const isToday = day === today.getDate() && currentMonth === today.getMonth()
            return (
              <div
                key={day}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors',
                  isToday && 'bg-zinc-900 text-white font-medium dark:bg-zinc-50 dark:text-zinc-900',
                  dayEvents.length > 0 && !isToday && 'font-semibold text-zinc-900 dark:text-zinc-100',
                  !isToday && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                {day}
              </div>
            )
          })}
        </div>

        {events.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {events.slice(0, 3).map(event => (
              <div key={`${event.day}-${event.title}`} className="flex items-center gap-3">
                <div className={cn('h-2 w-2 rounded-full shrink-0', event.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{event.title}</p>
                  <p className="text-xs text-zinc-400">{event.time}</p>
                </div>
                <span className="text-xs text-zinc-400">Day {event.day}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
