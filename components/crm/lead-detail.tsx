'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Timeline } from '@/components/crm/timeline'
import { ActivityFeed } from '@/components/crm/activity-feed'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, formatCurrency, getInitials, formatRelativeTime } from '@/lib/utils'
import { Phone, Mail, Globe, Building2, Target, Calendar, Plus, Pin, Lock, Sparkles, FolderKanban } from 'lucide-react'
import { NoteEditor } from '@/components/crm/note-editor'
import { AiLeadInsights } from '@/components/crm/ai-insights'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { useAuthStore } from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'
import { addMockData } from '@/lib/auth/mock-data'
import type { CrmLead, CrmTimeline, CrmActivity, CrmNote } from '@/lib/types/database'

export function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: CrmLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const supabase = createClient()
  const { user } = useAuthStore()
  const [timeline, setTimeline] = useState<CrmTimeline[]>([])
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [notes, setNotes] = useState<CrmNote[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)

  async function fetchData(lead: CrmLead) {
    const orgId = lead.organization_id

    if (!isSupabaseConfigured()) {
      const { getMockData: mock } = await import('@/lib/auth/mock-data')
      setTimeline([])
      setActivities((mock('crm_activities') as CrmActivity[]).filter(a => a.lead_id === lead.id))
      setNotes([])
      return
    }

    const [tRes, aRes, nRes] = await Promise.all([
      supabase.from('crm_timeline').select('*').eq('organization_id', orgId).eq('lead_id', lead.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('crm_activities').select('*').eq('organization_id', orgId).eq('lead_id', lead.id).order('activity_date', { ascending: false }).limit(20),
      supabase.from('crm_notes').select('*').eq('organization_id', orgId).eq('lead_id', lead.id).is('deleted_at', null).order('created_at', { ascending: false }),
    ])
    setTimeline((tRes.data || []) as CrmTimeline[])
    setActivities((aRes.data || []) as CrmActivity[])
    setNotes((nRes.data || []) as CrmNote[])
  }

  useEffect(() => {
    if (lead) {
      setShowEditor(false)
      fetchData(lead)
    }
  }, [lead])

  const handleAddNote = async (data: { title: string; content: string; is_pinned: boolean; is_private: boolean }) => {
    if (!lead || !user) return

    if (!isSupabaseConfigured()) {
      const newNote = addMockData('crm_notes', {
        ...data,
        lead_id: lead.id,
        organization_id: lead.organization_id,
        workspace_id: null,
        created_by: user.id,
        updated_by: user.id,
      })
      setNotes(prev => [newNote, ...prev] as CrmNote[])
      setShowEditor(false)
      return
    }

    const { error } = await supabase.from('crm_notes').insert({
      ...data,
      lead_id: lead.id,
      organization_id: lead.organization_id,
      workspace_id: null,
      created_by: user.id,
      updated_by: user.id,
    })
    if (!error) {
      setShowEditor(false)
      fetchData(lead)
    }
  }

  if (!lead) return null

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500', contacted: 'bg-amber-500', qualified: 'bg-purple-500',
    proposal: 'bg-indigo-500', negotiation: 'bg-pink-500', won: 'bg-emerald-500', lost: 'bg-red-500',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{getInitials(`${lead.first_name} ${lead.last_name}`)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg">{lead.first_name} {lead.last_name}</p>
              <p className="text-sm font-normal text-zinc-500">{lead.job_title || 'No title'}</p>
            </div>
            <div className={`ml-auto h-2.5 w-2.5 rounded-full ${statusColors[lead.status] || 'bg-zinc-400'}`} title={lead.status} />
            <Button variant="outline" size="sm" className="ml-2" onClick={(e: React.MouseEvent) => { e.preventDefault(); setShowCreateProject(true) }}>
              <FolderKanban className="h-3.5 w-3.5 mr-1" /> Project
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {lead.email && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Mail className="h-4 w-4" /> {lead.email}
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Phone className="h-4 w-4" /> {lead.phone}
            </div>
          )}
          {lead.company_name && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Building2 className="h-4 w-4" /> {lead.company_name}
            </div>
          )}
          {lead.website && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Globe className="h-4 w-4" /> {lead.website}
            </div>
          )}
          {lead.estimated_deal_value && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Target className="h-4 w-4" /> {formatCurrency(Number(lead.estimated_deal_value))}
            </div>
          )}
          {lead.expected_close_date && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Calendar className="h-4 w-4" /> {formatDate(lead.expected_close_date)}
            </div>
          )}
        </div>

        <AiLeadInsights lead={lead} />

        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
            <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="max-h-[300px] overflow-y-auto">
            <Timeline entries={timeline} />
          </TabsContent>
          <TabsContent value="activities" className="max-h-[300px] overflow-y-auto">
            <ActivityFeed activities={activities as any} />
          </TabsContent>
          <TabsContent value="notes" className="max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {!showEditor && (
                <button
                  onClick={() => setShowEditor(true)}
                  className="w-full flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-400 hover:border-zinc-400 hover:text-zinc-500 transition-colors dark:border-zinc-700 dark:hover:border-zinc-600"
                >
                  <Plus className="h-4 w-4" />
                  Add a note...
                </button>
              )}

              {showEditor && (
                <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <NoteEditor
                    onSubmit={handleAddNote}
                    onCancel={() => setShowEditor(false)}
                  />
                </div>
              )}

              {notes.filter(n => !n.is_private || true).map(note => (
                <div key={note.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-1">
                    {note.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
                    {note.is_private && <Lock className="h-3 w-3 text-red-400" />}
                    {note.title && <p className="text-sm font-medium flex-1">{note.title}</p>}
                  </div>
                  {note.content && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{note.content}</p>
                  )}
                  <p className="text-xs text-zinc-400 mt-2">{formatRelativeTime(note.created_at)}</p>
                </div>
              ))}

              {notes.length === 0 && !showEditor && (
                <p className="text-sm text-zinc-400 py-4 text-center">No notes yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <CreateProjectDialog
          open={showCreateProject}
          onOpenChange={setShowCreateProject}
          defaults={{ name: `${lead.first_name} ${lead.last_name} - ${lead.company_name || ''}`.trim(), client_name: lead.company_name || `${lead.first_name} ${lead.last_name}`, lead_id: lead.id }}
        />
      </DialogContent>
    </Dialog>
  )
}
