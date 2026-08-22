'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Lock,
  Building2,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/utils/validations'
import { AuthInput } from './AuthInput'
import { AuthButton } from './AuthButton'
import { setMockUser } from '@/lib/auth/mock-auth'
import { useAuthStore } from '@/lib/store'
import { IoLogoStencil } from 'react-icons/io5'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  // Step 1: Validate account details and advance to workspace step
  const handleNextStep = async () => {
    const isValid = await trigger(['name', 'email', 'password', 'confirmPassword'])
    if (isValid) {
      const email = getValues('email')
      const domain = email.split('@')[1]?.split('.')[0] || 'corp'
      const generatedName = domain.charAt(0).toUpperCase() + domain.slice(1) + ' Systems'
      setWorkspaceName(generatedName)
      setWorkspaceSlug(domain.toLowerCase() + '-workspace')
      setStep(2)
    }
  }

  // Step 2: Finalize signup & workspace creation
  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setAuthError(null)
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            workspace_name: workspaceName || 'Primary Workspace',
            workspace_slug: workspaceSlug || 'demo-corp',
          },
        },
      })

      if (error) {
        setAuthError(error.message)
        toast.error(error.message)
        return
      }

      // If user is auto-confirmed or in dev mock mode
      if (!authData.user) {
        setMockUser({
          id: 'mock-new-user-id',
          email: data.email,
          name: data.name,
        })
        useAuthStore.getState().setUser({
          id: 'mock-new-user-id',
          email: data.email,
          user_metadata: { name: data.name },
        } as any)
      }

      setStep(3)
    } catch (err: any) {
      setAuthError(err?.message || 'Workspace initialization failed.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Transition to Dashboard
  const handleLaunch = () => {
    const slug = workspaceSlug || 'demo-corp'
    router.push(`/${slug}/dashboard`)
  }

  if (step === 3) {
    return (
      <div className="space-y-8 animate-fade-in text-center py-6">
        {/* Animated Formation Ring */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl border border-white/30 animate-ping opacity-25" />
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
            <CheckCircle2 className="w-8 h-8 text-black" />
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
            WORKSPACE PROVISIONED
          </div>
          <h2 className="text-3xl font-light text-white tracking-tight">
            Welcome to ACT OS.
          </h2>
          <p className="text-sm text-neutral-400 font-light mt-2 max-w-sm mx-auto leading-relaxed">
            Your environment <strong className="text-white">{workspaceName}</strong> has been initialized with deterministic telemetry and real-time ledger sync.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 text-left font-mono text-xs text-neutral-300 space-y-2 max-w-sm mx-auto">
          <div className="flex justify-between text-neutral-500 text-[10px]">
            <span>NODE_ENDPOINT</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="text-white text-xs truncate">
            https://actos.app/{workspaceSlug}
          </div>
        </div>

        <AuthButton onClick={handleLaunch} className="max-w-sm mx-auto flex items-center justify-center gap-2">
          <span>Enter Workspace</span>
          <ArrowRight className="h-4 w-4" />
        </AuthButton>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Step Indicator */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[7px] bg-white text-black flex items-center justify-center shadow-xs">
              <IoLogoStencil className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-white tracking-tight">ACT OS</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={step === 1 ? 'text-white font-semibold' : 'text-neutral-500'}>
              01 Account
            </span>
            <span className="text-neutral-700">/</span>
            <span className={step === 2 ? 'text-white font-semibold' : 'text-neutral-500'}>
              02 Workspace
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-white tracking-tight">
          {step === 1 ? 'Create your account' : 'Build your workspace'}
        </h1>
        <p className="text-xs text-neutral-400 font-normal mt-1 leading-relaxed">
          {step === 1
            ? 'Set up your master credentials for ACT OS.'
            : 'Configure your primary organization and operational environment.'}
        </p>
      </div>

      {authError && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-normal">
          {authError}
        </div>
      )}

      {/* Step 1: User Account Form */}
      {step === 1 && (
        <div className="space-y-4">
          <AuthInput
            label="Full Name"
            icon={User}
            placeholder="Ada Lovelace"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />

          <AuthInput
            label="Work Email"
            type="email"
            icon={Mail}
            placeholder="ada@company.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <AuthInput
            label="Master Password"
            isPassword
            icon={Lock}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <AuthInput
            label="Confirm Password"
            isPassword
            icon={Lock}
            placeholder="Re-enter password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <AuthButton type="button" onClick={handleNextStep} className="mt-2 flex items-center justify-center gap-2">
            <span>Continue to Workspace Setup</span>
            <ArrowRight className="h-4 w-4" />
          </AuthButton>
        </div>
      )}

      {/* Step 2: Workspace Details Form */}
      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Workspace / Company Name
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                <Building2 className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => {
                  setWorkspaceName(e.target.value)
                  setWorkspaceSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')
                  )
                }}
                placeholder="Acme Aerospace"
                className="w-full h-[52px] pl-10 pr-4 rounded-[11px] bg-[#0A0A0A] border border-white/[0.12] text-white text-sm placeholder:text-neutral-600 outline-none hover:border-white/20 focus:border-white focus:shadow-[0_0_12px_rgba(255,255,255,0.15)] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Workspace URL Identifier
            </label>
            <div className="flex items-center h-[52px] px-4 rounded-[11px] bg-[#0A0A0A] border border-white/[0.12] text-sm text-neutral-400">
              <Globe className="h-4 w-4 text-neutral-500 mr-2 shrink-0" />
              <span className="font-mono text-xs text-neutral-500 mr-1 select-none">actos.app/</span>
              <input
                type="text"
                required
                value={workspaceSlug}
                onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase())}
                placeholder="acme"
                className="flex-1 bg-transparent text-white font-mono text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <AuthButton
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="w-1/3 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </AuthButton>
            <AuthButton type="submit" isLoading={isLoading} className="w-2/3 flex items-center justify-center gap-2">
              <span>Initialize Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </AuthButton>
          </div>
        </form>
      )}

      {/* Footer Link */}
      <div className="pt-2 text-center text-xs font-mono text-neutral-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-white hover:underline underline-offset-4 font-semibold"
        >
          Sign in →
        </Link>
      </div>
    </div>
  )
}
