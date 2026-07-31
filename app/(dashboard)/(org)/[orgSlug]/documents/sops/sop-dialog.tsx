'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
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
import { createSop } from '@/lib/actions/documents'

interface SopDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void>
}

const defaultForm = {
  title: '',
  purpose: '',
  scope: '',
  approvalStatus: 'draft',
  steps: [] as string[],
  inputs: '',
  outputs: '',
}

export function SopDialog({ open, onOpenChange, onSave }: SopDialogProps) {
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) setForm(defaultForm)
  }, [open])

  const addStep = () => setForm({ ...form, steps: [...form.steps, ''] })
  const updateStep = (i: number, v: string) => {
    const steps = [...form.steps]
    steps[i] = v
    setForm({ ...form, steps })
  }
  const removeStep = (i: number) => setForm({ ...form, steps: form.steps.filter((_, idx) => idx !== i) })

  const handleSubmit = async () => {
    if (!form.title || !currentOrganization?.id) return
    setSubmitting(true)
    setError('')
    try {
      await createSop(currentOrganization.id, {
        title: form.title,
        purpose: form.purpose || null,
        scope: form.scope || null,
        approval_status: form.approvalStatus as any,
        steps: form.steps.filter(Boolean).map((s, i) => ({ title: s, description: '', order: i })),
        required_inputs: form.inputs.split('\n').map((s) => s.trim()).filter(Boolean),
        expected_outputs: form.outputs.split('\n').map((s) => s.trim()).filter(Boolean),
      } as any)
      await onSave()
    } catch (e: any) {
      setError(e.message || 'Failed to create SOP')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New SOP</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Invoice Processing" />
          </div>
          <div className="space-y-2">
            <Label>Purpose</Label>
            <Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={2} placeholder="Why this procedure exists" />
          </div>
          <div className="space-y-2">
            <Label>Scope</Label>
            <Input value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="Who this applies to" />
          </div>
          <div className="space-y-2">
            <Label>Steps</Label>
            <div className="space-y-2">
              {form.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium dark:bg-zinc-800">{i + 1}</span>
                  <Input value={s} onChange={(e) => updateStep(i, e.target.value)} placeholder={`Step ${i + 1}`} />
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeStep(i)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4 mr-2" /> Add step
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Required inputs (one per line)</Label>
            <Textarea value={form.inputs} onChange={(e) => setForm({ ...form, inputs: e.target.value })} rows={2} placeholder="Receipts&#10;Approval form" />
          </div>
          <div className="space-y-2">
            <Label>Expected outputs (one per line)</Label>
            <Textarea value={form.outputs} onChange={(e) => setForm({ ...form, outputs: e.target.value })} rows={2} placeholder="Payment confirmation&#10;Audit log entry" />
          </div>
          <div className="space-y-2">
            <Label>Approval status</Label>
            <Select value={form.approvalStatus} onValueChange={(v) => setForm({ ...form, approvalStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.title}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create SOP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}