-- ACT OS Project & Work Management Module

-- Project Members
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Project Tags
CREATE TABLE project_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Project Files / Folders
CREATE TABLE project_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES project_folders(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_project_folders_updated_at
  BEFORE UPDATE ON project_folders FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES project_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON project_files FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Project Activity Timeline
CREATE TABLE project_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_activities_project ON project_activities(project_id, created_at DESC);

-- Task Enhancements (extends existing tasks table)
CREATE TABLE task_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_task_checklist_items_updated_at
  BEFORE UPDATE ON task_checklist_items FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE task_subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  child_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_task_id, child_task_id)
);

CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'blocks' CHECK (type IN ('blocks', 'depends_on', 'related')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

CREATE TABLE task_watchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  mime_type TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Task Labels
CREATE TABLE task_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE task_label_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES task_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, label_id)
);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE milestone_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(milestone_id, task_id)
);

-- Sprints
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON sprints FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TABLE sprint_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sprint_id, task_id)
);

-- Time Tracking
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  billable BOOLEAN DEFAULT TRUE,
  billable_rate NUMERIC(10,2),
  is_running BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id, start_time DESC);

-- Add sort_order to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_config JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC;

-- Extend projects table with CRM integration columns
-- These columns are added via ALTER since projects table already exists
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC(15,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#18181b';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'FolderKanban';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Members can read project data" ON project_members;

CREATE OR REPLACE FUNCTION public.is_project_member(target_project_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = target_project_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_project_member(UUID) TO anon, authenticated;

CREATE POLICY "Members can read project data"
  ON project_members FOR SELECT
  USING (
    public.is_project_member(project_id)
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id IN (SELECT p.organization_id FROM projects p WHERE p.id = project_id)
    )
  );

CREATE POLICY "Admins can manage project members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'manager')
    )
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid() AND r.level >= 80
      AND om.organization_id IN (SELECT p.organization_id FROM projects p WHERE p.id = project_id)
    )
  );

CREATE POLICY "Members can read tasks"
  ON tasks FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Members can read task comments"
  ON task_comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND t.organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
    AND deleted_at IS NULL
  );

-- Permissions
INSERT INTO permissions (name, slug, description, resource, action) VALUES
  ('View Projects', 'project_view', 'View projects', 'project', 'view'),
  ('Create Projects', 'project_create', 'Create new projects', 'project', 'create'),
  ('Update Projects', 'project_update', 'Update existing projects', 'project', 'update'),
  ('Delete Projects', 'project_delete', 'Delete projects', 'project', 'delete'),
  ('Manage Project Members', 'project_manage_members', 'Manage project team members', 'project', 'manage_members'),
  ('View Tasks', 'task_view', 'View tasks', 'task', 'view'),
  ('Create Tasks', 'task_create', 'Create new tasks', 'task', 'create'),
  ('Update Tasks', 'task_update', 'Update existing tasks', 'task', 'update'),
  ('Delete Tasks', 'task_delete', 'Delete tasks', 'task', 'delete'),
  ('View Milestones', 'milestone_view', 'View milestones', 'milestone', 'view'),
  ('Create Milestones', 'milestone_create', 'Create milestones', 'milestone', 'create'),
  ('Update Milestones', 'milestone_update', 'Update milestones', 'milestone', 'update'),
  ('Delete Milestones', 'milestone_delete', 'Delete milestones', 'milestone', 'delete'),
  ('Manage Sprints', 'sprint_manage', 'Manage sprints', 'sprint', 'manage'),
  ('Track Time', 'time_track', 'Log time entries', 'time', 'track'),
  ('View Reports', 'report_view', 'View reports and analytics', 'report', 'view')
ON CONFLICT (slug) DO NOTHING;
