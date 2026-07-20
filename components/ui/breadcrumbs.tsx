'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav className={cn('flex items-center gap-1 text-sm text-zinc-500', className)} aria-label="Breadcrumb">
      <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-300">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />
          {item.href ? (
            <Link href={item.href} className="hover:text-zinc-700 dark:hover:text-zinc-300">
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
