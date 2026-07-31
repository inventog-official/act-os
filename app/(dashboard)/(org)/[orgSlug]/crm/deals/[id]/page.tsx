'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, User, Building2, Calendar, DollarSign, Percent, Pencil, Trash2, FolderKanban, Loader2, FileText, Receipt } from 'lucide-react'
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
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import type { CrmDeal, CrmPipelineStage, CrmContact, CrmCompany, CrmActivity, CrmNote } from '@/lib/types/database'
import { CreateProjectFromDeal } from '@/components/crm/create-project-from-deal'
import { CreateQuoteFromDeal } from '@/components/crm/create-quote-from-deal'

interface FinanceDoc {
  id: string
  number?: string
  issue_date?: string | null
  total?: number | string | null
  currency?: string | null
  status?: string | null
  type?: string | null
}

export default function DealDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [deal, setDeal] = useState<CrmDeal | null>(null)
  const [stage, setStage] = useState<CrmPipelineStage | null>(null)
  const [company, setCompany] = useState<CrmCompany | null>(null)
  const [contact, setContact] = useState<CrmContact | null>(null)
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [notes, setNotes] = useState<CrmNote[]>([])
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateQuote, setShowCreateQuote] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', deal_value: 0, probability: 0, notes: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [financeDocs, setFinanceDocs] = useState<FinanceDoc[]>([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: d } = await supabase.from('crm_deals').select('*').eq('id', id).single()
        if (!d) { setIsLoading(false); return }
        const dealData = d as CrmDeal
        setDeal(dealData)
        setEditForm({
          name: dealData.name || '',
          deal_value: Number(dealData.deal_value) || 0,
          probability: dealData.probability || 0,
          notes: dealData.notes || '',
        })

        const [stageRes, companyRes, contactRes, activitiesRes, notesRes, quotesRes, invoicesRes] = await Promise.all([
          supabase.from('crm_pipeline_stages').select('*').eq('id', dealData.pipeline_stage_id).single(),
          dealData.company_id ? supabase.from('crm_companies').select('*').eq('id', dealData.company_id).single() : Promise.resolve({ data: null }),
          dealData.contact_id ? supabase.from('crm_contacts').select('*').eq('id', dealData.contact_id).single() : Promise.resolve({ data: null }),
          supabase.from('crm_activities').select('*').eq('deal_id', dealData.id).order('activity_date', { ascending: false }).limit(20),
          supabase.from('crm_notes').select('*').eq('deal_id', dealData.id).is('deleted_at', null).order('created_at', { ascending: false }),
          supabase.from('finance_quotations').select('id, quote_number, issue_date, expiry_date, total, currency, status, type').eq('deal_id', dealData.id).is('deleted_at', null).order('created_at', { ascending: false }),
          supabase.from('finance_invoices').select('id, invoice_number, issue_date, due_date, total, currency, status').eq('deal_id', dealData.id).is('deleted_at', null).order('created_at', { ascending: false }),
        ])
        setStage(stageRes.data as CrmPipelineStage | null)
        setCompany(companyRes.data as CrmCompany | null)
        setContact(contactRes.data as CrmContact | null)
        setActivities((activitiesRes.data || []) as CrmActivity[])
        setNotes((notesRes.data || []) as CrmNote[])
        const quotes = (quotesRes.data || []).map((q: any) => ({ ...q, number: q.quote_number, type: q.type }))
        const invoices = (invoicesRes.data || []).map((i: any) => ({ ...i, number: i.invoice_number, type: 'invoice' }))
        setFinanceDocs([...quotes, ...invoices].sort((a, b) => String(b.issue_date || '').localeCompare(String(a.issue_date || ''))))
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

  if (!deal) return (
    <DashboardShell orgSlug={orgSlug}>
      <CrmShell orgSlug={orgSlug}>
        <div className="text-center py-16"><p className="text-zinc-500">Deal not found</p></div>
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
              <AvatarFallback className="rounded-xl text-base bg-zinc-100 dark:bg-zinc-800">
                {getInitials(deal.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{deal.name}</h1>
                {stage && <Badge style={{ backgroundColor: stage.color }} className="text-white">{stage.name}</Badge>}
              </div>
              <p className="text-sm text-zinc-500">{formatCurrency(deal.deal_value)} · {deal.probability}% probability</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
            <Button variant="outline" size="sm" onClick={() => setShowCreateProject(true)}>
              <FolderKanban className="h-4 w-4 mr-1" />Create Project
            </Button>
            <Button size="sm" onClick={() => setShowCreateQuote(true)}>
              <FileText className="h-4 w-4 mr-1" />Generate Quote
            </Button>
          </div>

          {deal.actual_close_date && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/50">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1">
                <p className="font-medium text-emerald-800 dark:text-emerald-300">Deal Won</p>
                <p className="text-emerald-600 dark:text-emerald-400">This deal was closed on {formatDate(deal.actual_close_date)}. Create a project to start execution.</p>
              </div>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreateProject(true)}>
                <FolderKanban className="h-4 w-4 mr-1" />Create Project
              </Button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Deal Details</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <DollarSign className="h-4 w-4 shrink-0" />
                      <span>Value: <strong>{formatCurrency(deal.deal_value)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Percent className="h-4 w-4 shrink-0" />
                      <span>Probability: <strong>{deal.probability}%</strong></span>
                    </div>
                    {deal.expected_close_date && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>Expected close: <strong>{formatDate(deal.expected_close_date)}</strong></span>
                      </div>
                    )}
                    {deal.actual_close_date && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>Closed: <strong>{formatDate(deal.actual_close_date)}</strong></span>
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
                    {contact && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <User className="h-4 w-4 shrink-0" />
                        <Link href={`/${orgSlug}/crm/contacts/${contact.id}`} className="text-blue-600 hover:underline">
                          {contact.first_name} {contact.last_name}
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="notes">
                <TabsList>
                  <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="notes" className="mt-4 space-y-3">
                  {notes.length > 0 ? notes.map(note => (
                    <Card key={note.id}>
                      <CardContent className="p-4">
                        {note.title && <p className="font-medium text-sm mb-1">{note.title}</p>}
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-zinc-400 mt-2">{formatDate(note.created_at)}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-8 text-sm text-zinc-400">No notes yet</div>
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
                  <div className="flex justify-between"><span className="text-zinc-500">Value</span><span className="font-medium">{formatCurrency(deal.deal_value)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Probability</span><span className="font-medium">{deal.probability}%</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Stage</span><span className="font-medium">{stage?.name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Company</span><span className="font-medium">{company?.name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Contact</span><span className="font-medium">{contact ? `${contact.first_name} ${contact.last_name}` : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Created</span><span className="font-medium">{formatDate(deal.created_at)}</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Financial History</CardTitle>
                  <Badge variant="outline">{financeDocs.length}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {financeDocs.length > 0 ? financeDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-zinc-400 shrink-0">{doc.type === 'invoice' ? <Receipt className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span>
                        <div className="min-w-0">
                          <Link
                            href={doc.type === 'invoice'
                              ? `/${orgSlug}/finance/invoices`
                              : `/${orgSlug}/finance/quotations`}
                            className="font-medium text-blue-600 hover:underline truncate block"
                          >
                            {doc.number || (doc.type === 'invoice' ? 'Invoice' : 'Quote')}
                          </Link>
                          <p className="text-xs text-zinc-400 capitalize">{doc.status || 'draft'}{doc.issue_date ? ` · ${formatDate(doc.issue_date)}` : ''}</p>
                        </div>
                      </div>
                      <span className="font-medium shrink-0">{formatCurrency(Number(doc.total) || 0, doc.currency || 'USD')}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-zinc-400">No quotes or invoices for this deal yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <CreateProjectFromDeal
          open={showCreateProject}
          onOpenChange={setShowCreateProject}
          deal={deal}
          companyName={company?.name}
          orgSlug={orgSlug}
        />
        <CreateQuoteFromDeal
          open={showCreateQuote}
          onOpenChange={setShowCreateQuote}
          deal={deal}
          company={company}
          contact={contact}
          orgSlug={orgSlug}
        />

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Edit Deal</DialogTitle>
              <DialogDescription>Update deal details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input label="Deal Name *" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Value" type="number" step="0.01" value={editForm.deal_value} onChange={e => setEditForm(p => ({ ...p, deal_value: Number(e.target.value) }))} />
                <Input label="Probability %" type="number" min="0" max="100" value={editForm.probability} onChange={e => setEditForm(p => ({ ...p, probability: Number(e.target.value) }))} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button onClick={async () => {
                  try {
                    const { error } = await supabase.from('crm_deals').update({
                      name: editForm.name,
                      deal_value: editForm.deal_value,
                      probability: editForm.probability,
                      notes: editForm.notes,
                      updated_by: (await supabase.auth.getUser()).data.user?.id,
                    }).eq('id', id)
                    if (error) throw error
                    toast.success('Deal updated')
                    setShowEditDialog(false)
                    const { data } = await supabase.from('crm_deals').select('*').eq('id', id).single()
                    setDeal(data as CrmDeal | null)
                  } catch (err: any) { toast.error(err.message) }
                }}>Update</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Deal</DialogTitle>
              <DialogDescription>Are you sure? This action can be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                try {
                  const { error } = await supabase.from('crm_deals').update({
                    deleted_at: new Date().toISOString(),
                    updated_by: (await supabase.auth.getUser()).data.user?.id,
                  }).eq('id', id)
                  if (error) throw error
                  toast.success('Deal deleted')
                  router.push(`/${orgSlug}/crm/deals`)
                } catch (err: any) { toast.error(err.message) }
              }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CrmShell>
    </DashboardShell>
  )
}
