'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthButton } from '@/components/auth/AuthButton'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <AuthLayout
      headline="Recover your credentials."
      subtitle="Enter your verified work email address to receive password reset authorization."
    >
      <div className="space-y-8 animate-fade-in">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
            ACT OS // SECURITY RECOVERY
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight">
            Forgot password
          </h1>
          <p className="text-sm text-neutral-400 font-light mt-1.5 leading-relaxed">
            {sent
              ? `Verification dispatch sent to ${email}`
              : 'Enter your email and we’ll dispatch a secure recovery link.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-[10px] bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-300">
            {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs font-mono text-neutral-300 space-y-2">
              <div className="text-emerald-400 text-[10px] font-semibold">
                [ DISPATCH CONFIRMED ]
              </div>
              <p className="text-neutral-400 text-xs font-sans font-light">
                Please check your inbox. The one-time token will remain active for 15 minutes.
              </p>
            </div>

            <Link href="/login" className="block">
              <AuthButton type="button">Back to Sign In</AuthButton>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <AuthButton type="submit" isLoading={loading} className="mt-2">
              Dispatch Reset Link
            </AuthButton>

            <div className="pt-2 text-center text-xs font-mono text-neutral-400">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-white hover:underline underline-offset-4 font-semibold"
              >
                Sign in →
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
