'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Users, DollarSign, Edit3, ExternalLink, Pencil, FolderKanban, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency, formatNumber, formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import type { CrmCompany, CrmContact, CrmDeal, CrmActivity } from '@/lib/types/database'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'

export default function CompanyDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [company, setCompany] = useState<CrmCompany | null>(null)
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', industry: '', website: '', phone: '', email: '', city: '', state: '' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [companyRes, contactsRes, dealsRes, activitiesRes] = await Promise.all([
          supabase.from('crm_companies').select('*').eq('id', id).single(),
          supabase.from('crm_contacts').select('*').eq('company_id', id).is('deleted_at', null),
          supabase.from('crm_deals').select('*').eq('company_id', id).is('deleted_at', null),
          supabase.from('crm_activities').select('*').eq('company_id', id).order('activity_date', { ascending: false }).limit(20),
        ])
        const c = companyRes.data as CrmCompany | null
        setCompany(c)
        if (c) {
          setEditForm({
            name: c.name || '',
            industry: c.industry || '',
            website: c.website || '',
            phone: c.phone || '',
            email: c.email || '',
            city: c.city || '',
            state: c.state || '',
          })
        }
        setContacts((contactsRes.data || []) as CrmContact[])
        setDeals((dealsRes.data || []) as CrmDeal[])
        setActivities((activitiesRes.data || []) as CrmActivity[])
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [id, supabase])

  if (isLoading) return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>
      </CrmShell>
    </DashboardShell>
  )

  if (!company) return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="text-center py-16"><p className="text-zinc-500">Company not found</p></div>
      </CrmShell>
    </DashboardShell>
  )

  return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarFallback className="rounded-xl text-base">{getInitials(company.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{company.name}</h1>
              {company.industry && <p className="text-sm text-zinc-500">{company.industry}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowCreateProject(true)}>
              <FolderKanban className="h-4 w-4 mr-1" />Create Project
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Company Info</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {company.email && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Mail className="h-4 w-4 shrink-0" />
                        <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">{company.email}</a>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Phone className="h-4 w-4 shrink-0" />
                        <a href={`tel:${company.phone}`} className="hover:underline">{company.phone}</a>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Globe className="h-4 w-4 shrink-0" />
                        <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          {company.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {company.city && company.state && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{company.city}, {company.state}</span>
                      </div>
                    )}
                    {company.employee_count && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Users className="h-4 w-4 shrink-0" />
                        <span>{formatNumber(company.employee_count)} employees</span>
                      </div>
                    )}
                    {company.revenue && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <DollarSign className="h-4 w-4 shrink-0" />
                        <span>{formatCurrency(company.revenue)} revenue</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="contacts">
                <TabsList>
                  <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
                  <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="contacts" className="mt-4">
                  {contacts.length > 0 ? (
                    <div className="space-y-2">
                      {contacts.map(contact => (
                        <Link key={contact.id} href={`/${orgSlug}/crm/contacts/${contact.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="text-xs">{getInitials(`${contact.first_name} ${contact.last_name}`)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{contact.first_name} {contact.last_name}</p>
                                <p className="text-xs text-zinc-500">{contact.job_title || '—'}</p>
                              </div>
                              {contact.email && <span className="text-xs text-zinc-400 hidden sm:block">{contact.email}</span>}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-zinc-400">No contacts linked to this company</div>
                  )}
                </TabsContent>
                <TabsContent value="deals" className="mt-4">
                  {deals.length > 0 ? (
                    <div className="space-y-2">
                      {deals.map(deal => (
                        <Link key={deal.id} href={`/${orgSlug}/crm/deals/${deal.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{deal.name}</p>
                                <p className="text-xs text-zinc-500">{formatCurrency(deal.deal_value)} · {deal.probability}%</p>
                              </div>
                              <Badge variant="outline">{formatDate(deal.expected_close_date || '')}</Badge>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-zinc-400">No deals linked to this company</div>
                  )}
                </TabsContent>
                <TabsContent value="activity" className="mt-4">
                  {activities.length > 0 ? (
                    <div className="space-y-2">
                      {activities.map(activity => (
                        <Card key={activity.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{activity.subject}</p>
                              <p className="text-xs text-zinc-500">{activity.type} · {activity.description}</p>
                            </div>
                            <span className="text-xs text-zinc-400">{formatDate(activity.activity_date)}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-zinc-400">No recent activity</div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Contacts</span><span className="font-medium">{contacts.length}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Deals</span><span className="font-medium">{deals.length}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Total Deal Value</span><span className="font-medium">{formatCurrency(deals.reduce((s, d) => s + Number(d.deal_value), 0))}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Created</span><span className="font-medium">{formatDate(company.created_at)}</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <CreateProjectDialog
          open={showCreateProject}
          onOpenChange={setShowCreateProject}
          defaults={{
            client_name: company.name,
            company_id: company.id,
          }}
        />

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>Update company details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input label="Company Name *" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Industry" value={editForm.industry} onChange={e => setEditForm(p => ({ ...p, industry: e.target.value }))} />
                <Input label="Website" value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Phone" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                <Input label="Email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} />
                <Input label="State" value={editForm.state} onChange={e => setEditForm(p => ({ ...p, state: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button onClick={async () => {
                  try {
                    const { error } = await supabase.from('crm_companies').update({
                      ...editForm,
                      updated_by: (await supabase.auth.getUser()).data.user?.id,
                    }).eq('id', id)
                    if (error) throw error
                    toast.success('Company updated')
                    setShowEditDialog(false)
                    const { data } = await supabase.from('crm_companies').select('*').eq('id', id).single()
                    setCompany(data as CrmCompany | null)
                  } catch (err: any) { toast.error(err.message) }
                }}>Update</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
              <DialogDescription>Are you sure? This action can be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                try {
                  const { error } = await supabase.from('crm_companies').update({
                    deleted_at: new Date().toISOString(),
                    updated_by: (await supabase.auth.getUser()).data.user?.id,
                  }).eq('id', id)
                  if (error) throw error
                  toast.success('Company deleted')
                  router.push(`/${orgSlug}/crm/companies`)
                } catch (err: any) { toast.error(err.message) }
              }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CrmShell>
    </DashboardShell>
  )
}
