'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useOrganizationStore } from '@/lib/store'
import { createProject } from '@/lib/actions/projects'
import { toast } from 'sonner'
import { projectSchema } from '@/lib/utils/validations'
import type { CrmDeal } from '@/lib/types/database'

interface CreateProjectFromDealProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal: CrmDeal
  companyName?: string
  orgSlug: string
}

export function CreateProjectFromDeal({ open, onOpenChange, deal, companyName, orgSlug }: CreateProjectFromDealProps) {
  const router = useRouter()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: deal.name || '',
    description: '',
    status: 'planning',
    priority: 'medium',
    budget: String(deal.deal_value || ''),
    start_date: '',
    end_date: '',
  })

  const handleCreate = async () => {
    const parsed = projectSchema.safeParse({
      name: formData.name,
      description: formData.description || null,
      status: formData.status,
      priority: formData.priority,
      budget: formData.budget ? Number(formData.budget) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      client_name: companyName || null,
      company_id: deal.company_id,
      deal_id: deal.id,
    })

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as string
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    if (!currentOrganization) {
      toast.error('No organization selected')
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const project = await createProject({
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status,
        priority: parsed.data.priority,
        budget: parsed.data.budget,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        client_name: parsed.data.client_name,
        company_id: parsed.data.company_id,
        deal_id: parsed.data.deal_id,
        organization_id: currentOrganization.id,
      })

      toast.success('Project created successfully')
      onOpenChange(false)
      router.push(`/${orgSlug}/projects/${project.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Create Project from Deal
          </DialogTitle>
          <DialogDescription>
            {companyName ? `For ${companyName}` : 'Convert this deal into a project'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            label="Project Name *"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            error={errors.name}
            placeholder="Enter project name"
          />
          <div>
            <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Description</label>
            <textarea
              className="w-full min-h-[60px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Project description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Status</label>
              <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Priority</label>
              <Select value={formData.priority} onValueChange={v => setFormData(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input
            label="Budget"
            type="number"
            value={formData.budget}
            onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))}
            error={errors.budget}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
