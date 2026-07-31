'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { ContactTable } from '@/components/crm/contact-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { CrmContact } from '@/lib/types/database'

export default function ContactsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', job_title: '', department: '' })

  const fetchContacts = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const { data } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      setContacts((data || []) as CrmContact[])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  const handleCreate = async () => {
    if (!currentOrganization || !formData.first_name || !formData.last_name) return
    try {
      const { error } = await supabase.from('crm_contacts').insert({
        ...formData,
        organization_id: currentOrganization.id,
        workspace_id: null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (error) throw error
      toast.success('Contact created')
      setShowAddDialog(false)
      setFormData({ first_name: '', last_name: '', email: '', phone: '', job_title: '', department: '' })
      fetchContacts()
    } catch (err: any) { toast.error(err.message) }
  }

  const filtered = contacts.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
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
              <h1 className="text-2xl font-semibold">Contacts</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage your contacts</p>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />Add Contact
            </Button>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          <ContactTable
            contacts={filtered}
            onEdit={(contact) => {}}
            onDelete={(id) => {}}
            onRowClick={(contact) => router.push(`/${orgSlug}/crm/contacts/${contact.id}`)}
          />
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
              <DialogDescription>Enter contact details below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name *" value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} />
                <Input label="Last Name *" value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                <Input label="Phone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Job Title" value={formData.job_title} onChange={e => setFormData(p => ({ ...p, job_title: e.target.value }))} />
                <Input label="Department" value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </CrmShell>
    </DashboardShell>
  )
}
