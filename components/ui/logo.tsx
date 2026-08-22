'use client'

import React from 'react'
import { IoLogoStencil } from 'react-icons/io5'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  iconClassName?: string
  textClassName?: string
}

export function Logo({
  size = 'md',
  showText = true,
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  const sizeMap = {
    xs: { box: 'w-5 h-5 rounded-[6px]', icon: 'w-3 h-3', text: 'text-xs' },
    sm: { box: 'w-7 h-7 rounded-[8px]', icon: 'w-4 h-4', text: 'text-sm' },
    md: { box: 'w-9 h-9 rounded-[10px]', icon: 'w-5 h-5', text: 'text-base' },
    lg: { box: 'w-11 h-11 rounded-[13px]', icon: 'w-6 h-6', text: 'text-lg' },
    xl: { box: 'w-14 h-14 rounded-[16px]', icon: 'w-8 h-8', text: 'text-xl' },
  }

  const s = sizeMap[size]

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      {/* Apple Squircle Emblem with Specular Gloss & Stencil Icon */}
      <div
        className={cn(
          'relative flex items-center justify-center bg-gradient-to-b from-neutral-900 to-black dark:from-white dark:to-neutral-200 text-white dark:text-black shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-white/20 dark:border-black/10 overflow-hidden shrink-0',
          s.box,
          iconClassName
        )}
      >
        {/* Specular Apple Glass Gloss overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />
        <IoLogoStencil className={cn('relative z-10 transition-transform duration-200', s.icon)} />
      </div>

      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight text-neutral-900 dark:text-white font-sans',
            s.text,
            textClassName
          )}
        >
          ACT OS
        </span>
      )}
    </div>
  )
}

export { IoLogoStencil }
