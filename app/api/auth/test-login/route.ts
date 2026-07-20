import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TEST_EMAIL = 'admin@example.com'
const TEST_PASSWORD = 'adminpass'

export async function POST() {
  try {
    const admin = createAdminClient()

    const { error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { name: 'Admin User' },
    })

    if (error && !error.message.includes('already registered')) {
      console.error('Test login setup error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Test login setup error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
