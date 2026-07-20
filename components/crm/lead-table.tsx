'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Copy, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DataTable } from '@/components/ui/data-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getInitials, formatCurrency, formatDate } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'
import type { CrmLead } from '@/lib/types/database'

interface LeadTableProps {
  leads: CrmLead[]
  onEdit?: (lead: CrmLead) => void
  onDelete?: (id: string) => void
  onRowClick?: (lead: CrmLead) => void
  isLoading?: boolean
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  qualified: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  proposal: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
  negotiation: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
  won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  lost: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  disqualified: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
}

const priorityColors: Record<string, string> = {
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800',
  medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950',
  high: 'bg-amber-50 text-amber-600 dark:bg-amber-950',
  urgent: 'bg-red-50 text-red-600 dark:bg-red-950',
}

export function LeadTable({ leads, onEdit, onDelete, onRowClick }: LeadTableProps) {
  const columns: ColumnDef<CrmLead>[] = [
    {
      accessorKey: 'first_name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(`${row.original.first_name} ${row.original.last_name}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.first_name} {row.original.last_name}</p>
            <p className="text-xs text-zinc-500">{row.original.company_name || row.original.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          {row.original.email && (
            <p className="text-sm flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-zinc-400" />
              {row.original.email}
            </p>
          )}
          {row.original.phone && (
            <p className="text-sm text-zinc-500 flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-zinc-400" />
              {row.original.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.original.status] || ''}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const p = row.original.priority
        if (!p) return <span className="text-sm text-zinc-400">—</span>
        return (
          <Badge variant="outline" className={priorityColors[p] || ''}>
            {p}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'estimated_deal_value',
      header: 'Value',
      cell: ({ row }) => {
        const v = row.original.estimated_deal_value
        return <span className="text-sm font-medium">{v ? formatCurrency(v) : '—'}</span>
      },
    },
    {
      accessorKey: 'expected_close_date',
      header: 'Close Date',
      cell: ({ row }) => {
        const d = row.original.expected_close_date
        return <span className="text-sm text-zinc-500">{d ? formatDate(d) : '—'}</span>
      },
    },
    {
      accessorKey: 'assigned_to',
      header: 'Assigned',
      cell: ({ row }) => {
        const a = row.original.assigned_to
        return a ? (
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{a.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-sm text-zinc-400">—</span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(row.original)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={() => onDelete?.(row.original.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return <DataTable columns={columns} data={leads} searchKey="first_name" onRowClick={onRowClick} />
}
