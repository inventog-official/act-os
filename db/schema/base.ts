import { pgTable, pgSchema, uuid, text, integer, numeric, boolean, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

const auth = pgSchema('auth')
export const authUsers = auth.table('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  userMetadata: jsonb('user_metadata'),
})

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  website: text('website'),
  description: text('description'),
  ownerId: uuid('owner_id').notNull(),
  settings: jsonb('settings').default('{}'),
  tier: text('tier').notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  organizationId: uuid('organization_id').notNull(),
  settings: jsonb('settings').default('{}'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, t => ({ uniqueOrgSlug: uniqueIndex().on(t.organizationId, t.slug) }))

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  organizationId: uuid('organization_id').notNull(),
  isSystem: boolean('is_system').default(false),
  level: integer('level').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, t => ({ uniqueOrgSlug: uniqueIndex().on(t.organizationId, t.slug) }))

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull(),
  permissionId: uuid('permission_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.roleId, t.permissionId) }))

export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  userId: uuid('user_id').notNull(),
  roleId: uuid('role_id').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.organizationId, t.userId) }))

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull(),
  userId: uuid('user_id').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.teamId, t.userId) }))

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  organizationId: uuid('organization_id').notNull(),
  createdBy: uuid('created_by').notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  permissions: text('permissions').array().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: uuid('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  roleId: uuid('role_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, t => ({ unique: uniqueIndex().on(t.userId, t.roleId, t.organizationId) }))

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
})
