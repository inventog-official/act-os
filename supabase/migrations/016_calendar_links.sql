-- ACT OS Phase 8 — Calendar related-entity links
-- Adds CRM/HR/Project link columns to calendar_events so events can be tied
-- to customers, companies, deals, leads, projects, tasks and employees
-- without duplicating those entities (Modules 2, 15, 16, 17, 30).

ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES hr_employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_company ON calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_deal ON calendar_events(deal_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_employee ON calendar_events(employee_id);

-- Search support for calendar events (Module 31)
CREATE INDEX IF NOT EXISTS idx_calendar_events_title_trgm ON calendar_events USING gin(title gin_trgm_ops);

-- Search support for communication messages (Module 31)
CREATE INDEX IF NOT EXISTS idx_comm_messages_body_trgm ON communication_messages USING gin(body gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_comm_threads_title_trgm ON communication_threads USING gin(title gin_trgm_ops);

-- Search support for meeting notes / decisions / action items (Module 31)
CREATE INDEX IF NOT EXISTS idx_meeting_notes_content_trgm ON meeting_notes USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_decision_trgm ON meeting_decisions USING gin(decision gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_desc_trgm ON meeting_action_items USING gin(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_meetings_title_trgm ON meetings USING gin(title gin_trgm_ops);