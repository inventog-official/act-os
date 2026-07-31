'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { CrmTag } from '@/lib/types/database'

const presetColors = [
  '#6b7280', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6',
]

interface TagBadgeProps {
  tag: CrmTag
  onRemove?: () => void
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs"
      style={{
        backgroundColor: tag.color + '20',
        borderColor: tag.color + '40',
        color: tag.color,
      }}
    >
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70">
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}

interface TagSelectorProps {
  tags: CrmTag[]
  selectedTags: CrmTag[]
  onToggle: (tag: CrmTag) => void
  onCreateTag?: (name: string, color: string) => void
}

export function TagSelector({ tags, selectedTags, onToggle, onCreateTag }: TagSelectorProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(presetColors[0])
  const selectedIds = new Set(selectedTags.map(t => t.id))

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreateTag?.(newName.trim(), newColor)
    setNewName('')
    setNewColor(presetColors[0])
    setShowCreate(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              selectedIds.has(tag.id)
                ? 'ring-2 ring-offset-1'
                : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: tag.color + '20',
              borderColor: tag.color + '40',
              color: tag.color,
            }}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {onCreateTag && (
        <>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3 w-3 mr-1" /> New Tag
          </Button>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Create Tag</DialogTitle>
                <DialogDescription>Add a new tag for your organization.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Input
                  label="Name"
                  placeholder="e.g. Hot lead"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {presetColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        className={`h-7 w-7 rounded-full transition-all ${
                          newColor === color ? 'ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
