'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, Edit3, Pencil, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CrmShell } from '@/components/crm/crm-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import type { CrmContact, CrmCompany, CrmDeal, CrmActivity } from '@/lib/types/database'

export default function ContactDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [contact, setContact] = useState<CrmContact | null>(null)
  const [company, setCompany] = useState<CrmCompany | null>(null)
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', job_title: '', department: '' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: c } = await supabase.from('crm_contacts').select('*').eq('id', id).single()
        if (!c) { setIsLoading(false); return }
        const ct = c as CrmContact
        setContact(ct)
        setEditForm({
          first_name: ct.first_name || '',
          last_name: ct.last_name || '',
          email: ct.email || '',
          phone: ct.phone || '',
          job_title: ct.job_title || '',
          department: ct.department || '',
        })
        const [companyRes, dealsRes, activitiesRes] = await Promise.all([
          ct.company_id ? supabase.from('crm_companies').select('*').eq('id', ct.company_id).single() : Promise.resolve({ data: null }),
          supabase.from('crm_deals').select('*').eq('contact_id', ct.id).is('deleted_at', null),
          supabase.from('crm_activities').select('*').eq('contact_id', ct.id).order('activity_date', { ascending: false }).limit(20),
        ])
        setCompany(companyRes.data as CrmCompany | null)
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

  if (!contact) return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="text-center py-16"><p className="text-zinc-500">Contact not found</p></div>
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
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base">{getInitials(`${contact.first_name} ${contact.last_name}`)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{contact.first_name} {contact.last_name}</h1>
              {contact.job_title && <p className="text-sm text-zinc-500">{contact.job_title}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Mail className="h-4 w-4 shrink-0" />
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Phone className="h-4 w-4 shrink-0" />
                        <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                      </div>
                    )}
                    {contact.department && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Briefcase className="h-4 w-4 shrink-0" />
                        <span>{contact.department}</span>
                      </div>
                    )}
                    {company && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <Link href={`/${orgSlug}/crm/companies/${company.id}`} className="text-blue-600 hover:underline">
                          {company.name}
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="deals">
                <TabsList>
                  <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="deals" className="mt-4">
                  {deals.length > 0 ? (
                    <div className="space-y-2">
                      {deals.map(deal => (
                        <Link key={deal.id} href={`/${orgSlug}/crm/deals/${deal.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{deal.name}</p>
                                <p className="text-xs text-zinc-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.deal_value)} · {deal.probability}%</p>
                              </div>
                              <span className="text-xs text-zinc-400">{formatDate(deal.expected_close_date || '')}</span>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-zinc-400">No deals linked to this contact</div>
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
                              <p className="text-xs text-zinc-500">{activity.type}</p>
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
                  <div className="flex justify-between"><span className="text-zinc-500">Deals</span><span className="font-medium">{deals.length}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Company</span><span className="font-medium">{company?.name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Created</span><span className="font-medium">{formatDate(contact.created_at)}</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>Update contact details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name *" value={editForm.first_name} onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))} />
                <Input label="Last Name *" value={editForm.last_name} onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                <Input label="Phone" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Job Title" value={editForm.job_title} onChange={e => setEditForm(p => ({ ...p, job_title: e.target.value }))} />
                <Input label="Department" value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button onClick={async () => {
                  try {
                    const { error } = await supabase.from('crm_contacts').update({
                      ...editForm,
                      updated_by: (await supabase.auth.getUser()).data.user?.id,
                    }).eq('id', id)
                    if (error) throw error
                    toast.success('Contact updated')
                    setShowEditDialog(false)
                    const { data } = await supabase.from('crm_contacts').select('*').eq('id', id).single()
                    setContact(data as CrmContact | null)
                  } catch (err: any) { toast.error(err.message) }
                }}>Update</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Contact</DialogTitle>
              <DialogDescription>Are you sure? This action can be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                try {
                  const { error } = await supabase.from('crm_contacts').update({
                    deleted_at: new Date().toISOString(),
                    updated_by: (await supabase.auth.getUser()).data.user?.id,
                  }).eq('id', id)
                  if (error) throw error
                  toast.success('Contact deleted')
                  router.push(`/${orgSlug}/crm/contacts`)
                } catch (err: any) { toast.error(err.message) }
              }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CrmShell>
    </DashboardShell>
  )
}
