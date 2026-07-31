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
import { createPolicy } from '@/lib/actions/documents'

interface PolicyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void>
}

const typeLabels = [
  { value: 'company', label: 'Company' },
  { value: 'hr', label: 'HR' },
  { value: 'finance', label: 'Finance' },
  { value: 'security', label: 'Security' },
  { value: 'it', label: 'IT' },
  { value: 'department', label: 'Department' },
]

const defaultForm = {
  title: '',
  policyType: 'company',
  summary: '',
  contentText: '',
  approvalStatus: 'draft',
  effectiveDate: '',
}

export function PolicyDialog({ open, onOpenChange, onSave }: PolicyDialogProps) {
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) setForm(defaultForm)
  }, [open])

  const handleSubmit = async () => {
    if (!form.title || !currentOrganization?.id) return
    setSubmitting(true)
    setError('')
    try {
      await createPolicy(currentOrganization.id, {
        title: form.title,
        policy_type: form.policyType as any,
        summary: form.summary || null,
        content_text: form.contentText,
        content: { title: form.title, body: form.contentText },
        approval_status: form.approvalStatus as any,
        effective_date: form.effectiveDate || null,
      } as any)
      await onSave()
    } catch (e: any) {
      setError(e.message || 'Failed to create policy')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Code of Conduct" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.policyType} onValueChange={(v) => setForm({ ...form, policyType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {typeLabels.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} placeholder="Short description of the policy" />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea value={form.contentText} onChange={(e) => setForm({ ...form, contentText: e.target.value })} rows={4} placeholder="Full policy text" />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Effective date</Label>
              <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.title}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}