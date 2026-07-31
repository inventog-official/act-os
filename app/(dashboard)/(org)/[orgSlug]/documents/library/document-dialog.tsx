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
import { createDocument } from '@/lib/actions/documents'

interface DocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void>
  folders: any[]
  initialFolderId?: string | null
}

const types = [
  { value: 'document', label: 'Document' },
  { value: 'sop', label: 'SOP' },
  { value: 'policy', label: 'Policy' },
  { value: 'contract', label: 'Contract' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'project_document', label: 'Project Document' },
  { value: 'hr_document', label: 'HR Document' },
  { value: 'training', label: 'Training' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'knowledge_article', label: 'Knowledge Article' },
  { value: 'internal', label: 'Internal' },
  { value: 'technical', label: 'Technical' },
]

const defaultForm = {
  title: '',
  description: '',
  documentType: 'document',
  status: 'draft',
  folderId: '',
}

export function DocumentDialog({ open, onOpenChange, onSave, folders, initialFolderId }: DocumentDialogProps) {
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, folderId: initialFolderId ?? '' })
      setError('')
    }
  }, [open, initialFolderId])

  const handleSubmit = async () => {
    if (!form.title || !currentOrganization?.id) return
    setSubmitting(true)
    setError('')
    try {
      await createDocument(currentOrganization.id, {
        title: form.title,
        description: form.description || null,
        document_type: form.documentType as any,
        status: form.status as any,
        folder_id: form.folderId || null,
        content_text: '',
        content: { title: form.title, type: form.documentType },
      } as any)
      await onSave()
    } catch (e: any) {
      setError(e.message || 'Failed to create document')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Quarterly Sales Review" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional short description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.documentType} onValueChange={(v) => setForm({ ...form, documentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="approval">Awaiting Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Folder</Label>
            <Select value={form.folderId} onValueChange={(v) => setForm({ ...form, folderId: v })}>
              <SelectTrigger><SelectValue placeholder="No folder" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No folder</SelectItem>
                {folders.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.title}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}