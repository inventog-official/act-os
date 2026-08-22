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
        'w-full h-11 rounded-xl font-sans text-xs sm:text-sm font-medium tracking-tight flex items-center justify-center gap-2 transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
        isPrimary &&
          'bg-[#007AFF] text-white hover:bg-[#0071E3] active:scale-[0.98] shadow-[0_4px_14px_rgba(0,122,255,0.35)]',
        variant === 'outline' &&
          'bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.1] hover:border-white/20 active:scale-[0.98]',
        variant === 'secondary' &&
          'bg-white/[0.1] text-white hover:bg-white/[0.15] border border-white/[0.12] active:scale-[0.98]',
        variant === 'ghost' &&
          'bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06] active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          <span>Authenticating...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
