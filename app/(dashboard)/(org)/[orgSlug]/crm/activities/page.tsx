'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Search, Phone, Mail, Video, CheckSquare, FileText, MessageSquare, MessageCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { ActivityFeed } from '@/components/crm/activity-feed'
import { SearchBar } from '@/components/crm/search-bar'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { CrmActivity } from '@/lib/types/database'

const activityTypes = [
  { value: 'call', label: 'Call', icon: Phone, color: 'text-green-500' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-blue-500' },
  { value: 'meeting', label: 'Meeting', icon: Video, color: 'text-purple-500' },
  { value: 'task', label: 'Task', icon: CheckSquare, color: 'text-amber-500' },
  { value: 'note', label: 'Note', icon: FileText, color: 'text-zinc-500' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-emerald-500' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600' },
]

export default function ActivitiesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState({ type: 'call', subject: '', description: '', activity_date: new Date().toISOString().split('T')[0] })

  const fetchActivities = useCallback(async () => {
    if (!currentOrganization) return
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('activity_date', { ascending: false })
        .limit(50)

      if (typeFilter !== 'all') query = query.eq('type', typeFilter)

      const { data } = await query
      setActivities((data || []) as CrmActivity[])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase, typeFilter])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const handleCreate = async () => {
    if (!currentOrganization || !formData.subject) return
    try {
      const { error } = await supabase.from('crm_activities').insert({
        type: formData.type,
        subject: formData.subject,
        description: formData.description,
        activity_date: formData.activity_date || new Date().toISOString().split('T')[0],
        organization_id: currentOrganization.id,
        workspace_id: null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (error) throw error
      toast.success('Activity logged')
      setShowAddDialog(false)
      setFormData({ type: 'call', subject: '', description: '', activity_date: new Date().toISOString().split('T')[0] })
      fetchActivities()
    } catch (err: any) { toast.error(err.message) }
  }

  const filtered = activities.filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.subject.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)
  })

  if (isLoading) return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
      </CrmShell>
    </DashboardShell>
  )

  return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Activities</h1>
              <p className="text-sm text-zinc-500 mt-1">Log and track all interactions</p>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />Log Activity
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
            <div className="flex gap-1">
              {activityTypes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(typeFilter === t.value ? 'all' : t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === t.value
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <t.icon className={`h-3.5 w-3.5 ${t.color}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <ActivityFeed activities={filtered as any} />
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-zinc-400">No activities found</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />Log your first activity
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Log Activity</DialogTitle>
              <DialogDescription>Record a new interaction</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <div className="grid grid-cols-7 gap-2">
                  {activityTypes.map(t => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.value}
                        onClick={() => setFormData(p => ({ ...p, type: t.value }))}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-colors ${
                          formData.type === t.value
                            ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900'
                            : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${t.color}`} />
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Input label="Subject *" value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} />
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full min-h-[80px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="Add details..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <DatePicker value={formData.activity_date} onChange={d => setFormData(p => ({ ...p, activity_date: d }))} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Log Activity</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </CrmShell>
    </DashboardShell>
  )
}
