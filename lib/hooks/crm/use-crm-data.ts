'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'
import { getMockData, addMockData, updateMockData, deleteMockData } from '@/lib/auth/mock-data'
import type { CrmLead, CrmCompany, CrmContact, CrmDeal, CrmActivity, CrmTask, CrmNote, CrmPipeline, CrmPipelineStage, CrmTimeline } from '@/lib/types/database'

type TableName = 'crm_leads' | 'crm_companies' | 'crm_contacts' | 'crm_deals' | 'crm_activities' | 'crm_tasks'

function useSupabase() {
  const supabase = createClient()
  return supabase
}

export function useCrmList<T>(table: TableName, organizationId: string | undefined) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useSupabase()

  const fetch = useCallback(async () => {
    if (!organizationId) return
    setIsLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        setData(getMockData(table) as T[])
        setIsLoading(false)
        return
      }
      const { data: result, error } = await supabase
        .from(table)
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      setData((result || []) as T[])
    } catch (err) {
      console.error(`Error fetching ${table}:`, err)
      setData(getMockData(table) as T[])
    } finally {
      setIsLoading(false)
    }
  }, [table, organizationId, supabase])

  useEffect(() => { fetch() }, [fetch])

  const insert = useCallback(async (item: any) => {
    if (!isSupabaseConfigured()) {
      const newItem = addMockData(table, item)
      setData(prev => [newItem as T, ...prev])
      return newItem
    }
    const { data: result, error } = await supabase.from(table).insert(item).select().single()
    if (error) throw error
    fetch()
    return result
  }, [table, supabase, fetch])

  const update = useCallback(async (id: string, updates: any) => {
    if (!isSupabaseConfigured()) {
      updateMockData(table, id, updates)
      setData(prev => prev.map(item => (item as any).id === id ? { ...item, ...updates } : item))
      return
    }
    const { error } = await supabase.from(table).update(updates).eq('id', id)
    if (error) throw error
    fetch()
  }, [table, supabase, fetch])

  const remove = useCallback(async (id: string) => {
    if (!isSupabaseConfigured()) {
      deleteMockData(table, id)
      setData(prev => prev.filter(item => (item as any).id !== id))
      return
    }
    const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    fetch()
  }, [table, supabase, fetch])

  return { data, isLoading, refetch: fetch, insert, update, remove }
}
