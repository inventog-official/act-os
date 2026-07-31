'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function OtpForm() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('OTP sent to your email!')
      setStep('otp')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otp = otpRefs.current.map(ref => ref?.value || '').join('')
    if (otp.length !== 6) {
      toast.error('Please enter the complete OTP')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Welcome!')
      router.push('/demo-corp/dashboard')
      router.refresh()
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

  if (step === 'email') {
    return (
      <form onSubmit={handleSendOtp} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send OTP
        </Button>
      </form>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm text-zinc-500">
          Enter the 6-digit code sent to <span className="font-medium text-zinc-900 dark:text-zinc-100">{email}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={el => { otpRefs.current[i] = el }}
            type="text"
            maxLength={1}
            className="h-12 w-10 rounded-lg border border-zinc-200 text-center text-lg font-semibold focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-300 dark:focus:ring-zinc-300"
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
          />
        ))}
      </div>

      <Button onClick={handleVerifyOtp} className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify OTP
      </Button>
    </div>
  )
}
