import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <AuthLayout
      headline="Build your workspace."
      subtitle="Set up your ACT OS workspace and start connecting your operations, people, inventory, and workflows into a single intelligent environment."
    >
      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  )
}
