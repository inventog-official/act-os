'use client'

import { type ReactNode, useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'
import { mockOrganization, mockWorkspace } from '@/lib/auth/mock-data'

type OrgState = 'loading' | 'ready' | 'not-found' | 'error'

export function OrgProvider({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = use(params)
  const [state, setState] = useState<OrgState>('loading')

  useEffect(() => {
    let cancelled = false
    const store = useOrganizationStore.getState()
    const { setCurrentOrganization, setWorkspaces, setTeams, setMembers, setLoading } = store
    const supabase = createClient()

    async function loadOrg() {
      setLoading(true)
      setState('loading')

      if (!isSupabaseConfigured()) {
        setCurrentOrganization(mockOrganization as any)
        setWorkspaces([mockWorkspace] as any)
        setTeams([])
        setMembers([])
        setLoading(false)
        if (!cancelled) setState('ready')
        return
      }

      let org: any = null
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', orgSlug)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows matched -> org does not exist or RLS hid it.
            if (!cancelled) setState('not-found')
            return
          }
          throw error
        }
        org = data
      } catch (err) {
        console.error('[OrgProvider] failed to load org:', err)
        if (!cancelled) setState('error')
        return
      } finally {
        setLoading(false)
      }

      if (cancelled) return

      setCurrentOrganization(org)

      const [workspacesRes, teamsRes, membersRes] = await Promise.all([
        supabase.from('workspaces').select('*').eq('organization_id', org.id),
        supabase.from('teams').select('*').eq('organization_id', org.id),
        supabase.from('organization_members').select('*').eq('organization_id', org.id),
      ])

      setWorkspaces(workspacesRes.data ?? [])
      setTeams(teamsRes.data ?? [])
      setMembers(membersRes.data ?? [])
      if (!cancelled) setState('ready')
    }

    loadOrg()

    return () => {
      cancelled = true
    }
  }, [orgSlug])

  if (state === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center max-w-sm px-4">
          <p className="text-4xl mb-4">🏢</p>
          <h1 className="text-xl font-semibold mb-2">Organization not found</h1>
          <p className="text-sm text-zinc-500 mb-6">
            The organization “{orgSlug}” doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 text-white text-sm font-medium px-4 py-2 dark:bg-white dark:text-zinc-900"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center max-w-sm px-4">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-zinc-500 mb-6">
            We couldn&apos;t load this organization. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 text-white text-sm font-medium px-4 py-2 dark:bg-white dark:text-zinc-900"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
