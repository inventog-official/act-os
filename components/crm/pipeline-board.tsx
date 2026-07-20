'use client'

import { useState, useMemo } from 'react'
import { Plus, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatCurrency, getInitials, formatDate } from '@/lib/utils'
import type { CrmDeal, CrmPipelineStage } from '@/lib/types/database'

interface PipelineBoardProps {
  stages: CrmPipelineStage[]
  deals: CrmDeal[]
  onDealClick?: (deal: CrmDeal) => void
  onStageClick?: (stage: CrmPipelineStage) => void
  onMoveDeal?: (dealId: string, stageId: string) => void
}

function SortableDealCard({ deal, onClick }: { deal: CrmDeal; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'deal', deal },
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
            <p className="text-sm font-medium leading-tight">{deal.name}</p>
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-zinc-300 mt-0.5" />
          </div>
          <p className="mt-2 text-lg font-semibold">{formatCurrency(deal.deal_value)}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-50 transition-all"
                style={{ width: `${deal.probability}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500">{deal.probability}%</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {deal.assigned_to ? (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {deal.assigned_to.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div />
            )}
            {deal.expected_close_date && (
              <span className="text-xs text-zinc-400">{formatDate(deal.expected_close_date)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StageColumn({
  stage,
  deals,
  onDealClick,
  onStageClick,
  isOver,
}: {
  stage: CrmPipelineStage
  deals: CrmDeal[]
  onDealClick?: (deal: CrmDeal) => void
  onStageClick?: (stage: CrmPipelineStage) => void
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: stage.id, data: { type: 'stage', stage } })
  const totalValue = deals.reduce((sum, d) => sum + Number(d.deal_value), 0)

  return (
    <div ref={setNodeRef} className={cn('flex w-72 shrink-0 flex-col rounded-xl bg-zinc-50 dark:bg-zinc-900/50', isOver && 'ring-2 ring-zinc-400 dark:ring-zinc-500')}>
      <div className="flex items-center justify-between rounded-t-xl border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-semibold">{stage.name}</span>
          <Badge variant="secondary" className="text-[10px] ml-1">{deals.length}</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStageClick?.(stage)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Stage
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Stage
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {deals.map(deal => (
            <SortableDealCard key={deal.id} deal={deal} onClick={() => onDealClick?.(deal)} />
          ))}
          <Button variant="ghost" className="w-full justify-start text-zinc-400" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Deal
          </Button>
        </div>
      </ScrollArea>

      <div className="rounded-b-xl border-t border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <p className="text-xs text-zinc-500">{formatCurrency(totalValue)} total value</p>
      </div>
    </div>
  )
}

export function PipelineBoard({ stages, deals, onDealClick, onStageClick, onMoveDeal }: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overStageId, setOverStageId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const sortedStages = useMemo(() =>
    [...stages].sort((a, b) => a.order_index - b.order_index),
    [stages]
  )

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: any) {
    const overId = event.over?.id as string | undefined
    if (!overId) { setOverStageId(null); return }
    const overStage = stages.find(s => s.id === overId)
    setOverStageId(overStage?.id || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverStageId(null)

    if (!over) return
    const overId = over.id as string
    const overStage = stages.find(s => s.id === overId)
    if (overStage) {
      onMoveDeal?.(active.id as string, overStage.id)
      return
    }
    const overDeal = deals.find(d => d.id === overId)
    if (overDeal) {
      onMoveDeal?.(active.id as string, overDeal.pipeline_stage_id)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-16rem)]">
        {sortedStages.map(stage => {
          const stageDeals = deals.filter(d => d.pipeline_stage_id === stage.id)
          return (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={stageDeals}
              onDealClick={onDealClick}
              onStageClick={onStageClick}
              isOver={overStageId === stage.id}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <Card className="w-72 shadow-xl rotate-3">
            <CardContent className="p-3">
              <p className="text-sm font-medium">{activeDeal.name}</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(activeDeal.deal_value)}</p>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
