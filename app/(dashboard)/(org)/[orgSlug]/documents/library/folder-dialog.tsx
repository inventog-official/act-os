'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useOrganizationStore } from '@/lib/store'
import { createFolder } from '@/lib/actions/documents'

interface FolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void>
  folders?: any[]
}

const colors = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899']

export function FolderDialog({ open, onOpenChange, onSave, folders = [] }: FolderDialogProps) {
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [form, setForm] = useState({ name: '', description: '', parentId: '', color: '#3b82f6' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) setForm({ name: '', description: '', parentId: '', color: '#3b82f6' })
  }, [open])

  const handleSubmit = async () => {
    if (!form.name || !currentOrganization?.id) return
    setSubmitting(true)
    setError('')
    try {
      await createFolder(currentOrganization.id, {
        name: form.name,
        description: form.description || null,
        parent_id: form.parentId || null,
        color: form.color,
      } as any)
      await onSave()
    } catch (e: any) {
      setError(e.message || 'Failed to create folder')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Financial Reports" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description" />
          </div>
          <div className="space-y-2">
            <Label>Parent folder</Label>
            <Select value={form.parentId} onValueChange={(v) => setForm({ ...form, parentId: v === '__none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="No parent (root)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No parent (root)</SelectItem>
                {folders.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${form.color === c ? 'scale-110 border-zinc-900 dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.name}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}