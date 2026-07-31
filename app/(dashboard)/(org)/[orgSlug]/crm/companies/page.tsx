'use client'

import { useState, use, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/lib/store'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { CompanyCard } from '@/components/crm/company-card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { CrmCompany } from '@/lib/types/database'

export default function CompaniesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const supabase = createClient()
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState({ name: '', industry: '', website: '', phone: '', email: '', city: '', state: '' })

  const fetchCompanies = useCallback(async () => {
    if (!currentOrganization) return
    try {
      const { data } = await supabase
        .from('crm_companies')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      setCompanies((data || []) as CrmCompany[])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization, supabase])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  const handleCreate = async () => {
    if (!currentOrganization || !formData.name) return
    try {
      const { error } = await supabase.from('crm_companies').insert({
        ...formData,
        organization_id: currentOrganization.id,
        workspace_id: null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (error) throw error
      toast.success('Company created')
      setShowAddDialog(false)
      setFormData({ name: '', industry: '', website: '', phone: '', email: '', city: '', state: '' })
      fetchCompanies()
    } catch (err: any) { toast.error(err.message) }
  }

  const filtered = companies.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
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
              <h1 className="text-2xl font-semibold">Companies</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage your client companies</p>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />Add Company
            </Button>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(company => (
                <Link key={company.id} href={`/${orgSlug}/crm/companies/${company.id}`}>
                  <CompanyCard
                    company={company}
                    onClick={() => {}}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-zinc-400">No companies yet</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />Add your first company
              </Button>
            </div>
          )}

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Add Company</DialogTitle>
                <DialogDescription>Enter company details below</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input label="Company Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Industry" value={formData.industry} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} />
                  <Input label="Website" value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Phone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                  <Input label="Email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
                  <Input label="State" value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CrmShell>
    </DashboardShell>
  )
}
