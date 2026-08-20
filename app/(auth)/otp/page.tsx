'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthButton } from '@/components/auth/AuthButton'

export default function OtpPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) {
        setError(error.message)
        toast.error(error.message)
        return
      }
      toast.success('Passcode dispatched to your email')
      setStep('otp')
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otp = otpRefs.current.map((ref) => ref?.value || '').join('')
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit passcode')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })

      if (error) {
        setError(error.message)
        toast.error(error.message)
        return
      }

      toast.success('Welcome to ACT OS')
      router.push('/demo-corp/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpRefs.current[index]?.value && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  return (
    <AuthLayout
      headline="Instant Passcode Access."
      subtitle="Authenticate passwordless directly to your workspace using secure cryptographic email dispatch."
    >
      <div className="space-y-8 animate-fade-in">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
            ACT OS // PASSWORDLESS
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight">
            {step === 'email' ? 'Request Passcode' : 'Verify Passcode'}
          </h1>
          <p className="text-sm text-neutral-400 font-light mt-1.5 leading-relaxed">
            {step === 'email'
              ? 'Enter your work email to receive a 6-digit authorization code.'
              : `Enter the 6-digit code dispatched to ${email}`}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-[10px] bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-300">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <AuthInput
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <AuthButton type="submit" isLoading={isLoading} className="mt-2">
              Send 6-Digit Passcode →
            </AuthButton>

            <div className="pt-2 text-center text-xs font-mono text-neutral-400">
              Prefer password sign in?{' '}
              <Link
                href="/login"
                className="text-white hover:underline underline-offset-4 font-semibold"
              >
                Sign in →
              </Link>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el
                  }}
                  type="text"
                  maxLength={1}
                  className="h-14 w-12 rounded-[10px] bg-[#0A0A0A] border border-white/[0.12] text-center text-xl font-mono font-semibold text-white focus:border-white focus:shadow-[0_0_12px_rgba(255,255,255,0.15)] outline-none transition-all"
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <AuthButton
                type="button"
                variant="outline"
                onClick={() => setStep('email')}
                className="w-1/3"
              >
                ← Back
              </AuthButton>
              <AuthButton
                type="button"
                onClick={handleVerifyOtp}
                isLoading={isLoading}
                className="w-2/3"
              >
                Verify &amp; Enter
              </AuthButton>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
