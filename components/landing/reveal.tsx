'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  variant?: 'up' | 'fade' | 'left' | 'right' | 'zoom'
  as?: 'div' | 'section' | 'li' | 'span' | 'p'
}

const hiddenStyles: Record<NonNullable<RevealProps['variant']>, string> = {
  up: 'opacity-0 translate-y-8',
  fade: 'opacity-0',
  left: 'opacity-0 -translate-x-8',
  right: 'opacity-0 translate-x-8',
  zoom: 'opacity-0 scale-95',
}

export function Reveal({ children, className, delay = 0, variant = 'up', as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Tag = as as 'div'

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'transition-all duration-700 ease-out will-change-transform',
        !visible && hiddenStyles[variant],
        visible && 'translate-x-0 translate-y-0 scale-100 opacity-100',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}