'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

interface PaginationProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
}

const pageSizeOptions = [10, 20, 50, 100]

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pageCount)

  const pageNumbers: (number | 'ellipsis')[] = []
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(1)
    if (current > 3) pageNumbers.push('ellipsis')
    const start = Math.max(2, current - 1)
    const end = Math.min(pageCount - 1, current + 1)
    for (let i = start; i <= end; i++) pageNumbers.push(i)
    if (current < pageCount - 2) pageNumbers.push('ellipsis')
    pageNumbers.push(pageCount)
  }

  return (
    <div className={cn('flex items-center justify-between gap-4 pt-4', className)}>
      <div className="flex items-center gap-3">
        <p className="text-sm text-zinc-500">
          {total === 0 ? '0 results' : `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, total)} of ${total}`}
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v))
                onPageChange(1)
              }}
            >
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pageNumbers.map((num, idx) =>
          num === 'ellipsis' ? (
            <span key={`e-${idx}`} className="px-1 text-sm text-zinc-400">…</span>
          ) : (
            <Button
              key={num}
              variant={num === current ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(num)}
              className={cn('min-w-8', num === current && 'pointer-events-none')}
            >
              {num}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= pageCount}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
