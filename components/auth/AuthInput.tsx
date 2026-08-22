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
      <div className="space-y-1.5 text-left font-sans">
        <label
          htmlFor={inputId}
          className="block text-[11px] font-medium tracking-tight text-neutral-400"
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
              'w-full h-11 px-3.5 rounded-xl bg-white/[0.06] border text-white text-xs sm:text-sm placeholder:text-neutral-500 outline-none transition-all duration-150',
              Icon && 'pl-9.5',
              error
                ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-white/[0.1] hover:border-white/20 focus:border-[#007AFF] focus:bg-white/[0.09] focus:ring-3 focus:ring-[#007AFF]/25',
              isPassword && 'pr-10',
              className
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors p-1"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-red-400 font-normal mt-1 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'
