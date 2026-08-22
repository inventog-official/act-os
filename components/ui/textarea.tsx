import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 font-sans transition-all duration-150',
            'focus-visible:outline-none focus-visible:border-neutral-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black/5',
            'dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-neutral-500 dark:focus-visible:border-white/30 dark:focus-visible:bg-black/50 dark:focus-visible:ring-white/15',
            'disabled:cursor-not-allowed disabled:opacity-40',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">{hint}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }