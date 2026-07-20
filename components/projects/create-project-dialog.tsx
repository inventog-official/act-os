'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { toast } from 'sonner'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (projectId: string) => void
  defaults?: {
    name?: string
    client_name?: string
    company_id?: string
    deal_id?: string
    lead_id?: string
  }
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess, defaults }: CreateProjectDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: defaults?.name || '',
    description: '',
    priority: 'medium',
    status: 'planning',
    client_name: defaults?.client_name || '',
    company_id: defaults?.company_id || '',
    deal_id: defaults?.deal_id || '',
    lead_id: defaults?.lead_id || '',
    budget: '',
    start_date: '',
    end_date: '',
  })

  const handleCreate = async () => {
    if (!formData.name.trim() || !currentOrganization) return
    setSaving(true)
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)
      const user = (await supabase.auth.getUser()).data.user

      const { data, error } = await supabase.from('projects').insert({
        name: formData.name,
        slug,
        description: formData.description || null,
        status: formData.status || 'planning',
        priority: formData.priority || 'medium',
        client_name: formData.client_name || null,
        company_id: formData.company_id || null,
        deal_id: formData.deal_id || null,
        lead_id: formData.lead_id || null,
        budget: formData.budget ? Number(formData.budget) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        organization_id: currentOrganization.id,
        owner_id: user?.id,
        created_by: user?.id,
      }).select().single()

      if (error) throw error
      toast.success('Project created')
      onOpenChange(false)
      if (onSuccess) onSuccess(data.id)
      router.push(`/${currentOrganization.slug}/projects/${data.id}`)
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>{defaults?.client_name ? `From ${defaults.client_name}` : 'Start a new project'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input label="Project Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Enter project name" />
          <div>
            <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Description</label>
            <textarea className="w-full min-h-[60px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Project description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Client Name" value={formData.client_name} onChange={e => setFormData(p => ({ ...p, client_name: e.target.value }))} />
            <Input label="Budget" type="number" value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} />
            <Input label="End Date" type="date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !formData.name.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
