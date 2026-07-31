-- ACT OS Phase 8 — Calendar, Communication & Meetings
-- Reuses existing entities:
--   auth.users            -> event/meeting organizers & participants
--   projects / tasks      -> event & meeting links, action items become tasks
--   crm_companies / crm_contacts / crm_deals -> customer communication
--   hr_employees / hr_leave_requests / hr_holidays -> availability + HR comms
--   documents             -> meeting notes & document links (Phase 6)
--   notifications         -> meeting/reminder/mention notifications (existing)
--   activities / audit_logs -> audit trail (module-scoped clone convention)
-- Extends the existing calendar_events table (created in 004) rather than
-- duplicating the calendar model. Adds recurrence, participants, availability,
-- meetings, meeting notes/decisions/action items, communication threads,
-- messages, email integration foundation, and calendar provider sync.

-- ============================================================================
-- 1. EXTEND CALENDAR EVENTS (recurrence, location, reminders, provider fields)
-- ============================================================================
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER[] DEFAULT '{}';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS recurrence_exception_date DATE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled','completed'));
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS external_event_id TEXT;

-- Widen event_type to cover general events, appointments and calls.
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_event_type_check
  CHECK (event_type IN ('task','milestone','meeting','deadline','reminder','event','appointment','call'));

CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_parent ON calendar_events(recurrence_parent_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_status ON calendar_events(organization_id, status, start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_organizer ON calendar_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_external ON calendar_events(provider, external_event_id) WHERE provider IS NOT NULL;

-- ============================================================================
-- 2. EVENT PARTICIPANTS
-- ============================================================================
CREATE TABLE calendar_event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','tentative')),
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('organizer','attendee','optional')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE calendar_event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view event participants" ON calendar_event_participants FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Members can add event participants" ON calendar_event_participants FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update event participants" ON calendar_event_participants FOR UPDATE
  USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can delete event participants" ON calendar_event_participants FOR DELETE
  USING (public.is_org_member(organization_id));

CREATE INDEX idx_calendar_event_participants_event ON calendar_event_participants(event_id);
CREATE INDEX idx_calendar_event_participants_user ON calendar_event_participants(user_id, status);

-- ============================================================================
-- 3. AVAILABILITY (per-user working hours + timezone)
-- ============================================================================
CREATE TABLE calendar_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);
ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view availability" ON calendar_availability FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Users can manage own availability" ON calendar_availability FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Users can update availability" ON calendar_availability FOR UPDATE
  USING (public.is_org_member(organization_id) AND (user_id = auth.uid() OR public.is_org_admin(organization_id)))
  WITH CHECK (public.is_org_member(organization_id) AND (user_id = auth.uid() OR public.is_org_admin(organization_id)));
CREATE POLICY "Users can delete availability" ON calendar_availability FOR DELETE
  USING (public.is_org_member(organization_id) AND (user_id = auth.uid() OR public.is_org_admin(organization_id)));

CREATE INDEX idx_calendar_availability_user ON calendar_availability(user_id);
CREATE INDEX idx_calendar_availability_org ON calendar_availability(organization_id);

-- ============================================================================
-- 4. MEETINGS
-- ============================================================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  agenda TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'internal' CHECK (meeting_type IN ('internal','customer','project','one_on_one','recruitment','standup','other')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','rescheduled','cancelled','completed')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  duration_minutes INTEGER,
  location TEXT,
  meeting_link TEXT,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES hr_employees(id) ON DELETE SET NULL,
  provider TEXT,
  provider_meeting_id TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meetings" ON meetings FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create meetings" ON meetings FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update meetings" ON meetings FOR UPDATE
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL)
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can delete meetings" ON meetings FOR DELETE
  USING (public.is_org_member(organization_id));

CREATE INDEX idx_meetings_org ON meetings(organization_id, start_time);
CREATE INDEX idx_meetings_project ON meetings(project_id);
CREATE INDEX idx_meetings_company ON meetings(company_id);
CREATE INDEX idx_meetings_deal ON meetings(deal_id);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);

