-- ACT OS Phase 8 — Demo seed data for Calendar, Communication & Meetings
-- Requires: demo org (10000000-0000-0000-0000-00000000000a) and demo user
-- (00000000-0000-0000-0000-00000000000a) to exist.

INSERT INTO calendar_events (
  organization_id, project_id, task_id, title, description, event_type,
  start_date, end_date, all_day, color, timezone, location, meeting_link,
  organizer_id, reminder_minutes, status, recurrence_rule, created_by
) VALUES
  (
    '10000000-0000-0000-0000-00000000000a', NULL, NULL,
    'Weekly Engineering Standup', 'Quick sync on active workstreams.',
    'meeting', NOW() + INTERVAL '1 day 9 hours', NOW() + INTERVAL '1 day 9 hours 30 minutes',
    FALSE, '#10b981', 'UTC', 'Conference Room B', 'https://meet.example.com/standup',
    '00000000-0000-0000-0000-00000000000a', '{15}', 'scheduled', NULL,
    '00000000-0000-0000-0000-00000000000a'
  ),
  (
    '10000000-0000-0000-0000-00000000000a', NULL, NULL,
    'Product Roadmap Review', 'Review quarterly roadmap milestones.',
    'milestone', NOW() + INTERVAL '3 days 14 hours', NOW() + INTERVAL '3 days 15 hours',
    FALSE, '#8b5cf6', 'UTC', 'Boardroom', NULL,
    '00000000-0000-0000-0000-00000000000a', '{60}', 'scheduled', NULL,
    '00000000-0000-0000-0000-00000000000a'
  ),
  (
    '10000000-0000-0000-0000-00000000000a', NULL, NULL,
    'Payroll Submission Deadline', NULL, 'deadline',
    NOW() + INTERVAL '5 days 17 hours', NULL,
    FALSE, '#ef4444', 'UTC', NULL, NULL,
    '00000000-0000-0000-0000-00000000000a', '{1440,120}', 'scheduled', NULL,
    '00000000-0000-0000-0000-00000000000a'
  ),
  (
    '10000000-0000-0000-0000-00000000000a', NULL, NULL,
    'Weekly Client Success Sync', NULL, 'meeting',
    NOW() - INTERVAL '7 days 10 hours', NOW() - INTERVAL '7 days 10 hours 30 minutes',
    FALSE, '#10b981', 'UTC', 'Zoom', NULL,
    '00000000-0000-0000-0000-00000000000a', '{15}', 'scheduled',
    'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO',
    '00000000-0000-0000-0000-00000000000a'
  )
ON CONFLICT (id) DO NOTHING;

-- Availability: standard working hours Mon-Fri for the demo user
INSERT INTO calendar_availability (user_id, organization_id, day_of_week, start_time, end_time, timezone, is_active) VALUES
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 1, '09:00:00', '17:00:00', 'UTC', TRUE),
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 2, '09:00:00', '17:00:00', 'UTC', TRUE),
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 3, '09:00:00', '17:00:00', 'UTC', TRUE),
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 4, '09:00:00', '17:00:00', 'UTC', TRUE),
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 5, '09:00:00', '17:00:00', 'UTC', TRUE)
ON CONFLICT (user_id, day_of_week) DO NOTHING;

-- Demo meetings
INSERT INTO meetings (
  title, description, meeting_type, status, start_time, end_time, timezone,
  duration_minutes, location, meeting_link, organizer_id, organization_id, created_by
) VALUES
  (
    'Kickoff: ACT OS Phase 8', 'Project kickoff for calendar & communication build.',
    'project', 'completed', NOW() - INTERVAL '14 days 10 hours', NOW() - INTERVAL '14 days 11 hours',
    'UTC', 60, 'Conference Room A', NULL,
    '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a'
  ),
  (
    'Customer Onboarding Call', 'Walk the customer through initial setup.',
    'customer', 'scheduled', NOW() + INTERVAL '2 days 15 hours', NOW() + INTERVAL '2 days 15 hours 30 minutes',
    'UTC', 30, NULL, 'https://meet.example.com/customer',
    '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a'
  )
ON CONFLICT (id) DO NOTHING;

-- Communication thread: demo internal channel
INSERT INTO communication_threads (thread_type, title, organization_id, created_by) VALUES
  ('team', '#general', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO communication_thread_members (thread_id, user_id) VALUES
  ((SELECT id FROM communication_threads WHERE title = '#general' AND organization_id = '10000000-0000-0000-0000-00000000000a' LIMIT 1), '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (thread_id, user_id) DO NOTHING;

INSERT INTO communication_messages (thread_id, sender_id, body, message_type, organization_id) VALUES
  (
    (SELECT id FROM communication_threads WHERE title = '#general' AND organization_id = '10000000-0000-0000-0000-00000000000a' LIMIT 1),
    '00000000-0000-0000-0000-00000000000a',
    'Welcome to the demo workspace. Use the calendar to schedule events and meetings, and track meeting notes, decisions, and action items.',
    'system', '10000000-0000-0000-0000-00000000000a'
  )
ON CONFLICT (id) DO NOTHING;