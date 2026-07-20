'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'

export function useOrganization(orgSlug?: string) {
  const supabase = createClient()
  const store = useOrganizationStore()

  useEffect(() => {
    async function load() {
      if (!orgSlug) return

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single()

      if (org) {
        store.setCurrentOrganization(org as any)
        store.setWorkspaces([])
        store.setTeams([])
        store.setMembers([])
      }
      store.setLoading(false)
    }

    load()
  }, [orgSlug, supabase, store])

  const switchOrganization = useCallback((org: any) => {
    store.setCurrentOrganization(org)
  }, [store])

  return { ...store, switchOrganization }
}
