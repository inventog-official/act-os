'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store'
import { getMockUser, clearMockUser, isSupabaseConfigured } from '@/lib/auth/mock-auth'

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()
  const { user, isLoading, setUser, setLoading, reset } = useAuthStore()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const mockUser = getMockUser()
      if (mockUser) {
        setUser({
          id: mockUser.id,
          email: mockUser.email,
          app_metadata: {},
          user_metadata: { name: mockUser.name },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any)
      }
      setLoading(false)
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user)
    })

    return () => subscription.unsubscribe()
  }, [supabase, setUser, setLoading])

  const signOut = useCallback(async () => {
    clearMockUser()
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    reset()
    router.push('/login')
    router.refresh()
  }, [supabase, reset, router])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  }
}
