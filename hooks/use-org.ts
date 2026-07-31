'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'

export function useOrganization(orgSlug?: string) {
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const workspaces = useOrganizationStore((s) => s.workspaces)
  const teams = useOrganizationStore((s) => s.teams)
  const members = useOrganizationStore((s) => s.members)
  const isLoading = useOrganizationStore((s) => s.isLoading)

  useEffect(() => {
    if (!orgSlug) return
    let cancelled = false
    const supabase = createClient()

    async function load() {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single()

      if (cancelled || !org) return

      const store = useOrganizationStore.getState()
      store.setCurrentOrganization(org as any)
      store.setWorkspaces([])
      store.setTeams([])
      store.setMembers([])
      store.setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [orgSlug])

  const switchOrganization = useCallback((org: any) => {
    useOrganizationStore.getState().setCurrentOrganization(org)
  }, [])

  return { currentOrganization, workspaces, teams, members, isLoading, switchOrganization }
}
