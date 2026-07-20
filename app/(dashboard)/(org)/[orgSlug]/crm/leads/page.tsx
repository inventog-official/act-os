'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, Download, Trash2, Search, ArrowUpDown, MoreHorizontal, FileSpreadsheet, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { LeadTable } from '@/components/crm/lead-table'
import { LeadForm } from '@/components/crm/lead-form'
import { LeadDetailDialog } from '@/components/crm/lead-detail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { exportToCsv, parseCsv } from '@/lib/utils/csv'
import type { CrmLead } from '@/lib/types/database'

export default function LeadsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useOrganizationStore()

  const [leads, setLeads] = useState<CrmLead[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null)
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    if (!currentOrganization) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('crm_leads')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setLeads((data || []) as CrmLead[])
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, statusFilter, supabase])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleCreateLead = async (data: any) => {
    if (!currentOrganization) return
    try {
      const { error } = await supabase.from('crm_leads').insert({
        ...data,
        organization_id: currentOrganization.id,
        workspace_id: null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
        status: data.status || 'new',
      })
      if (error) throw error
      toast.success('Lead created')
      setShowAddDialog(false)
      fetchLeads()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleUpdateLead = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({ ...data, updated_by: (await supabase.auth.getUser()).data.user?.id })
        .eq('id', id)
      if (error) throw error
      toast.success('Lead updated')
      setEditingLead(null)
      fetchLeads()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      toast.success('Lead deleted')
      setDeletingLeadId(null)
      setShowDeleteConfirm(false)
      fetchLeads()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', Array.from(selectedIds))
      if (error) throw error
      toast.success(`${selectedIds.size} leads deleted`)
      setSelectedIds(new Set())
      fetchLeads()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleExport = () => {
    exportToCsv(leads, 'leads-export', [
      { key: 'first_name', header: 'First Name' },
      { key: 'last_name', header: 'Last Name' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'company_name', header: 'Company' },
      { key: 'job_title', header: 'Job Title' },
      { key: 'status', header: 'Status' },
      { key: 'priority', header: 'Priority' },
      { key: 'lead_source', header: 'Source' },
      { key: 'estimated_deal_value', header: 'Deal Value' },
    ])
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentOrganization) return
    const text = await file.text()
    const rows = parseCsv(text)
    const user = (await supabase.auth.getUser()).data.user

    for (const row of rows) {
      const { error } = await supabase.from('crm_leads').insert({
        first_name: row['First Name'] || row['first_name'] || '',
        last_name: row['Last Name'] || row['last_name'] || '',
        email: row['Email'] || row['email'] || null,
        phone: row['Phone'] || row['phone'] || null,
        company_name: row['Company'] || row['company_name'] || null,
        job_title: row['Job Title'] || row['job_title'] || null,
        status: row['Status'] || row['status'] || 'new',
        priority: row['Priority'] || row['priority'] || 'medium',
        lead_source: row['Source'] || row['lead_source'] || null,
        estimated_deal_value: row['Deal Value'] || row['estimated_deal_value'] ? Number(row['Deal Value'] || row['estimated_deal_value']) : null,
        organization_id: currentOrganization.id,
        workspace_id: null,
        created_by: user?.id,
        updated_by: user?.id,
      })
      if (error) console.error('Import row error:', error)
    }
    toast.success('Import complete')
    fetchLeads()
    e.target.value = ''
  }

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      lead.first_name.toLowerCase().includes(q) ||
      lead.last_name.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.company_name?.toLowerCase().includes(q)
    )
  })

  if (isLoading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <CrmShell orgSlug={orgSlug}>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        </CrmShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Leads</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage and track your sales leads</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <span className="text-sm text-zinc-500">{selectedIds.size} selected</span>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="h-4 w-4 mr-1" />Import</span>
                </Button>
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
              </label>
              <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />Add Lead
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <LeadTable
            leads={filteredLeads}
            onEdit={(lead) => setEditingLead(lead)}
            onDelete={(id) => { setDeletingLeadId(id); setShowDeleteConfirm(true) }}
            onRowClick={(lead) => setSelectedLead(lead)}
          />

          <LeadDetailDialog
            lead={selectedLead}
            open={!!selectedLead}
            onOpenChange={(open) => { if (!open) setSelectedLead(null) }}
          />

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Lead</DialogTitle>
                <DialogDescription>Create a new sales lead</DialogDescription>
              </DialogHeader>
              <LeadForm
                onSubmit={handleCreateLead}
                onCancel={() => setShowAddDialog(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingLead} onOpenChange={(open) => { if (!open) setEditingLead(null) }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
                <DialogDescription>Update lead information</DialogDescription>
              </DialogHeader>
              {editingLead && (
                <LeadForm
                  defaultValues={editingLead as any}
                  onSubmit={(data) => handleUpdateLead(editingLead.id, data)}
                  onCancel={() => setEditingLead(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Delete Lead</DialogTitle>
                <DialogDescription>Are you sure? This action can be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => deletingLeadId && handleDeleteLead(deletingLeadId)}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CrmShell>
    </DashboardShell>
  )
}
