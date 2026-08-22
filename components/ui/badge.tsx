import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-neutral-900 text-white dark:bg-white dark:text-neutral-950',
        secondary:
          'border-transparent bg-neutral-100 text-neutral-800 dark:bg-white/[0.1] dark:text-white',
        destructive:
          'border-transparent bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-200/50 dark:border-red-500/20',
        outline:
          'border-neutral-200 dark:border-white/15 text-neutral-700 dark:text-neutral-300',
        success:
          'border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300',
        warning:
          'border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300',
        info:
          'border-blue-200/60 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
