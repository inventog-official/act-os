-- ACT OS Database Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'business', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, slug)
);

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT FALSE,
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Permissions
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON organization_members FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Team Members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date DATE,
  end_date DATE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, slug)
);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  estimated_hours NUMERIC,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Activity
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_org ON activities(organization_id, created_at DESC);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners and admins can update organizations"
  ON organizations FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR auth.uid() IN (
      SELECT om.user_id FROM organization_members om
      JOIN roles r ON om.role_id = r.id
      WHERE om.organization_id = organizations.id AND r.slug IN ('super_admin', 'admin')
    )
  );

-- RLS Policies: Workspaces
CREATE POLICY "Members can view workspaces"
  ON workspaces FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies: Tasks
CREATE POLICY "Members can view tasks"
  ON tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Insert default permissions
INSERT INTO permissions (name, slug, resource, action) VALUES
  ('View Organization', 'organization_view', 'organization', 'view'),
  ('Create Organization', 'organization_create', 'organization', 'create'),
  ('Update Organization', 'organization_update', 'organization', 'update'),
  ('Delete Organization', 'organization_delete', 'organization', 'delete'),
  ('Manage Members', 'organization_manage_members', 'organization', 'manage_members'),
  ('View Workspace', 'workspace_view', 'workspace', 'view'),
  ('Create Workspace', 'workspace_create', 'workspace', 'create'),
  ('Update Workspace', 'workspace_update', 'workspace', 'update'),
  ('Delete Workspace', 'workspace_delete', 'workspace', 'delete'),
  ('View Team', 'team_view', 'team', 'view'),
  ('Create Team', 'team_create', 'team', 'create'),
  ('Update Team', 'team_update', 'team', 'update'),
  ('Delete Team', 'team_delete', 'team', 'delete'),
  ('View Project', 'project_view', 'project', 'view'),
  ('Create Project', 'project_create', 'project', 'create'),
  ('Update Project', 'project_update', 'project', 'update'),
  ('Delete Project', 'project_delete', 'project', 'delete'),
  ('View Task', 'task_view', 'task', 'view'),
  ('Create Task', 'task_create', 'task', 'create'),
  ('Update Task', 'task_update', 'task', 'update'),
  ('Delete Task', 'task_delete', 'task', 'delete'),
  ('Assign Task', 'task_assign', 'task', 'assign'),
  ('View Billing', 'billing_view', 'billing', 'view'),
  ('Manage Billing', 'billing_manage', 'billing', 'manage'),
  ('View Members', 'member_view', 'member', 'view'),
  ('Invite Members', 'member_invite', 'member', 'invite'),
  ('Remove Members', 'member_remove', 'member', 'remove'),
  ('Update Member Role', 'member_update_role', 'member', 'update_role'),
  ('View Settings', 'settings_view', 'settings', 'view'),
  ('Update Settings', 'settings_update', 'settings', 'update'),
  ('View API Keys', 'api_key_view', 'api_key', 'view'),
  ('Create API Key', 'api_key_create', 'api_key', 'create'),
  ('Delete API Key', 'api_key_delete', 'api_key', 'delete'),
  ('View Activity', 'activity_view', 'activity', 'view'),
  ('View Audit Logs', 'audit_view', 'audit', 'view')
ON CONFLICT (slug) DO NOTHING;
