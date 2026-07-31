import { pgTable, uuid, text, integer, boolean, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  type: text('type').notNull().default('info'),
  read: boolean('read').default(false),
  link: text('link'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const taskReactions = pgTable('task_reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  commentId: uuid('comment_id').notNull(),
  userId: uuid('user_id').notNull(),
  emoji: text('emoji').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.commentId, t.userId, t.emoji) }))

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  projectId: uuid('project_id'),
  taskId: uuid('task_id'),
  title: text('title').notNull(),
  description: text('description'),
  eventType: text('event_type').notNull().default('task'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  allDay: boolean('all_day').default(false),
  color: text('color').default('#3b82f6'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const reportDefinitions = pgTable('report_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  reportType: text('report_type').notNull(),
  config: jsonb('config').default('{}'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const aiSuggestions = pgTable('ai_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  projectId: uuid('project_id'),
  suggestionType: text('suggestion_type').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').default('{}'),
  applied: boolean('applied').default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
