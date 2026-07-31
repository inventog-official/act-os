import { pgTable, uuid, text, integer, numeric, boolean, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id'),
  status: text('status').notNull().default('planning'),
  priority: text('priority').notNull().default('medium'),
  startDate: timestamp('start_date', { mode: 'date' }),
  endDate: timestamp('end_date', { mode: 'date' }),
  ownerId: uuid('owner_id').notNull(),
  settings: jsonb('settings').default('{}'),
  clientName: text('client_name'),
  companyId: uuid('company_id'),
  dealId: uuid('deal_id'),
  leadId: uuid('lead_id'),
  budget: numeric('budget', { precision: 15, scale: 2 }),
  color: text('color').default('#18181b'),
  icon: text('icon').default('FolderKanban'),
  code: text('code'),
  progress: integer('progress').default(0),
  isPublic: boolean('is_public').default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, t => ({ unique: uniqueIndex().on(t.organizationId, t.slug) }))

export const projectMembers = pgTable('project_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: text('role').notNull().default('member'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.projectId, t.userId) }))

export const projectTags = pgTable('project_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  name: text('name').notNull(),
  color: text('color').default('#6b7280'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const projectFolders = pgTable('project_folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  name: text('name').notNull(),
  parentId: uuid('parent_id'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const projectFiles = pgTable('project_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  folderId: uuid('folder_id'),
  name: text('name').notNull(),
  url: text('url').notNull(),
  size: integer('size').default(0),
  mimeType: text('mime_type'),
  version: integer('version').default(1),
  workspaceId: uuid('workspace_id'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const projectActivities = pgTable('project_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  projectId: uuid('project_id'),
  assigneeId: uuid('assignee_id'),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  dueDate: timestamp('due_date'),
  startDate: timestamp('start_date'),
  estimatedHours: numeric('estimated_hours'),
  actualHours: numeric('actual_hours'),
  completedAt: timestamp('completed_at'),
  sortOrder: integer('sort_order').default(0),
  isRecurring: boolean('is_recurring').default(false),
  recurringConfig: jsonb('recurring_config'),
  parentTaskId: uuid('parent_task_id'),
  createdBy: uuid('created_by').notNull(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const taskChecklistItems = pgTable('task_checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  text: text('text').notNull(),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  completedBy: uuid('completed_by'),
  sortOrder: integer('sort_order').default(0),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const taskSubtasks = pgTable('task_subtasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentTaskId: uuid('parent_task_id').notNull(),
  childTaskId: uuid('child_task_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.parentTaskId, t.childTaskId) }))

export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  mentions: uuid('mentions').array().default([]),
  parentId: uuid('parent_id'),
  workspaceId: uuid('workspace_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const taskDependencies = pgTable('task_dependencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  dependsOnTaskId: uuid('depends_on_task_id').notNull(),
  type: text('type').notNull().default('blocks'),
  createdAt: timestamp('created_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.taskId, t.dependsOnTaskId) }))

export const taskWatchers = pgTable('task_watchers', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.taskId, t.userId) }))

export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  size: integer('size').default(0),
  mimeType: text('mime_type'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const taskLabels = pgTable('task_labels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color').default('#6b7280'),
  projectId: uuid('project_id'),
  organizationId: uuid('organization_id').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const taskLabelAssignments = pgTable('task_label_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  labelId: uuid('label_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.taskId, t.labelId) }))

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  dueDate: timestamp('due_date', { mode: 'date' }),
  completedAt: timestamp('completed_at'),
  sortOrder: integer('sort_order').default(0),
  workspaceId: uuid('workspace_id'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const milestoneTasks = pgTable('milestone_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  milestoneId: uuid('milestone_id').notNull(),
  taskId: uuid('task_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.milestoneId, t.taskId) }))

export const sprints = pgTable('sprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  name: text('name').notNull(),
  goal: text('goal'),
  status: text('status').notNull().default('planning'),
  startDate: timestamp('start_date', { mode: 'date' }),
  endDate: timestamp('end_date', { mode: 'date' }),
  completedAt: timestamp('completed_at'),
  workspaceId: uuid('workspace_id'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const sprintTasks = pgTable('sprint_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  sprintId: uuid('sprint_id').notNull(),
  taskId: uuid('task_id').notNull(),
  addedAt: timestamp('added_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.sprintId, t.taskId) }))

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  userId: uuid('user_id').notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationMinutes: integer('duration_minutes'),
  billable: boolean('billable').default(true),
  billableRate: numeric('billable_rate', { precision: 10, scale: 2 }),
  isRunning: boolean('is_running').default(false),
  workspaceId: uuid('workspace_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})
