export type Role = 'admin' | 'manager' | 'sales_executive' | 'employee' | 'guest'

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

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'crm:leads:read', 'crm:leads:create', 'crm:leads:update', 'crm:leads:delete', 'crm:leads:export',
    'crm:companies:read', 'crm:companies:create', 'crm:companies:update', 'crm:companies:delete',
    'crm:contacts:read', 'crm:contacts:create', 'crm:contacts:update', 'crm:contacts:delete',
    'crm:deals:read', 'crm:deals:create', 'crm:deals:update', 'crm:deals:delete',
    'crm:pipeline:manage',
    'crm:activities:read', 'crm:activities:create',
    'crm:tasks:read', 'crm:tasks:create', 'crm:tasks:update', 'crm:tasks:delete',
    'crm:notes:read', 'crm:notes:create', 'crm:notes:update', 'crm:notes:delete',
    'crm:settings:manage',
    'team:manage',
    'workspace:manage',
  ],
  manager: [
    'crm:leads:read', 'crm:leads:create', 'crm:leads:update', 'crm:leads:delete', 'crm:leads:export',
    'crm:companies:read', 'crm:companies:create', 'crm:companies:update', 'crm:companies:delete',
    'crm:contacts:read', 'crm:contacts:create', 'crm:contacts:update', 'crm:contacts:delete',
    'crm:deals:read', 'crm:deals:create', 'crm:deals:update', 'crm:deals:delete',
    'crm:pipeline:manage',
    'crm:activities:read', 'crm:activities:create',
    'crm:tasks:read', 'crm:tasks:create', 'crm:tasks:update', 'crm:tasks:delete',
    'crm:notes:read', 'crm:notes:create', 'crm:notes:update', 'crm:notes:delete',
    'team:manage',
  ],
  sales_executive: [
    'crm:leads:read', 'crm:leads:create', 'crm:leads:update', 'crm:leads:export',
    'crm:companies:read', 'crm:companies:create', 'crm:companies:update',
    'crm:contacts:read', 'crm:contacts:create', 'crm:contacts:update',
    'crm:deals:read', 'crm:deals:create', 'crm:deals:update',
    'crm:activities:read', 'crm:activities:create',
    'crm:tasks:read', 'crm:tasks:create', 'crm:tasks:update',
    'crm:notes:read', 'crm:notes:create', 'crm:notes:update',
  ],
  employee: [
    'crm:leads:read', 'crm:leads:create', 'crm:leads:update',
    'crm:companies:read', 'crm:companies:create',
    'crm:contacts:read', 'crm:contacts:create', 'crm:contacts:update',
    'crm:deals:read', 'crm:deals:create',
    'crm:activities:read', 'crm:activities:create',
    'crm:tasks:read', 'crm:tasks:create', 'crm:tasks:update',
    'crm:notes:read', 'crm:notes:create',
  ],
  guest: [
    'crm:leads:read',
    'crm:companies:read',
    'crm:contacts:read',
    'crm:deals:read',
    'crm:activities:read',
    'crm:tasks:read',
    'crm:notes:read',
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
  admin: 'Admin',
  manager: 'Manager',
  sales_executive: 'Sales Executive',
  employee: 'Employee',
  guest: 'Guest',
}

export const roleLevels: Record<Role, number> = {
  admin: 100,
  manager: 80,
  sales_executive: 60,
  employee: 40,
  guest: 10,
}
