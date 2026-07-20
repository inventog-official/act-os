import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-lg font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
            A
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Start your journey with ACT OS
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}
