'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  isLoading?: boolean
}

export function AuthButton({
  children,
  variant = 'primary',
  isLoading = false,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  const isPrimary = variant === 'primary'

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'w-full h-[52px] rounded-[11px] font-mono text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed',
        isPrimary &&
          'bg-white text-black hover:bg-neutral-200 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] shadow-md',
        variant === 'outline' &&
          'bg-[#0A0A0A] border border-white/[0.12] text-white hover:border-white/30 hover:bg-white/[0.04]',
        variant === 'secondary' &&
          'bg-white/[0.08] text-white border border-white/10 hover:bg-white/[0.12]',
        variant === 'ghost' &&
          'bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.04]',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-black/40 border-t-black animate-spin" />
          <span>AUTHENTICATING...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
