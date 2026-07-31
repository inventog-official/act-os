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
import { createKnowledgeArticle } from '@/lib/actions/documents'

interface KnowledgeArticleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void>
}

const categories = ['Company', 'Sales', 'Operations', 'Finance', 'HR', 'Projects', 'Customer Support', 'Engineering', 'Policies', 'General']

const defaultForm = {
  title: '',
  summary: '',
  contentText: '',
  category: 'General',
  status: 'draft',
  tags: '',
}

export function KnowledgeArticleDialog({ open, onOpenChange, onSave }: KnowledgeArticleDialogProps) {
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(defaultForm)
      setError('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.title || !currentOrganization?.id) return
    setSubmitting(true)
    setError('')
    try {
      await createKnowledgeArticle(currentOrganization.id, {
        title: form.title,
        summary: form.summary || null,
        content_text: form.contentText,
        content: { title: form.title, body: form.contentText },
        category: form.category as any,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 30),
        status: form.status as any,
      } as any)
      await onSave()
    } catch (e: any) {
      setError(e.message || 'Failed to create article')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Knowledge Article</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. How to request PTO" />
          </div>
          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} placeholder="Short summary of the article" />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea value={form.contentText} onChange={(e) => setForm({ ...form, contentText: e.target.value })} rows={4} placeholder="Full article content" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags (comma separated)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="sales, onboarding, it" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.title}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}