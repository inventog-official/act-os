'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store'
import { getMockUser, clearMockUser, isSupabaseConfigured } from '@/lib/auth/mock-auth'

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    const store = useAuthStore.getState()

    if (!isSupabaseConfigured()) {
      const mockUser = getMockUser()
      if (mockUser) {
        store.setUser({
          id: mockUser.id,
          email: mockUser.email,
          app_metadata: {},
          user_metadata: { name: mockUser.name },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any)
      }
      store.setLoading(false)
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.getState().setUser(session?.user ?? null)
    })

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) useAuthStore.getState().setUser(user)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = useCallback(async () => {
    clearMockUser()
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    useAuthStore.getState().reset()
    router.push('/login')
    router.refresh()
  }, [supabase, router])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  }
}
