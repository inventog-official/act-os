'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/utils/validations'
import { setMockUser, getMockUser, isSupabaseConfigured } from '@/lib/auth/mock-auth'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

              toast.success('Welcome back!')
              const redirect = searchParams.get('redirect') || '/acme-corp/dashboard'
              router.push(redirect)
              router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) toast.error(error.message)
  }

  const handleOtpLogin = async () => {
    router.push('/otp')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          <input type="checkbox" className="rounded border-zinc-300 dark:border-zinc-700" />
          Remember me
        </label>
        <button type="button" className="text-sm text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
          Forgot password?
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-950">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={handleGoogleLogin} className="w-full">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </Button>
        <Button type="button" variant="outline" onClick={handleOtpLogin} className="w-full">
          OTP Login
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-950">development</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
        onClick={async () => {
          setIsLoading(true)
          try {
            if (isSupabaseConfigured()) {
              await fetch('/api/auth/test-login', { method: 'POST' })
              const { error } = await supabase.auth.signInWithPassword({
                email: 'admin@example.com',
                password: 'adminpass',
              })
              if (error) { toast.error(error.message); return }
            } else {
              setMockUser({
                id: '00000000-0000-0000-0000-000000000000',
                email: 'admin@example.com',
                name: 'Admin User',
              })
              useAuthStore.getState().setUser({
                id: '00000000-0000-0000-0000-000000000000',
                email: 'admin@example.com',
                app_metadata: {},
                user_metadata: { name: 'Admin User' },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
              } as any)
            }
            toast.success('Welcome back!')
            const redirect = searchParams.get('redirect') || '/acme-corp/dashboard'
            router.push(redirect)
            router.refresh()
          } catch (err) {
            setMockUser({
              id: '00000000-0000-0000-0000-000000000000',
              email: 'admin@example.com',
              name: 'Admin User',
            })
            useAuthStore.getState().setUser({
              id: '00000000-0000-0000-0000-000000000000',
              email: 'admin@example.com',
              app_metadata: {},
              user_metadata: { name: 'Admin User' },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as any)
            toast.success('Welcome back! (Mock)')
            const redirect = searchParams.get('redirect') || '/acme-corp/dashboard'
            router.push(redirect)
            router.refresh()
          } finally {
            setIsLoading(false)
          }
        }}
        disabled={isLoading}
      >
        <ShieldCheck className="mr-2 h-4 w-4" />
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Test Login (admin@example.com)
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
          Create one
        </Link>
      </p>
    </form>
  )
}
