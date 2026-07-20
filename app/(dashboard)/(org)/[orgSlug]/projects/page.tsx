'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FolderKanban, Search, LayoutGrid, List, Filter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { JSX } from 'react'

const statusConfig: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planning', color: 'bg-blue-500' },
  active: { label: 'Active', color: 'bg-emerald-500' },
  on_hold: { label: 'On Hold', color: 'bg-amber-500' },
  completed: { label: 'Completed', color: 'bg-zinc-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
}

export default function ProjectsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', priority: 'medium', status: 'planning', start_date: '', end_date: '' })

  const fetchProjects = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)

      const { data } = await query
      setProjects(data || [])
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }, [currentOrganization, statusFilter, supabase])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleCreate = async () => {
    if (!formData.name.trim() || !currentOrganization) return
    setSaving(true)
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)
      const { error } = await supabase.from('projects').insert({
        name: formData.name,
        slug,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        organization_id: currentOrganization.id,
        workspace_id: null,
        owner_id: (await supabase.auth.getUser()).data.user?.id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (error) throw error
      toast.success('Project created')
      setShowNew(false)
      setFormData({ name: '', description: '', priority: 'medium', status: 'planning', start_date: '', end_date: '' })
      fetchProjects()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const filtered = projects.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
  })

  return (
    <DashboardShell orgSlug={orgSlug}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="text-sm text-zinc-500 mt-1">{projects.length} total project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="mr-2 h-4 w-4" />New Project
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FolderKanban} title={searchQuery || statusFilter !== 'all' ? 'No projects found' : 'No projects yet'} description={searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first project to get started'} action={!searchQuery && statusFilter === 'all' ? <Button onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" />New Project</Button> : undefined} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(project => {
              const cfg = statusConfig[project.status] || statusConfig.planning
              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/${orgSlug}/projects/${project.id}`)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${cfg.color}`} />
                        <h3 className="font-semibold">{project.name}</h3>
                      </div>
                      <Badge variant={project.priority === 'urgent' ? 'destructive' : project.priority === 'high' ? 'warning' : 'secondary'} className="text-[10px]">{project.priority}</Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{project.description}</p>
                    )}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                          <span>{cfg.label}</span>
                          <span>{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-1.5" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">{cfg.label}</Badge>
                        {project.end_date && <span className="text-xs text-zinc-400">Due {formatDate(project.end_date)}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Start a new project for your workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input label="Project Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Enter project name" />
            <div>
              <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea className="flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Project description" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}