-- ============================================================================
-- 5. MEETING PARTICIPANTS
-- ============================================================================
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','tentative')),
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('organizer','attendee','optional')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meeting participants" ON meeting_participants FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Members can add meeting participants" ON meeting_participants FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update meeting participants" ON meeting_participants FOR UPDATE
  USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can delete meeting participants" ON meeting_participants FOR DELETE
  USING (public.is_org_member(organization_id));

CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user ON meeting_participants(user_id);

-- ============================================================================
-- 6. MEETING NOTES (searchable business knowledge; linkable to documents)
-- ============================================================================
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Meeting Notes',
  content TEXT,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  mentions UUID[] DEFAULT '{}',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_meeting_notes_updated_at
  BEFORE UPDATE ON meeting_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meeting notes" ON meeting_notes FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create meeting notes" ON meeting_notes FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update meeting notes" ON meeting_notes FOR UPDATE
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL)
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can delete meeting notes" ON meeting_notes FOR DELETE
  USING (public.is_org_member(organization_id));

CREATE INDEX idx_meeting_notes_meeting ON meeting_notes(meeting_id);
CREATE INDEX idx_meeting_notes_org ON meeting_notes(organization_id, created_at DESC);

-- ============================================================================
-- 7. MEETING DECISIONS
-- ============================================================================
CREATE TABLE meeting_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  context TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','blocked','cancelled')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_meeting_decisions_updated_at
  BEFORE UPDATE ON meeting_decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE meeting_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view decisions" ON meeting_decisions FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create decisions" ON meeting_decisions FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update decisions" ON meeting_decisions FOR UPDATE
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL)
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can delete decisions" ON meeting_decisions FOR DELETE
  USING (public.is_org_member(organization_id));

CREATE INDEX idx_meeting_decisions_meeting ON meeting_decisions(meeting_id);
CREATE INDEX idx_meeting_decisions_owner ON meeting_decisions(owner_id, status);
CREATE INDEX idx_meeting_decisions_org ON meeting_decisions(organization_id, decision_date DESC);

-- ============================================================================
-- 8. MEETING ACTION ITEMS (become ACT OS tasks via task_id link)
-- ============================================================================
CREATE TABLE meeting_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_meeting_action_items_updated_at
  BEFORE UPDATE ON meeting_action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view action items" ON meeting_action_items FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create action items" ON meeting_action_items FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update action items" ON meeting_action_items FOR UPDATE
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL)
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can delete action items" ON meeting_action_items FOR DELETE
  USING (public.is_org_member(organization_id));

CREATE INDEX idx_meeting_action_items_meeting ON meeting_action_items(meeting_id);
CREATE INDEX idx_meeting_action_items_assignee ON meeting_action_items(assignee_id, status);
CREATE INDEX idx_meeting_action_items_org ON meeting_action_items(organization_id, due_date);

-- ============================================================================
-- 9. COMMUNICATION THREADS (unified conversation across entities)
-- ============================================================================
CREATE TABLE communication_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_type TEXT NOT NULL DEFAULT 'direct' CHECK (thread_type IN ('direct','team','department','entity','group')),
  entity_type TEXT CHECK (entity_type IN ('company','contact','deal','lead','project','employee','task','document')),
  entity_id UUID,
  title TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_communication_threads_updated_at
  BEFORE UPDATE ON communication_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE communication_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view threads" ON communication_threads FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create threads" ON communication_threads FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update threads" ON communication_threads FOR UPDATE
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL)
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can delete threads" ON communication_threads FOR DELETE
  USING (public.is_org_member(organization_id));

CREATE INDEX idx_comm_threads_org ON communication_threads(organization_id, updated_at DESC);
CREATE INDEX idx_comm_threads_entity ON communication_threads(entity_type, entity_id) WHERE entity_type IS NOT NULL;

