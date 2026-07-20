export const PERMISSIONS = {
  // CRM
  crm_dashboard_view: { name: 'View CRM Dashboard', resource: 'crm', action: 'view_dashboard' },
  crm_lead_view: { name: 'View Leads', resource: 'crm_lead', action: 'view' },
  crm_lead_create: { name: 'Create Leads', resource: 'crm_lead', action: 'create' },
  crm_lead_update: { name: 'Update Leads', resource: 'crm_lead', action: 'update' },
  crm_lead_delete: { name: 'Delete Leads', resource: 'crm_lead', action: 'delete' },
  crm_contact_view: { name: 'View Contacts', resource: 'crm_contact', action: 'view' },
  crm_contact_create: { name: 'Create Contacts', resource: 'crm_contact', action: 'create' },
  crm_contact_update: { name: 'Update Contacts', resource: 'crm_contact', action: 'update' },
  crm_contact_delete: { name: 'Delete Contacts', resource: 'crm_contact', action: 'delete' },
  crm_company_view: { name: 'View Companies', resource: 'crm_company', action: 'view' },
  crm_company_create: { name: 'Create Companies', resource: 'crm_company', action: 'create' },
  crm_company_update: { name: 'Update Companies', resource: 'crm_company', action: 'update' },
  crm_company_delete: { name: 'Delete Companies', resource: 'crm_company', action: 'delete' },
  crm_deal_view: { name: 'View Deals', resource: 'crm_deal', action: 'view' },
  crm_deal_create: { name: 'Create Deals', resource: 'crm_deal', action: 'create' },
  crm_deal_update: { name: 'Update Deals', resource: 'crm_deal', action: 'update' },
  crm_deal_delete: { name: 'Delete Deals', resource: 'crm_deal', action: 'delete' },
  crm_pipeline_manage: { name: 'Manage Pipelines', resource: 'crm_pipeline', action: 'manage' },
  crm_activity_log: { name: 'Log Activities', resource: 'crm_activity', action: 'log' },
  crm_note_manage: { name: 'Manage Notes', resource: 'crm_note', action: 'manage' },
  crm_task_manage: { name: 'Manage Tasks', resource: 'crm_task', action: 'manage' },

  // Organization
  organization_view: { name: 'View Organization', resource: 'organization', action: 'view' },
  organization_create: { name: 'Create Organization', resource: 'organization', action: 'create' },
  organization_update: { name: 'Update Organization', resource: 'organization', action: 'update' },
  organization_delete: { name: 'Delete Organization', resource: 'organization', action: 'delete' },
  organization_manage_members: { name: 'Manage Members', resource: 'organization', action: 'manage_members' },

  // Workspace
  workspace_view: { name: 'View Workspace', resource: 'workspace', action: 'view' },
  workspace_create: { name: 'Create Workspace', resource: 'workspace', action: 'create' },
  workspace_update: { name: 'Update Workspace', resource: 'workspace', action: 'update' },
  workspace_delete: { name: 'Delete Workspace', resource: 'workspace', action: 'delete' },

  // Team
  team_view: { name: 'View Team', resource: 'team', action: 'view' },
  team_create: { name: 'Create Team', resource: 'team', action: 'create' },
  team_update: { name: 'Update Team', resource: 'team', action: 'update' },
  team_delete: { name: 'Delete Team', resource: 'team', action: 'delete' },

  // Project
  project_view: { name: 'View Project', resource: 'project', action: 'view' },
  project_create: { name: 'Create Project', resource: 'project', action: 'create' },
  project_update: { name: 'Update Project', resource: 'project', action: 'update' },
  project_delete: { name: 'Delete Project', resource: 'project', action: 'delete' },

  // Task
  task_view: { name: 'View Task', resource: 'task', action: 'view' },
  task_create: { name: 'Create Task', resource: 'task', action: 'create' },
  task_update: { name: 'Update Task', resource: 'task', action: 'update' },
  task_delete: { name: 'Delete Task', resource: 'task', action: 'delete' },
  task_assign: { name: 'Assign Task', resource: 'task', action: 'assign' },

  // Billing
  billing_view: { name: 'View Billing', resource: 'billing', action: 'view' },
  billing_manage: { name: 'Manage Billing', resource: 'billing', action: 'manage' },

  // Members
  member_view: { name: 'View Members', resource: 'member', action: 'view' },
  member_invite: { name: 'Invite Members', resource: 'member', action: 'invite' },
  member_remove: { name: 'Remove Members', resource: 'member', action: 'remove' },
  member_update_role: { name: 'Update Member Role', resource: 'member', action: 'update_role' },

  // Settings
  settings_view: { name: 'View Settings', resource: 'settings', action: 'view' },
  settings_update: { name: 'Update Settings', resource: 'settings', action: 'update' },

  // API Keys
  api_key_view: { name: 'View API Keys', resource: 'api_key', action: 'view' },
  api_key_create: { name: 'Create API Key', resource: 'api_key', action: 'create' },
  api_key_delete: { name: 'Delete API Key', resource: 'api_key', action: 'delete' },

  // Activity & Audit
  activity_view: { name: 'View Activity', resource: 'activity', action: 'view' },
  audit_view: { name: 'View Audit Logs', resource: 'audit', action: 'view' },
} as const

export type PermissionSlug = keyof typeof PERMISSIONS

export const ROLES = {
  super_admin: {
    name: 'Super Admin',
    level: 100,
    permissions: Object.keys(PERMISSIONS),
  },
  admin: {
    name: 'Admin',
    level: 80,
    permissions: Object.keys(PERMISSIONS),
  },
  manager: {
    name: 'Manager',
    level: 60,
    permissions: [
      'crm_dashboard_view',
      'crm_lead_view', 'crm_lead_create', 'crm_lead_update',
      'crm_contact_view', 'crm_contact_create', 'crm_contact_update',
      'crm_company_view', 'crm_company_create', 'crm_company_update',
      'crm_deal_view', 'crm_deal_create', 'crm_deal_update',
      'crm_pipeline_manage',
      'crm_activity_log',
      'crm_note_manage',
      'crm_task_manage',
      'organization_view',
      'workspace_view', 'workspace_create', 'workspace_update',
      'team_view', 'team_create', 'team_update',
      'project_view', 'project_create', 'project_update',
      'task_view', 'task_create', 'task_update', 'task_assign',
      'member_view', 'member_invite',
      'settings_view', 'settings_update',
      'activity_view',
    ],
  },
  employee: {
    name: 'Employee',
    level: 40,
    permissions: [
      'crm_dashboard_view',
      'crm_lead_view', 'crm_lead_update',
      'crm_contact_view', 'crm_contact_update',
      'crm_company_view',
      'crm_deal_view',
      'crm_activity_log',
      'crm_note_manage',
      'crm_task_manage',
      'organization_view',
      'workspace_view',
      'team_view',
      'project_view',
      'task_view', 'task_update',
      'member_view',
      'settings_view',
      'activity_view',
    ],
  },
  guest: {
    name: 'Guest',
    level: 20,
    permissions: [
      'organization_view',
      'project_view',
      'task_view',
    ],
  },
} as const

export type RoleSlug = keyof typeof ROLES
