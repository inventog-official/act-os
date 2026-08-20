import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <AuthLayout
      headline="Your business, connected."
      subtitle="Enter the operating system that brings your operations, people, inventory, and workflows together."
    >
      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