-- ============================================================================
-- 10. THREAD MEMBERS
-- ============================================================================
CREATE TABLE communication_thread_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);
ALTER TABLE communication_thread_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view thread members" ON communication_thread_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM communication_threads t WHERE t.id = thread_id AND public.is_org_member(t.organization_id)));
CREATE POLICY "Members can join threads" ON communication_thread_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM communication_threads t WHERE t.id = thread_id AND public.is_org_member(t.organization_id)));
CREATE POLICY "Members can update thread membership" ON communication_thread_members FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM communication_threads t WHERE t.id = thread_id AND public.is_org_admin(t.organization_id)))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM communication_threads t WHERE t.id = thread_id AND public.is_org_admin(t.organization_id)));
CREATE POLICY "Members can leave threads" ON communication_thread_members FOR DELETE
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM communication_threads t WHERE t.id = thread_id AND public.is_org_admin(t.organization_id)));

CREATE INDEX idx_comm_thread_members_user ON communication_thread_members(user_id);
CREATE INDEX idx_comm_thread_members_thread ON communication_thread_members(thread_id);

-- ============================================================================
-- 11. MESSAGES (mentions, replies, attachments)
-- ============================================================================
CREATE TABLE communication_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'message' CHECK (message_type IN ('message','email','call','note','system')),
  parent_id UUID REFERENCES communication_messages(id) ON DELETE CASCADE,
  mentions UUID[] DEFAULT '{}',
  attachment_url TEXT,
  email_id UUID,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_communication_messages_updated_at
  BEFORE UPDATE ON communication_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE communication_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages" ON communication_messages FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can send messages" ON communication_messages FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update own messages" ON communication_messages FOR UPDATE
  USING ((sender_id = auth.uid() OR public.is_org_admin(organization_id)) AND deleted_at IS NULL)
  WITH CHECK (sender_id = auth.uid() OR public.is_org_admin(organization_id));
CREATE POLICY "Members can delete messages" ON communication_messages FOR DELETE
  USING (sender_id = auth.uid() OR public.is_org_admin(organization_id));

CREATE INDEX idx_comm_messages_thread ON communication_messages(thread_id, created_at);
CREATE INDEX idx_comm_messages_sender ON communication_messages(sender_id);
CREATE INDEX idx_comm_messages_org ON communication_messages(organization_id, created_at DESC);
CREATE INDEX idx_comm_messages_mentions ON communication_messages USING gin(mentions);

-- ============================================================================
-- 12. EMAIL CONNECTIONS (provider abstraction — tokens never client-accessible)
-- ============================================================================
CREATE TABLE email_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail','outlook','resend','other')),
  email_address TEXT NOT NULL,
  display_name TEXT,
  access_token_ciphertext TEXT NOT NULL,
  refresh_token_ciphertext TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','error')),
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_email_connections_updated_at
  BEFORE UPDATE ON email_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own email connections" ON email_connections FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Owner can manage own email connections" ON email_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can update email connections" ON email_connections FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can delete email connections" ON email_connections FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 13. EMAIL MESSAGES (external emails stored for threading)
-- ============================================================================
CREATE TABLE email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES communication_threads(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail','outlook','resend','other')),
  external_id TEXT,
  subject TEXT NOT NULL,
  body TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  in_reply_to TEXT,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound','outbound')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft','queued','sent','failed','received')),
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_email_messages_updated_at
  BEFORE UPDATE ON email_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view emails" ON email_messages FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create emails" ON email_messages FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update emails" ON email_messages FOR UPDATE
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL)
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can delete emails" ON email_messages FOR DELETE
  USING (public.is_org_member(organization_id));

CREATE INDEX idx_email_messages_org ON email_messages(organization_id, created_at DESC);
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX idx_email_messages_external ON email_messages(provider, external_id);

-- ============================================================================
-- 14. CALENDAR PROVIDER CONNECTIONS (Google / Microsoft / other — safe mapping)
-- ============================================================================
CREATE TABLE calendar_provider_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google','microsoft','other')),
  external_calendar_id TEXT,
  access_token_ciphertext TEXT NOT NULL,
  refresh_token_ciphertext TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','error')),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_calendar_provider_connections_updated_at
  BEFORE UPDATE ON calendar_provider_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE calendar_provider_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own calendar connections" ON calendar_provider_connections FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Owner can manage calendar connections" ON calendar_provider_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can update calendar connections" ON calendar_provider_connections FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can delete calendar connections" ON calendar_provider_connections FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 15. CALENDAR SYNC LOGS
