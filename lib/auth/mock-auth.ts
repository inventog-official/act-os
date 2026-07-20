const MOCK_SESSION_KEY = 'act_os_mock_session'

export interface MockUser {
  id: string
  email: string
  name: string
}

export function setMockUser(user: MockUser) {
  if (typeof window === 'undefined') return
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user))
}

export function getMockUser(): MockUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MockUser
  } catch {
    return null
  }
}

export function clearMockUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(MOCK_SESSION_KEY)
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('your-project') && !key.includes('your-anon'))
}
