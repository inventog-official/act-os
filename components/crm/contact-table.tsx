'use client'

import { MoreHorizontal, Pencil, Trash2, Phone, Mail, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DataTable } from '@/components/ui/data-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'
import type { CrmContact } from '@/lib/types/database'

interface ContactTableProps {
  contacts: CrmContact[]
  onEdit?: (contact: CrmContact) => void
  onDelete?: (id: string) => void
  onRowClick?: (contact: CrmContact) => void
}

export function ContactTable({ contacts, onEdit, onDelete, onRowClick }: ContactTableProps) {
  const columns: ColumnDef<CrmContact>[] = [
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
            <p className="text-xs text-zinc-500">{row.original.job_title || '—'}</p>
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
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.department || '—'}</span>
      ),
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
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={() => onDelete?.(row.original.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return <DataTable columns={columns} data={contacts} searchKey="first_name" onRowClick={onRowClick} />
}