-- ============================================================================
CREATE TABLE calendar_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  external_event_id TEXT,
  sync_type TEXT NOT NULL DEFAULT 'import' CHECK (sync_type IN ('import','export','update','delete')),
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed','skipped')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view sync logs" ON calendar_sync_logs FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Members can create sync logs" ON calendar_sync_logs FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX idx_calendar_sync_logs_org ON calendar_sync_logs(organization_id, created_at DESC);

-- ============================================================================
-- 16. MEETING ACTIVITIES (audit trail clone convention)
-- ============================================================================
CREATE TABLE meeting_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE meeting_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meeting activities" ON meeting_activities FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Members can create meeting activities" ON meeting_activities FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX idx_meeting_activities_org ON meeting_activities(organization_id, created_at DESC);
CREATE INDEX idx_meeting_activities_meeting ON meeting_activities(meeting_id);

-- ============================================================================
-- 17. CALENDAR ACTIVITIES (audit trail clone convention)
-- ============================================================================
CREATE TABLE calendar_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE calendar_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view calendar activities" ON calendar_activities FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Members can create calendar activities" ON calendar_activities FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX idx_calendar_activities_org ON calendar_activities(organization_id, created_at DESC);
CREATE INDEX idx_calendar_activities_event ON calendar_activities(event_id);

-- ============================================================================
-- 18. PERMISSIONS (slug convention: calendar_*/meeting_*/communication_*/email_*)
-- ============================================================================
INSERT INTO permissions (name, slug, description, resource, action) VALUES
  ('View Calendar', 'calendar_view', 'View calendar and events', 'calendar', 'view'),
  ('Create Events', 'calendar_create', 'Create calendar events', 'calendar', 'create'),
  ('Update Events', 'calendar_update', 'Update calendar events', 'calendar', 'update'),
  ('Delete Events', 'calendar_delete', 'Delete calendar events', 'calendar', 'delete'),
  ('Manage Availability', 'calendar_availability_manage', 'Manage availability and working hours', 'calendar_availability', 'manage'),
  ('Manage Calendar Integrations', 'calendar_integration_manage', 'Connect and manage external calendars', 'calendar_integration', 'manage'),
  ('View Meetings', 'meeting_view', 'View meetings', 'meeting', 'view'),
  ('Create Meetings', 'meeting_create', 'Create meetings', 'meeting', 'create'),
  ('Update Meetings', 'meeting_update', 'Update and reschedule meetings', 'meeting', 'update'),
  ('Cancel Meetings', 'meeting_cancel', 'Cancel meetings', 'meeting', 'cancel'),
  ('Manage Meetings', 'meeting_manage', 'Manage meetings and participants', 'meeting', 'manage'),
  ('Manage Meeting Notes', 'meeting_notes_manage', 'Create and edit meeting notes', 'meeting_notes', 'manage'),
  ('Manage Decisions', 'meeting_decision_manage', 'Record meeting decisions', 'meeting_decision', 'manage'),
  ('Manage Action Items', 'meeting_action_manage', 'Manage meeting action items', 'meeting_action', 'manage'),
  ('View Communication', 'communication_view', 'View communication threads and messages', 'communication', 'view'),
  ('Send Messages', 'communication_send', 'Send messages in threads', 'communication', 'send'),
  ('Manage Communication', 'communication_manage', 'Manage communication threads', 'communication', 'manage'),
  ('Send Email', 'email_send', 'Send emails', 'email', 'send'),
  ('View Email', 'email_view', 'View email history', 'email', 'view'),
  ('Manage Email Connections', 'email_connection_manage', 'Connect email providers', 'email_connection', 'manage'),
  ('View Calendar Activity', 'calendar_activity_view', 'View calendar and meeting audit activity', 'calendar_activity', 'view')
ON CONFLICT (slug) DO NOTHING;