'use client'

import { type ReactNode, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'
import { mockOrganization, mockWorkspace } from '@/lib/auth/mock-data'

export function OrgProvider({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const { setCurrentOrganization, setWorkspaces, setTeams, setMembers, setLoading } = useOrganizationStore()

  useEffect(() => {
    async function loadOrg() {
      setLoading(true)

      if (!isSupabaseConfigured()) {
        setCurrentOrganization(mockOrganization as any)
        setWorkspaces([mockWorkspace] as any)
        setTeams([])
        setMembers([])
        setLoading(false)
        return
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single()

      if (org) {
        setCurrentOrganization(org as any)

        const [workspacesRes, teamsRes, membersRes] = await Promise.all([
          supabase.from('workspaces').select('*').eq('organization_id', (org as any).id),
          supabase.from('teams').select('*').eq('organization_id', (org as any).id),
          supabase.from('organization_members').select('*').eq('organization_id', (org as any).id),
        ])

        setWorkspaces(workspacesRes.data ?? [])
        setTeams(teamsRes.data ?? [])
        setMembers(membersRes.data ?? [])
      }
      setLoading(false)
    }

    loadOrg()
  }, [orgSlug, supabase, setCurrentOrganization, setWorkspaces, setTeams, setMembers, setLoading])

  return <>{children}</>
}
