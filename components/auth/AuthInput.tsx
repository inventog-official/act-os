'use client'

import React, { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  isPassword?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, isPassword, icon: Icon, type = 'text', className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="space-y-1.5 text-left">
        <label
          htmlFor={inputId}
          className="block text-xs font-mono uppercase tracking-wider text-neutral-400"
        >
          {label}
        </label>

        <div className="relative">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
              <Icon className="h-4 w-4" />
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={computedType}
            className={cn(
              'w-full h-[52px] px-4 rounded-[11px] bg-[#0A0A0A] border text-white text-sm placeholder:text-neutral-600 outline-none transition-all duration-200',
              Icon && 'pl-10',
              error
                ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                : 'border-white/[0.12] hover:border-white/20 focus:border-white focus:shadow-[0_0_12px_rgba(255,255,255,0.15)]',
              isPassword && 'pr-12',
              className
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors p-1"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 font-light mt-1 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'
