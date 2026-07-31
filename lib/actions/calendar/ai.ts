'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCalendarTool } from '@/lib/ai/calendar-tools'
import { listEvents, getEvent, createEvent, updateEvent, updateEventStatus, listEventParticipants, duplicateEvent, rescheduleEvent, editRecurringOccurrence, updateRecurringSeries, cancelRecurringSeries } from './events'
import { listAvailability, getTeamAvailability, findScheduleSlot, detectConflictsForUsers } from './availability'
import { listMeetings, getMeeting, getMeetingSummary, createMeeting, cancelMeeting, completeMeeting, rescheduleMeeting, listMeetingActionItems, listMeetingDecisions, listMeetingNotes, getMeetingHistory, getMeetingActivities, convertActionItemToTask } from './meetings'
import { listThreads, listMessages, getMyThreads, listEmailConnections, listEmailMessages, sendEmail, searchMessages, getEntityCommunication, getCommunicationGraph } from './communication'
import { searchCalendar } from './search'

export async function calendarAIAction(name: string, organizationId: string, args?: Record<string, unknown>) {
  const tool = getCalendarTool(name)
  if (!tool) throw new Error(`Unknown calendar tool: ${name}`)
  if (!organizationId) throw new Error('Organization is required')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (tool.requiresApproval && tool.risk !== 'low') {
    return {
      requiresApproval: true,
      tool: name,
      risk: tool.risk,
      message: 'This action requires approval before execution.',
    }
  }

  const results: Record<string, unknown> = {}
  const input = (args as any)?.input

  if (name === 'list_upcoming_events') results.data = await listEvents(organizationId, { startDate: new Date().toISOString(), includeRecurring: true })
  else if (name === 'get_event_details') results.data = await getEvent(organizationId, String(args?.eventId))
  else if (name === 'get_team_availability') {
    const userIds = ((args as any)?.userIds as string[]) ?? []
    results.data = await getTeamAvailability(organizationId, userIds, new Date())
  }
  else if (name === 'find_schedule_slot') results.data = await findScheduleSlot(organizationId, input)
  else if (name === 'list_meetings') results.data = await listMeetings(organizationId)
  else if (name === 'get_meeting_summary') results.data = await getMeetingSummary(organizationId, String(args?.meetingId))
  else if (name === 'list_meeting_action_items') results.data = await listMeetingActionItems(organizationId, String(args?.meetingId))
  else if (name === 'list_meeting_decisions') results.data = await listMeetingDecisions(organizationId, String(args?.meetingId))
  else if (name === 'list_meeting_notes') results.data = await listMeetingNotes(organizationId, String(args?.meetingId))
  else if (name === 'list_communication_threads') results.data = await listThreads(organizationId)
  else if (name === 'get_thread_messages') results.data = await listMessages(organizationId, String(args?.threadId))
  else if (name === 'get_my_threads') results.data = await getMyThreads(organizationId)
  else if (name === 'list_email_connections') results.data = await listEmailConnections(organizationId)
  else if (name === 'list_email_messages') results.data = await listEmailMessages(organizationId)
  else if (name === 'create_event') results.data = await createEvent(organizationId, input, (args as any)?.recurrence)
  else if (name === 'update_event') results.data = await updateEvent(organizationId, String(args?.eventId), input)
  else if (name === 'cancel_event') results.data = await updateEventStatus(organizationId, String(args?.eventId), 'cancelled')
  else if (name === 'schedule_meeting') results.data = await createMeeting(organizationId, input, (args as any)?.participants)
  else if (name === 'cancel_meeting') results.data = await cancelMeeting(organizationId, String(args?.meetingId))
  else if (name === 'complete_meeting') results.data = await completeMeeting(organizationId, String(args?.meetingId))
  else if (name === 'send_email') results.data = await sendEmail(organizationId, input)
  else if (name === 'find_availability') {
    const userIds = ((args as any)?.userIds as string[]) ?? []
    results.data = await detectConflictsForUsers(organizationId, userIds, new Date(String(args?.start)), new Date(String(args?.end)))
  }
  else if (name === 'get_meeting_history') results.data = await getMeetingHistory(organizationId, args as any)
  else if (name === 'get_meeting_activities') results.data = await getMeetingActivities(organizationId, String(args?.meetingId))
  else if (name === 'reschedule_meeting') results.data = await rescheduleMeeting(organizationId, String(args?.meetingId), String(args?.startTime), args?.endTime ? String(args?.endTime) : undefined, String(args?.reason ?? ''))
  else if (name === 'duplicate_event') results.data = await duplicateEvent(organizationId, { event_id: String(args?.eventId), start_date: args?.newStartDate ? String(args?.newStartDate) : undefined })
  else if (name === 'reschedule_event') results.data = await rescheduleEvent(organizationId, { event_id: String(args?.eventId), start_date: String(args?.startDate), end_date: args?.endDate ? String(args?.endDate) : undefined })
  else if (name === 'edit_recurring_occurrence') results.data = await editRecurringOccurrence(organizationId, String(args?.parentId), String(args?.occurrenceDate), input)
  else if (name === 'update_recurring_series') results.data = await updateRecurringSeries(organizationId, String(args?.eventId), input)
  else if (name === 'cancel_recurring_series') results.data = await cancelRecurringSeries(organizationId, String(args?.parentId), args?.allOccurrences ? undefined : String(args?.occurrenceDate))
  else if (name === 'convert_action_item_to_task') results.data = await convertActionItemToTask(organizationId, String(args?.actionItemId), { projectId: args?.projectId ? String(args.projectId) : undefined, title: args?.title ? String(args.title) : undefined })
  else if (name === 'get_entity_communication') results.data = await getEntityCommunication(organizationId, String(args?.entityType), String(args?.entityId))
  else if (name === 'get_communication_graph') results.data = await getCommunicationGraph(organizationId, String(args?.entityType), String(args?.entityId))
  else if (name === 'search_messages') results.data = await searchMessages(organizationId, String(args?.query))
  else if (name === 'search_calendar') results.data = await searchCalendar(organizationId, String(args?.query))
  else throw new Error(`Unsupported calendar tool: ${name}`)

  return { ...results, tool: name, audited: tool.audited, reversible: tool.reversible }
}

