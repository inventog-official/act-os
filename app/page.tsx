import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isMock = !url || !key || url === 'your_supabase_url' || key === 'your_supabase_anon_key' || url === 'https://your-project.supabase.co'

  if (isMock) {
    redirect('/acme-corp/dashboard')
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(url!, key!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/acme-corp/dashboard' : '/login')
}
