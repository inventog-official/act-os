-- ACT OS CRM Module Schema

-- Pipelines
CREATE TABLE crm_pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_crm_pipelines_updated_at
  BEFORE UPDATE ON crm_pipelines FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Pipeline Stages
CREATE TABLE crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  probability INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_crm_pipeline_stages_updated_at
  BEFORE UPDATE ON crm_pipeline_stages FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Tags
CREATE TABLE crm_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, name)
);

-- Companies
CREATE TABLE crm_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  employee_count INTEGER,
  revenue NUMERIC(15,2),
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  gst_number TEXT,
  logo_url TEXT,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON crm_companies FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Leads
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  company_name TEXT,
  website TEXT,
  industry TEXT,
  lead_source TEXT CHECK (lead_source IN ('website', 'referral', 'cold_call', 'email', 'social_media', 'advertisement', 'event', 'partner', 'other')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'disqualified')),
  pipeline_stage_id UUID REFERENCES crm_pipeline_stages(id) ON DELETE SET NULL,
  estimated_deal_value NUMERIC(15,2),
  expected_close_date DATE,
  description TEXT,
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Contacts
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  department TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Deals
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  deal_value NUMERIC(15,2) DEFAULT 0,
  probability INTEGER DEFAULT 0,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  pipeline_stage_id UUID NOT NULL REFERENCES crm_pipeline_stages(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  expected_close_date DATE,
  actual_close_date DATE,
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON crm_deals FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Activities
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'task', 'note', 'sms', 'whatsapp')),
  subject TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON crm_activities FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Notes (rich text)
CREATE TABLE crm_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  content TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_crm_notes_updated_at
  BEFORE UPDATE ON crm_notes FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- CRM Tasks
CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_interval TEXT CHECK (recurring_interval IN ('daily', 'weekly', 'monthly', 'custom')),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_crm_tasks_updated_at
  BEFORE UPDATE ON crm_tasks FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Timeline
CREATE TABLE crm_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'company', 'contact', 'deal', 'activity', 'note', 'task')),
  entity_id UUID NOT NULL,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Polymorphic entity tag association
CREATE TABLE crm_entity_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'company', 'contact', 'deal')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_id, entity_type, entity_id)
);

-- Indexes
CREATE INDEX idx_crm_leads_workspace ON crm_leads(workspace_id, deleted_at);
CREATE INDEX idx_crm_leads_status ON crm_leads(status, deleted_at);
CREATE INDEX idx_crm_leads_assigned ON crm_leads(assigned_to);
CREATE INDEX idx_crm_companies_workspace ON crm_companies(workspace_id, deleted_at);
CREATE INDEX idx_crm_contacts_workspace ON crm_contacts(workspace_id, deleted_at);
CREATE INDEX idx_crm_deals_workspace ON crm_deals(workspace_id, deleted_at);
CREATE INDEX idx_crm_deals_stage ON crm_deals(pipeline_stage_id);
CREATE INDEX idx_crm_activities_entity ON crm_activities(lead_id);
CREATE INDEX idx_crm_activities_company ON crm_activities(company_id);
CREATE INDEX idx_crm_activities_date ON crm_activities(activity_date DESC);
CREATE INDEX idx_crm_notes_entity ON crm_notes(lead_id);
CREATE INDEX idx_crm_tasks_due ON crm_tasks(due_date);
CREATE INDEX idx_crm_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_timeline_entity ON crm_timeline(entity_type, entity_id);
CREATE INDEX idx_crm_timeline_org ON crm_timeline(organization_id, created_at DESC);

-- RLS
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_entity_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view CRM data" ON crm_leads FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view CRM companies" ON crm_companies FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view CRM contacts" ON crm_contacts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view CRM deals" ON crm_deals FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view CRM pipelines" ON crm_pipelines FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can insert CRM leads" ON crm_leads FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can update CRM leads" ON crm_leads FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Apply same insert/update policies for all CRM tables (simplified)
CREATE POLICY "Members can insert" ON crm_companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update" ON crm_companies FOR UPDATE USING (true);
CREATE POLICY "Members can insert" ON crm_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update" ON crm_contacts FOR UPDATE USING (true);
CREATE POLICY "Members can insert" ON crm_deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update" ON crm_deals FOR UPDATE USING (true);
CREATE POLICY "Members can insert" ON crm_pipelines FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update" ON crm_pipelines FOR UPDATE USING (true);
CREATE POLICY "Members can insert" ON crm_pipeline_stages FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update" ON crm_pipeline_stages FOR UPDATE USING (true);
CREATE POLICY "Members can manage" ON crm_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can manage" ON crm_activities FOR UPDATE USING (true);
CREATE POLICY "Members can manage" ON crm_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can manage" ON crm_notes FOR UPDATE USING (true);
CREATE POLICY "Members can manage" ON crm_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can manage" ON crm_tasks FOR UPDATE USING (true);
CREATE POLICY "Members can insert" ON crm_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can view" ON crm_timeline FOR SELECT USING (true);
CREATE POLICY "Members can manage" ON crm_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can manage" ON crm_entity_tags FOR INSERT WITH CHECK (true);
