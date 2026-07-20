'use client'

import { useMemo } from 'react'
import { ROLES } from '@/config/permissions'
import type { PermissionSlug } from '@/config/permissions'

export function usePermissions(userRole?: string) {
  const hasPermission = useMemo(() => {
    return (slug: PermissionSlug): boolean => {
      if (!userRole) return false
      const role = ROLES[userRole as keyof typeof ROLES]
      if (!role) return false
      return (role.permissions as readonly string[]).includes(slug)
    }
  }, [userRole])

  const hasAnyPermission = useMemo(() => {
    return (...slugs: PermissionSlug[]): boolean => {
      return slugs.some(s => hasPermission(s))
    }
  }, [hasPermission])

  const hasAllPermissions = useMemo(() => {
    return (...slugs: PermissionSlug[]): boolean => {
      return slugs.every(s => hasPermission(s))
    }
  }, [hasPermission])

  return { hasPermission, hasAnyPermission, hasAllPermissions }
}
