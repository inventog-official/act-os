export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<Organization, 'id'>>
        Relationships: []
      }
      workspaces: {
        Row: Workspace
        Insert: Omit<Workspace, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<Workspace, 'id'>>
        Relationships: []
      }
      teams: {
        Row: Team
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<Team, 'id'>>
        Relationships: []
      }
      organization_members: {
        Row: OrganizationMember
        Insert: Omit<OrganizationMember, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<OrganizationMember, 'id'>>
        Relationships: []
      }
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'id' | 'created_at'>
        Update: Partial<Omit<TeamMember, 'id'>>
        Relationships: []
      }
      roles: {
        Row: Role
        Insert: Omit<Role, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Role, 'id'>>
        Relationships: []
      }
      permissions: {
        Row: Permission
        Insert: Omit<Permission, 'id' | 'created_at'>
        Update: Partial<Omit<Permission, 'id'>>
        Relationships: []
      }
      role_permissions: {
        Row: RolePermission
        Insert: Omit<RolePermission, 'id' | 'created_at'>
        Update: Partial<Omit<RolePermission, 'id'>>
        Relationships: []
      }
      user_roles: {
        Row: UserRole
        Insert: Omit<UserRole, 'id' | 'created_at'>
        Update: Partial<Omit<UserRole, 'id'>>
        Relationships: []
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<Project, 'id'>>
        Relationships: []
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<Task, 'id'>>
        Relationships: []
      }
      activities: {
        Row: Activity
        Insert: Omit<Activity, 'id' | 'created_at'>
        Update: Partial<Omit<Activity, 'id'>>
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'deleted_at'>
        Update: Partial<Omit<Notification, 'id'>>
        Relationships: []
      }
      api_keys: {
        Row: ApiKey
        Insert: Omit<ApiKey, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<ApiKey, 'id'>>
        Relationships: []
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      crm_pipelines: {
        Row: CrmPipeline
        Insert: Omit<CrmPipeline, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<CrmPipeline, 'id'>>
        Relationships: []
      }
      crm_pipeline_stages: {
        Row: CrmPipelineStage
        Insert: Omit<CrmPipelineStage, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CrmPipelineStage, 'id'>>
        Relationships: []
      }
      crm_tags: {
        Row: CrmTag
        Insert: Omit<CrmTag, 'id' | 'created_at'>
        Update: Partial<Omit<CrmTag, 'id'>>
        Relationships: []
      }
      crm_companies: {
        Row: CrmCompany
        Insert: Omit<CrmCompany, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<CrmCompany, 'id'>>
        Relationships: []
      }
      crm_leads: {
        Row: CrmLead
        Insert: Omit<CrmLead, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<CrmLead, 'id'>>
        Relationships: []
      }
      crm_contacts: {
        Row: CrmContact
        Insert: Omit<CrmContact, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<CrmContact, 'id'>>
        Relationships: []
      }
      crm_deals: {
        Row: CrmDeal
        Insert: Omit<CrmDeal, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<CrmDeal, 'id'>>
        Relationships: []
      }
      crm_activities: {
        Row: CrmActivity
        Insert: Omit<CrmActivity, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CrmActivity, 'id'>>
        Relationships: []
      }
      crm_notes: {
        Row: CrmNote
        Insert: Omit<CrmNote, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<CrmNote, 'id'>>
        Relationships: []
      }
      crm_tasks: {
        Row: CrmTask
        Insert: Omit<CrmTask, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<CrmTask, 'id'>>
        Relationships: []
      }
      crm_timeline: {
        Row: CrmTimeline
        Insert: Omit<CrmTimeline, 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      crm_entity_tags: {
        Row: {
          id: string
          tag_id: string
          entity_type: string
          entity_id: string
          created_at: string
        }
        Insert: Omit<{ id: string; tag_id: string; entity_type: string; entity_id: string; created_at: string }, 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Organization extends BaseEntity {
  name: string
  slug: string
  logo_url: string | null
  website: string | null
  description: string | null
  owner_id: string
  settings: Json
  tier: 'free' | 'starter' | 'business' | 'enterprise'
}

export interface Workspace extends BaseEntity {
  name: string
  slug: string
  description: string | null
  organization_id: string
  settings: Json
  created_by: string
}

export interface Team extends BaseEntity {
  name: string
  description: string | null
  organization_id: string
  workspace_id: string | null
  created_by: string
}

export interface OrganizationMember extends BaseEntity {
  organization_id: string
  user_id: string
  role_id: string
  created_by: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  created_at: string
  created_by: string
}

export interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  organization_id: string
  is_system: boolean
  level: number
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  slug: string
  description: string | null
  resource: string
  action: string
  created_at: string
}

export interface RolePermission {
  id: string
  role_id: string
  permission_id: string
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  organization_id: string
  created_at: string
}

export interface Project extends BaseEntity {
  name: string
  slug: string
  description: string | null
  organization_id: string
  workspace_id: string | null
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date: string | null
  end_date: string | null
  owner_id: string
  settings: Json
  created_by: string
  client_name: string | null
  company_id: string | null
  deal_id: string | null
  lead_id: string | null
  budget: number | null
  color: string | null
  icon: string | null
  code: string | null
  progress: number | null
  is_public: boolean | null
}

export interface Task extends BaseEntity {
  title: string
  description: string | null
  project_id: string | null
  assignee_id: string | null
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  completed_at: string | null
  created_by: string
  organization_id: string
  workspace_id: string | null
  is_recurring: boolean | null
  recurring_config: Json | null
}

export interface Activity {
  id: string
  organization_id: string
  user_id: string
  action: string
  resource: string
  resource_id: string | null
  metadata: Json
  created_at: string
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  title: string
  message: string | null
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  link: string | null
  created_at: string
  deleted_at: string | null
}

export interface ApiKey extends BaseEntity {
  name: string
  key_prefix: string
  key_hash: string
  organization_id: string
  created_by: string
  last_used_at: string | null
  expires_at: string | null
  permissions: string[]
}

export interface AuditLog {
  id: string
  organization_id: string
  user_id: string
  action: string
  resource: string
  resource_id: string | null
  old_values: Json | null
  new_values: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// CRM Types
export interface CrmPipeline extends BaseEntity {
  name: string
  description: string | null
  organization_id: string
  workspace_id: string | null
  is_default: boolean
  created_by: string
}

export interface CrmPipelineStage {
  id: string
  pipeline_id: string
  name: string
  color: string
  probability: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface CrmTag {
  id: string
  name: string
  color: string
  organization_id: string
  workspace_id: string | null
  created_by: string
  created_at: string
  deleted_at: string | null
}

export interface CrmCompany extends BaseEntity {
  name: string
  industry: string | null
  employee_count: number | null
  revenue: number | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  website: string | null
  phone: string | null
  email: string | null
  gst_number: string | null
  logo_url: string | null
  description: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to: string | null
  created_by: string
  updated_by: string | null
}

export interface CrmLead extends BaseEntity {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  job_title: string | null
  company_id: string | null
  company_name: string | null
  website: string | null
  industry: string | null
  lead_source: string | null
  priority: string | null
  status: string
  pipeline_stage_id: string | null
  estimated_deal_value: number | null
  expected_close_date: string | null
  description: string | null
  notes: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to: string | null
  created_by: string
  updated_by: string | null
}

export interface CrmContact extends BaseEntity {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  job_title: string | null
  department: string | null
  company_id: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to: string | null
  created_by: string
  updated_by: string | null
}

export interface CrmDeal extends BaseEntity {
  name: string
  deal_value: number
  probability: number
  pipeline_id: string
  pipeline_stage_id: string
  lead_id: string | null
  company_id: string | null
  contact_id: string | null
  expected_close_date: string | null
  actual_close_date: string | null
  notes: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to: string | null
  created_by: string
  updated_by: string | null
}

export interface CrmActivity {
  id: string
  type: string
  subject: string
  description: string | null
  activity_date: string
  duration_minutes: number | null
  lead_id: string | null
  company_id: string | null
  contact_id: string | null
  deal_id: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface CrmNote extends BaseEntity {
  title: string | null
  content: string | null
  is_pinned: boolean
  is_private: boolean
  lead_id: string | null
  company_id: string | null
  contact_id: string | null
  deal_id: string | null
  organization_id: string
  workspace_id: string | null
  created_by: string
  updated_by: string | null
}

export interface CrmTask extends BaseEntity {
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  reminder_at: string | null
  is_recurring: boolean
  recurring_interval: string | null
  lead_id: string | null
  company_id: string | null
  contact_id: string | null
  deal_id: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to: string | null
  created_by: string
  updated_by: string | null
  completed_at: string | null
}

export interface CrmTimeline {
  id: string
  action: string
  description: string | null
  entity_type: string
  entity_id: string
  lead_id: string | null
  company_id: string | null
  contact_id: string | null
  deal_id: string | null
  metadata: Json
  organization_id: string
  workspace_id: string | null
  created_by: string
  created_at: string
}

// Project Management Types
export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'project_manager' | 'developer' | 'designer' | 'qa' | 'viewer'
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectTag {
  id: string
  project_id: string
  name: string
  color: string
  created_at: string
}

export interface ProjectFolder {
  id: string
  project_id: string
  name: string
  parent_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  folder_id: string | null
  name: string
  url: string
  size: number | null
  mime_type: string | null
  version: number | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProjectActivity {
  id: string
  project_id: string
  user_id: string
  action: string
  description: string | null
  metadata: Json
  created_at: string
}

export interface TaskChecklistItem {
  id: string
  task_id: string
  text: string
  completed: boolean
  completed_at: string | null
  completed_by: string | null
  sort_order: number | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskSubtask {
  id: string
  parent_task_id: string
  child_task_id: string
  created_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  mentions: string[] | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface TaskDependency {
  id: string
  task_id: string
  depends_on_task_id: string
  type: 'blocks' | 'depends_on' | 'related'
  created_at: string
}

export interface TaskWatcher {
  id: string
  task_id: string
  user_id: string
  created_at: string
}

export interface TaskAttachment {
  id: string
  task_id: string
  name: string
  url: string
  size: number | null
  mime_type: string | null
  created_by: string
  created_at: string
  deleted_at: string | null
}

export interface TaskLabel {
  id: string
  name: string
  color: string
  project_id: string | null
  organization_id: string
  created_by: string
  created_at: string
  deleted_at: string | null
}

export interface TaskLabelAssignment {
  id: string
  task_id: string
  label_id: string
  created_at: string
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string | null
  completed_at: string | null
  sort_order: number | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface MilestoneTask {
  id: string
  milestone_id: string
  task_id: string
  created_at: string
}

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  start_date: string | null
  end_date: string | null
  completed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SprintTask {
  id: string
  sprint_id: string
  task_id: string
  added_at: string
}

export interface TimeEntry {
  id: string
  task_id: string
  user_id: string
  description: string | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  billable: boolean | null
  billable_rate: number | null
  is_running: boolean | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}
