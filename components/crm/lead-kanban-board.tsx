'use client'

import { useState } from 'react'
import { GripVertical, MoreHorizontal, Pencil, Trash2, Phone, Mail } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import type { CrmLead } from '@/lib/types/database'

const statuses = [
  { key: 'new', label: 'New', color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-amber-500' },
  { key: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { key: 'proposal', label: 'Proposal', color: 'bg-indigo-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-pink-500' },
  { key: 'won', label: 'Won', color: 'bg-emerald-500' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500' },
]

const priorityColors: Record<string, string> = {
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800',
  medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950',
  high: 'bg-amber-50 text-amber-600 dark:bg-amber-950',
  urgent: 'bg-red-50 text-red-600 dark:bg-red-950',
}

function DroppableColumn({ status, leads, onLeadClick }: {
  status: typeof statuses[0]
  leads: CrmLead[]
  onLeadClick?: (lead: CrmLead) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.key })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50',
        isOver && 'border-zinc-400 dark:border-zinc-600'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
          <span className="text-sm font-semibold">{status.label}</span>
          <span className="text-xs text-zinc-400">({leads.length})</span>
        </div>
      </div>
      <ScrollArea className="flex-1 px-2 pb-2">
        <div className="space-y-2 pt-1">
          {leads.map(lead => (
            <SortableLeadCard key={lead.id} lead={lead} onClick={() => onLeadClick?.(lead)} />
          ))}
          {leads.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-400">No leads</div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function SortableLeadCard({ lead, onClick }: { lead: CrmLead; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'lead', lead },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn('cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow', isDragging && 'opacity-50')}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">{getInitials(`${lead.first_name} ${lead.last_name}`)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{lead.first_name} {lead.last_name}</p>
                {lead.company_name && (
                  <p className="text-xs text-zinc-500 truncate">{lead.company_name}</p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="-mr-2 -mt-1" onClick={e => e.stopPropagation()}>
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onClick?.() }}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {lead.priority && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[lead.priority] || ''}`}>
                {lead.priority}
              </Badge>
            )}
            {lead.estimated_deal_value && (
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {formatCurrency(Number(lead.estimated_deal_value))}
              </span>
            )}
          </div>

          {(lead.email || lead.phone) && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-400">
              {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
              {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function LeadKanbanBoard({
  leads,
  onLeadClick,
  onMoveLead,
}: {
  leads: CrmLead[]
  onLeadClick?: (lead: CrmLead) => void
  onMoveLead?: (leadId: string, status: string) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const leadsByStatus = Object.fromEntries(
    statuses.map(s => [s.key, leads.filter(l => l.status === s.key)])
  )

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const lead = leads.find(l => l.id === active.id)
    if (lead && lead.status !== over.id) {
      onMoveLead?.(lead.id, over.id as string)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map(status => (
          <DroppableColumn
            key={status.key}
            status={status}
            leads={leadsByStatus[status.key] || []}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeId && (
          <Card className="w-72 opacity-90">
            <CardContent className="p-3">
              <p className="text-sm font-medium">Moving...</p>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  )
}
