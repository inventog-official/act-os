import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from './mock-auth'
import { db } from '@/db'
import { organizations, organizationMembers, roles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export type Role = 'super_admin' | 'admin' | 'manager' | 'sales_executive' | 'employee' | 'guest'

export type Permission = 
  | 'crm:leads:read'
  | 'crm:leads:create'
  | 'crm:leads:update'
  | 'crm:leads:delete'
  | 'crm:leads:export'
  | 'crm:companies:read'
  | 'crm:companies:create'
  | 'crm:companies:update'
  | 'crm:companies:delete'
  | 'crm:contacts:read'
  | 'crm:contacts:create'
  | 'crm:contacts:update'
  | 'crm:contacts:delete'
  | 'crm:deals:read'
  | 'crm:deals:create'
  | 'crm:deals:update'
  | 'crm:deals:delete'
  | 'crm:pipeline:manage'
  | 'crm:activities:read'
  | 'crm:activities:create'
  | 'crm:activities:delete'
  | 'crm:tasks:read'
  | 'crm:tasks:create'
  | 'crm:tasks:update'
  | 'crm:tasks:delete'
  | 'crm:notes:read'
  | 'crm:notes:create'
  | 'crm:notes:update'
  | 'crm:notes:delete'
  | 'crm:settings:manage'
  | 'team:manage'
  | 'workspace:manage'
  | 'hr:dashboard:view'
  | 'hr:employees:read'
  | 'hr:employees:create'
  | 'hr:employees:update'
  | 'hr:employees:delete'
  | 'hr:departments:read'
  | 'hr:departments:manage'
  | 'hr:teams:read'
  | 'hr:teams:manage'
  | 'hr:attendance:read'
  | 'hr:attendance:manage'
  | 'hr:leave:read'
  | 'hr:leave:request'
  | 'hr:leave:approve'
  | 'hr:recruitment:read'
  | 'hr:recruitment:manage'
  | 'hr:offers:manage'
  | 'hr:onboarding:manage'
  | 'hr:offboarding:manage'
  | 'hr:skills:read'
  | 'hr:skills:manage'
  | 'hr:capacity:read'
  | 'hr:capacity:manage'
  | 'hr:performance:read'
  | 'hr:performance:manage'
  | 'hr:goals:read'
  | 'hr:goals:manage'
  | 'hr:compensation:read'
  | 'hr:compensation:manage'
  | 'hr:reports:read'
  | 'hr:activity:read'
  | 'documents:view'
  | 'documents:create'
  | 'documents:update'
  | 'documents:delete'
  | 'documents:share'
  | 'documents:approve'
  | 'documents:publish'
  | 'documents:templates:manage'
  | 'documents:knowledge:manage'
  | 'documents:sops:manage'
  | 'documents:policies:manage'
  | 'documents:contracts:manage'
   | 'documents:expiration:manage'
  | 'documents:activity:read'
  | 'inventory:dashboard:view'
  | 'inventory:products:read'
  | 'inventory:products:manage'
  | 'inventory:categories:manage'
  | 'inventory:units:manage'
  | 'inventory:warehouses:manage'
  | 'inventory:warehouses:read'
  | 'inventory:stock:read'
  | 'inventory:stock:adjust'
  | 'inventory:stock:transfer'
  | 'inventory:stock:reserve'
  | 'inventory:stock:receive'
  | 'inventory:suppliers:manage'
  | 'inventory:suppliers:read'
  | 'inventory:procurement:purchase_request:create'
  | 'inventory:procurement:purchase_request:approve'
  | 'inventory:procurement:purchase_order:create'
  | 'inventory:procurement:purchase_order:approve'
  | 'inventory:procurement:purchase_order:send'
  | 'inventory:procurement:receiving'
  | 'inventory:procurement:return'
  | 'inventory:procurement:reorder:manage'
  | 'inventory:reports:view'
  | 'inventory:valuation:manage'
  | 'inventory:assets:view'
  | 'inventory:assets:manage'
  | 'inventory:projects:view'
  | 'inventory:projects:manage'
  | 'inventory:activity:view'
  | 'calendar:view'
  | 'calendar:create'
  | 'calendar:update'
  | 'calendar:delete'
  | 'calendar:availability:manage'
  | 'calendar:integration:manage'
  | 'calendar:activity:view'
  | 'meeting:view'
  | 'meeting:create'
  | 'meeting:update'
  | 'meeting:cancel'
  | 'meeting:manage'
  | 'meeting:notes:manage'
  | 'meeting:decision:manage'
  | 'meeting:action:manage'
  | 'communication:view'
  | 'communication:send'
  | 'communication:manage'
  | 'email:send'
  | 'email:view'
  | 'email:connection:manage'

const rolePermissions: Record<Role, Permission[]> = {
  super_admin: [
    'crm:leads:read', 'crm:leads:create', 'crm:leads:update', 'crm:leads:delete', 'crm:leads:export',
    'crm:companies:read', 'crm:companies:create', 'crm:companies:update', 'crm:companies:delete',
    'crm:contacts:read', 'crm:contacts:create', 'crm:contacts:update', 'crm:contacts:delete',
    'crm:deals:read', 'crm:deals:create', 'crm:deals:update', 'crm:deals:delete',
    'crm:pipeline:manage',
    'crm:activities:read', 'crm:activities:create', 'crm:activities:delete',
    'crm:tasks:read', 'crm:tasks:create', 'crm:tasks:update', 'crm:tasks:delete',
    'crm:notes:read', 'crm:notes:create', 'crm:notes:update', 'crm:notes:delete',
    'crm:settings:manage',
    'team:manage',
    'workspace:manage',
    'hr:dashboard:view',
    'hr:employees:read', 'hr:employees:create', 'hr:employees:update', 'hr:employees:delete',
    'hr:departments:read', 'hr:departments:manage',
    'hr:teams:read', 'hr:teams:manage',
    'hr:attendance:read', 'hr:attendance:manage',
    'hr:leave:read', 'hr:leave:request', 'hr:leave:approve',
    'hr:recruitment:read', 'hr:recruitment:manage',
    'hr:offers:manage',
    'hr:onboarding:manage',
    'hr:offboarding:manage',
    'hr:skills:read', 'hr:skills:manage',
    'hr:capacity:read', 'hr:capacity:manage',
    'hr:performance:read', 'hr:performance:manage',
    'hr:goals:read', 'hr:goals:manage',
    'hr:compensation:read', 'hr:compensation:manage',
    'hr:reports:read',
    'hr:activity:read',
    'documents:view', 'documents:create', 'documents:update', 'documents:delete',
    'documents:share', 'documents:approve', 'documents:publish',
    'documents:templates:manage', 'documents:knowledge:manage',
    'documents:sops:manage', 'documents:policies:manage', 'documents:contracts:manage',
     'documents:expiration:manage', 'documents:activity:read',
    'inventory:dashboard:view', 'inventory:products:read', 'inventory:products:manage',
    'inventory:categories:manage', 'inventory:units:manage',
    'inventory:warehouses:manage', 'inventory:warehouses:read',
    'inventory:stock:read', 'inventory:stock:adjust', 'inventory:stock:transfer',
    'inventory:stock:reserve', 'inventory:stock:receive',
    'inventory:suppliers:manage', 'inventory:suppliers:read',
    'inventory:procurement:purchase_request:create', 'inventory:procurement:purchase_request:approve',
    'inventory:procurement:purchase_order:create', 'inventory:procurement:purchase_order:approve',
    'inventory:procurement:purchase_order:send', 'inventory:procurement:receiving',
    'inventory:procurement:return', 'inventory:procurement:reorder:manage',
    'inventory:reports:view', 'inventory:valuation:manage',
    'inventory:assets:view', 'inventory:assets:manage',
    'inventory:projects:view', 'inventory:projects:manage', 'inventory:activity:view',
    'calendar:view', 'calendar:create', 'calendar:update', 'calendar:delete',
    'calendar:availability:manage', 'calendar:integration:manage', 'calendar:activity:view',
    'meeting:view', 'meeting:create', 'meeting:update', 'meeting:cancel', 'meeting:manage',
    'meeting:notes:manage', 'meeting:decision:manage', 'meeting:action:manage',
    'communication:view', 'communication:send', 'communication:manage',
    'email:send', 'email:view', 'email:connection:manage',
  ],
  admin: [
    'crm:leads:read', 'crm:leads:create', 'crm:leads:update', 'crm:leads:delete', 'crm:leads:export',
    'crm:companies:read', 'crm:companies:create', 'crm:companies:update', 'crm:companies:delete',
    'crm:contacts:read', 'crm:contacts:create', 'crm:contacts:update', 'crm:contacts:delete',
    'crm:deals:read', 'crm:deals:create', 'crm:deals:update', 'crm:deals:delete',
    'crm:pipeline:manage',
    'crm:activities:read', 'crm:activities:create', 'crm:activities:delete',
    'crm:tasks:read', 'crm:tasks:create', 'crm:tasks:update', 'crm:tasks:delete',
    'crm:notes:read', 'crm:notes:create', 'crm:notes:update', 'crm:notes:delete',
    'crm:settings:manage',
    'team:manage',
    'workspace:manage',
    'hr:dashboard:view',
    'hr:employees:read', 'hr:employees:create', 'hr:employees:update', 'hr:employees:delete',
    'hr:departments:read', 'hr:departments:manage',
    'hr:teams:read', 'hr:teams:manage',
    'hr:attendance:read', 'hr:attendance:manage',
    'hr:leave:read', 'hr:leave:request', 'hr:leave:approve',
    'hr:recruitment:read', 'hr:recruitment:manage',
    'hr:offers:manage',
    'hr:onboarding:manage',
    'hr:offboarding:manage',
    'hr:skills:read', 'hr:skills:manage',
    'hr:capacity:read', 'hr:capacity:manage',
    'hr:performance:read', 'hr:performance:manage',
    'hr:goals:read', 'hr:goals:manage',
    'hr:compensation:read', 'hr:compensation:manage',
    'hr:reports:read',
    'hr:activity:read',
    'documents:view', 'documents:create', 'documents:update', 'documents:delete',
    'documents:share', 'documents:approve', 'documents:publish',
    'documents:templates:manage', 'documents:knowledge:manage',
    'documents:sops:manage', 'documents:policies:manage', 'documents:contracts:manage',
    'documents:expiration:manage', 'documents:activity:read',
    'inventory:dashboard:view', 'inventory:products:read', 'inventory:products:manage',
    'inventory:categories:manage', 'inventory:units:manage',
    'inventory:warehouses:manage', 'inventory:warehouses:read',
    'inventory:stock:read', 'inventory:stock:adjust', 'inventory:stock:transfer',
    'inventory:stock:reserve', 'inventory:stock:receive',
    'inventory:suppliers:manage', 'inventory:suppliers:read',
    'inventory:procurement:purchase_request:create', 'inventory:procurement:purchase_request:approve',
    'inventory:procurement:purchase_order:create', 'inventory:procurement:purchase_order:approve',
    'inventory:procurement:purchase_order:send', 'inventory:procurement:receiving',
    'inventory:procurement:return', 'inventory:procurement:reorder:manage',
    'inventory:reports:view', 'inventory:valuation:manage',
    'inventory:assets:view', 'inventory:assets:manage',
    'inventory:projects:view', 'inventory:projects:manage', 'inventory:activity:view',
    'calendar:view', 'calendar:create', 'calendar:update', 'calendar:delete',
    'calendar:availability:manage', 'calendar:integration:manage', 'calendar:activity:view',
    'meeting:view', 'meeting:create', 'meeting:update', 'meeting:cancel', 'meeting:manage',
    'meeting:notes:manage', 'meeting:decision:manage', 'meeting:action:manage',
    'communication:view', 'communication:send', 'communication:manage',
    'email:send', 'email:view', 'email:connection:manage',
  ],
  manager: [
    'crm:leads:read', 'crm:leads:create', 'crm:leads:update', 'crm:leads:delete', 'crm:leads:export',
    'crm:companies:read', 'crm:companies:create', 'crm:companies:update', 'crm:companies:delete',
    'crm:contacts:read', 'crm:contacts:create', 'crm:contacts:update', 'crm:contacts:delete',
    'crm:deals:read', 'crm:deals:create', 'crm:deals:update', 'crm:deals:delete',
    'crm:pipeline:manage',
    'crm:activities:read', 'crm:activities:create', 'crm:activities:delete',
    'crm:tasks:read', 'crm:tasks:create', 'crm:tasks:update', 'crm:tasks:delete',
    'crm:notes:read', 'crm:notes:create', 'crm:notes:update', 'crm:notes:delete',
    'team:manage',
    'hr:dashboard:view',
    'hr:employees:read', 'hr:employees:create', 'hr:employees:update',
    'hr:departments:read', 'hr:departments:manage',
    'hr:teams:read', 'hr:teams:manage',
    'hr:attendance:read', 'hr:attendance:manage',
    'hr:leave:read', 'hr:leave:approve',
    'hr:recruitment:read',
    'hr:skills:read',
    'hr:capacity:read',
    'hr:performance:read',
    'hr:goals:read', 'hr:goals:manage',
    'hr:reports:read',
    'hr:activity:read',
    'documents:view', 'documents:create', 'documents:update',
    'documents:share', 'documents:approve', 'documents:publish',
    'documents:templates:manage', 'documents:knowledge:manage',
     'documents:sops:manage', 'documents:policies:manage', 'documents:contracts:manage',
    'inventory:dashboard:view', 'inventory:products:read',
    'inventory:warehouses:read', 'inventory:stock:read',
    'inventory:suppliers:read',
    'inventory:procurement:purchase_request:create', 'inventory:procurement:purchase_order:create',
    'inventory:reports:view', 'inventory:activity:view',
    'calendar:view', 'calendar:create', 'calendar:update',
    'calendar:availability:manage', 'calendar:activity:view',
    'meeting:view', 'meeting:create', 'meeting:update', 'meeting:cancel',
    'meeting:notes:manage', 'meeting:decision:manage', 'meeting:action:manage',
    'communication:view', 'communication:send', 'communication:manage',
    'email:send', 'email:view',
  ],
  sales_executive: [
    'crm:leads:read', 'crm:leads:create', 'crm:leads:update', 'crm:leads:export',
    'crm:companies:read', 'crm:companies:create', 'crm:companies:update',
    'crm:contacts:read', 'crm:contacts:create', 'crm:contacts:update',
    'crm:deals:read', 'crm:deals:create', 'crm:deals:update',
    'crm:activities:read', 'crm:activities:create', 'crm:activities:delete',
    'crm:tasks:read', 'crm:tasks:create', 'crm:tasks:update',
    'crm:notes:read', 'crm:notes:create', 'crm:notes:update',
    'calendar:view', 'calendar:create', 'calendar:update',
    'calendar:availability:manage',
    'meeting:view', 'meeting:create', 'meeting:update',
    'meeting:notes:manage', 'meeting:decision:manage', 'meeting:action:manage',
    'communication:view', 'communication:send',
    'email:send', 'email:view',
  ],
  employee: [
    'crm:leads:read', 'crm:leads:create', 'crm:leads:update',
    'crm:companies:read', 'crm:companies:create',
    'crm:contacts:read', 'crm:contacts:create', 'crm:contacts:update',
    'crm:deals:read', 'crm:deals:create',
    'crm:activities:read', 'crm:activities:create',
    'crm:tasks:read', 'crm:tasks:create', 'crm:tasks:update',
    'crm:notes:read', 'crm:notes:create',
    'hr:dashboard:view',
    'hr:employees:read',
    'hr:departments:read',
    'hr:teams:read',
    'hr:attendance:read', 'hr:attendance:manage',
    'hr:leave:read', 'hr:leave:request',
    'hr:skills:read', 'hr:skills:manage',
    'hr:performance:read',
    'hr:goals:read',
    'hr:activity:read',
     'documents:view', 'documents:create', 'documents:update',
    'inventory:dashboard:view', 'inventory:stock:read',
    'inventory:assets:view', 'inventory:projects:view',
    'calendar:view', 'calendar:create',
    'meeting:view', 'meeting:create', 'meeting:update',
    'meeting:notes:manage', 'meeting:action:manage',
    'communication:view', 'communication:send',
    'email:view',
  ],
  guest: [
    'crm:leads:read',
    'crm:companies:read',
    'crm:contacts:read',
    'crm:deals:read',
    'crm:activities:read',
    'crm:tasks:read',
    'crm:notes:read',
    'documents:view',
    'calendar:view',
    'meeting:view',
    'communication:view',
  ],
}

const defaultRole: Role = 'employee'

export function getPermissionsForRole(role: Role | string): Permission[] {
  return rolePermissions[role as Role] || rolePermissions[defaultRole]
}

export function can(role: Role | string | undefined, permission: Permission): boolean {
  if (!role) return false
  const permissions = getPermissionsForRole(role)
  return permissions.includes(permission)
}

export async function requirePermission(organizationId: string, permission: Permission) {
  if (!isSupabaseConfigured()) return

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!organizationId) {
    throw new Error('Organization ID or slug is required')
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)

  // 1. Resolve organization by UUID or slug
  let org: typeof organizations.$inferSelect | undefined
  if (isUuid) {
    const orgs = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)
    org = orgs[0]
  }
  if (!org) {
    const orgs = await db.select().from(organizations).where(eq(organizations.slug, organizationId)).limit(1)
    org = orgs[0]
  }

  // 2. If user is organization owner, grant all permissions
  if (org && org.ownerId === user.id) {
    return
  }

  const targetOrgId = org?.id || (isUuid ? organizationId : null)

  // 3. Query membership in Drizzle
  if (targetOrgId) {
    const members = await db
      .select({
        roleId: organizationMembers.roleId,
        roleSlug: roles.slug,
      })
      .from(organizationMembers)
      .leftJoin(roles, eq(organizationMembers.roleId, roles.id))
      .where(
        and(
          eq(organizationMembers.organizationId, targetOrgId),
          eq(organizationMembers.userId, user.id)
        )
      )
      .limit(1)

    if (members.length > 0) {
      const member = members[0]
      const roleSlug = (member.roleSlug || 'admin') as Role
      if (roleSlug === 'admin' || roleSlug === 'super_admin' || can(roleSlug, permission)) {
        return
      }
      throw new Error(`Missing permission: ${permission}`)
    }
  }

  // 4. Check if user is owner of any organization matching the current context
  const ownedOrgs = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.ownerId, user.id))
    .limit(1)

  if (ownedOrgs.length > 0 && (!targetOrgId || targetOrgId === ownedOrgs[0].id)) {
    return
  }

  throw new Error('Not a member of this organization')
}

export function usePermissions(role?: Role | string) {
  const userRole = role || defaultRole
  return {
    can: (permission: Permission) => can(userRole, permission),
    role: userRole,
    isAdmin: userRole === 'admin',
    isManager: userRole === 'admin' || userRole === 'manager',
  }
}

export const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  sales_executive: 'Sales Executive',
  employee: 'Employee',
  guest: 'Guest',
}

export const roleLevels: Record<Role, number> = {
  super_admin: 120,
  admin: 100,
  manager: 80,
  sales_executive: 60,
  employee: 40,
  guest: 10,
}
