import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 border border-transparent',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 shadow-sm border border-transparent',
        outline:
          'border border-neutral-300/80 bg-white/70 hover:bg-neutral-100/90 text-neutral-900 dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white shadow-xs backdrop-blur-xs',
        secondary:
          'bg-neutral-200/70 text-neutral-900 hover:bg-neutral-200 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14] border border-black/[0.03] dark:border-white/[0.05]',
        ghost:
          'hover:bg-black/[0.05] hover:text-neutral-950 dark:hover:bg-white/[0.08] dark:hover:text-white text-neutral-700 dark:text-neutral-300',
        link: 'text-neutral-900 underline-offset-4 hover:underline dark:text-white',
      },
      size: {
        default: 'h-9 px-4 py-2 text-xs sm:text-sm',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-2xl px-6 text-base font-semibold',
        xl: 'h-12 rounded-2xl px-8 text-base font-semibold',
        icon: 'h-9 w-9 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