export async function calendarAssistantAnswer(question: string, organizationId: string) {
  const q = question.toLowerCase()

  if (q.includes('meeting') && (q.includes('today') || q.includes('upcoming') || q.includes('next'))) {
    const meetings = await listMeetings(organizationId, { startTime: new Date().toISOString() })
    return {
      answer: `You have ${meetings.length} upcoming meeting${meetings.length === 1 ? '' : 's'} scheduled.`,
      data: { meetings: meetings.slice(0, 10) },
    }
  }

  if (q.includes('event') && (q.includes('today') || q.includes('upcoming') || q.includes('next'))) {
    const events = await listEvents(organizationId, { startDate: new Date().toISOString(), includeRecurring: true })
    return {
      answer: `You have ${events.length} upcoming events on your calendar.`,
      data: { events: events.slice(0, 10) },
    }
  }

  if (q.includes('availability') || q.includes('available')) {
    const availability = await listAvailability(organizationId)
    return {
      answer: `You have ${availability.length} weekly availability slots configured.`,
      data: { availability },
    }
  }

  if (q.includes('email') || q.includes('inbox')) {
    const emails = await listEmailMessages(organizationId)
    return {
      answer: `You have ${emails.length} emails recorded.`,
      data: { emails: emails.slice(0, 10) },
    }
  }

  if (q.includes('thread') || q.includes('message') || q.includes('communication')) {
    const threads = await getMyThreads(organizationId)
    return {
      answer: `You are participating in ${threads.length} conversation thread${threads.length === 1 ? '' : 's'}.`,
      data: { threads: threads.slice(0, 10) },
    }
  }

  if (q.includes('action item') || q.includes('to-do') || q.includes('todo')) {
    const meetings = await listMeetings(organizationId)
    let open = 0
    for (const m of meetings.slice(0, 20)) {
      const items = await listMeetingActionItems(organizationId, m.id)
      open += items.filter(i => i.status !== 'done' && i.status !== 'cancelled').length
    }
    return {
      answer: `You have ${open} open action items across your meetings.`,
      data: { openActionItems: open },
    }
  }

  return {
    answer: `Your calendar has ${(await listEvents(organizationId, { includeRecurring: true })).length} events and ${(await listMeetings(organizationId)).length} meetings on record.`,
  }
}