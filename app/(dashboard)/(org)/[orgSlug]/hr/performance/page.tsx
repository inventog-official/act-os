'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { ClipboardCheck, Plus, Pencil, Trash2, Loader2, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getPerformanceCycles, createPerformanceCycle, updatePerformanceCycle, deletePerformanceCycle, getPerformanceReviews, createPerformanceReview, updatePerformanceReview, getEmployees, getGoals } from '@/lib/actions/hr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

export default function PerformancePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [cycles, setCycles] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('reviews')
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cycleForm, setCycleForm] = useState({ name: '', periodType: 'quarterly', startDate: '', endDate: '', status: 'planned' })
  const [reviewForm, setReviewForm] = useState({
    employeeId: '', cycleId: '', reviewerId: '', rating: '3', goalsAchieved: '', strengths: '', improvements: '', status: 'draft',
  })

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [c, r, e, g] = await Promise.all([
      getPerformanceCycles(currentOrganization.id).catch(() => []),
      getPerformanceReviews(currentOrganization.id).catch(() => []),
      getEmployees(currentOrganization.id).catch(() => []),
      getGoals(currentOrganization.id).catch(() => []),
    ])
    setCycles(c)
    setReviews(r)
    setEmployees(e)
    setGoals(g)
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const employeeName = (id: string | null) => {
    const e = employees.find((e) => e.id === id)
    return e ? `${e.first_name} ${e.last_name}` : '—'
  }

  const handleSaveCycle = async () => {
    if (!currentOrganization?.id || !cycleForm.name) return
    setSubmitting(true)
    try {
      await createPerformanceCycle({
        name: cycleForm.name,
        periodType: cycleForm.periodType,
        startDate: cycleForm.startDate || null,
        endDate: cycleForm.endDate || null,
        status: cycleForm.status,
        organizationId: currentOrganization.id,
      })
      setCycleDialogOpen(false)
      setCycleForm({ name: '', periodType: 'quarterly', startDate: '', endDate: '', status: 'planned' })
      load()
    } finally { setSubmitting(false) }
  }

  const handleSaveReview = async () => {
    if (!currentOrganization?.id || !reviewForm.employeeId || !reviewForm.cycleId) return
    setSubmitting(true)
    try {
      if (editingReview) {
        await updatePerformanceReview(editingReview.id, {
          rating: reviewForm.rating ? Number(reviewForm.rating) : null,
          goalsAchieved: reviewForm.goalsAchieved || null,
          strengths: reviewForm.strengths || null,
          improvements: reviewForm.improvements || null,
          status: reviewForm.status,
        }, currentOrganization.id)
      } else {
        await createPerformanceReview({
          employeeId: reviewForm.employeeId,
          cycleId: reviewForm.cycleId,
          reviewerId: reviewForm.reviewerId || null,
          rating: reviewForm.rating ? Number(reviewForm.rating) : null,
          goalsAchieved: reviewForm.goalsAchieved || null,
          strengths: reviewForm.strengths || null,
          improvements: reviewForm.improvements || null,
          status: reviewForm.status,
          organizationId: currentOrganization.id,
        })
      }
      setReviewDialogOpen(false)
      setEditingReview(null)
      setReviewForm({ employeeId: '', cycleId: '', reviewerId: '', rating: '3', goalsAchieved: '', strengths: '', improvements: '', status: 'draft' })
      load()
    } finally { setSubmitting(false) }
  }

  const openEditReview = (r: any) => {
    setEditingReview(r)
    setReviewForm({
      employeeId: r.employee_id, cycleId: r.cycle_id, reviewerId: r.reviewer_id || '', rating: r.rating?.toString() || '3',
      goalsAchieved: r.goals_achieved || '', strengths: r.strengths || '', improvements: r.improvements || '', status: r.status || 'draft',
    })
    setReviewDialogOpen(true)
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    submitted: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    acknowledged: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    planned: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <Skeleton className="h-10 w-64 mb-6" />
          <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </HrShell>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell orgSlug={orgSlug}>
      <HrShell orgSlug={orgSlug}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Performance</h1>
              <p className="text-sm text-zinc-500 mt-1">Reviews and performance cycles</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCycleDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Cycle</Button>
              <Button onClick={() => { setEditingReview(null); setReviewForm({ employeeId: '', cycleId: '', reviewerId: '', rating: '3', goalsAchieved: '', strengths: '', improvements: '', status: 'draft' }); setReviewDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" /> New Review
              </Button>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
              <TabsTrigger value="cycles">Cycles ({cycles.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500">
                          <th className="px-4 py-3 font-medium">Employee</th>
                          <th className="px-4 py-3 font-medium">Cycle</th>
                          <th className="px-4 py-3 font-medium">Rating</th>
                          <th className="px-4 py-3 font-medium">Reviewer</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map((r) => (
                          <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                            <td className="px-4 py-3 font-medium">{employeeName(r.employee_id)}</td>
                            <td className="px-4 py-3">{r.cycle?.name || '—'}</td>
                            <td className="px-4 py-3">
                              {r.rating ? (
                                <span className="inline-flex items-center gap-1 font-medium"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {r.rating}/5</span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3">{r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}` : '—'}</td>
                            <td className="px-4 py-3"><Badge className={statusColor[r.status] || ''}>{r.status}</Badge></td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" onClick={() => openEditReview(r)}><Pencil className="h-4 w-4" /></Button>
                            </td>
                          </tr>
                        ))}
                        {reviews.length === 0 && (
                          <tr><td colSpan={6}><EmptyState icon={ClipboardCheck} title="No performance reviews" description="Create reviews to track performance." /></td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cycles" className="mt-4">
              <div className="grid gap-4 grid-cols-3">
                {cycles.map((c) => {
                  const cycleReviews = reviews.filter((r) => r.cycle_id === c.id)
                  const avg = cycleReviews.length ? (cycleReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / cycleReviews.length).toFixed(1) : null
                  return (
                    <Card key={c.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950">
                            <ClipboardCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deletePerformanceCycle(c.id).then(load)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <h3 className="mt-3 font-semibold">{c.name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{c.period_type} · {c.start_date?.slice(0, 10) || '—'} → {c.end_date?.slice(0, 10) || '—'}</p>
                        <div className="flex items-center justify-between mt-3">
                          <Badge className={statusColor[c.status] || ''}>{c.status}</Badge>
                          <span className="text-xs text-zinc-500">{cycleReviews.length} reviews{avg ? ` · avg ${avg}` : ''}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {cycles.length === 0 && <div className="col-span-3"><EmptyState title="No performance cycles" description="Create cycles to run reviews." /></div>}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Performance Cycle</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={cycleForm.name} onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })} placeholder="Q3 2026 Review" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period type</Label>
                  <select value={cycleForm.periodType} onChange={(e) => setCycleForm({ ...cycleForm, periodType: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={cycleForm.status} onChange={(e) => setCycleForm({ ...cycleForm, status: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Start date</Label><Input type="date" value={cycleForm.startDate} onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })} /></div>
                <div className="space-y-2"><Label>End date</Label><Input type="date" value={cycleForm.endDate} onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setCycleDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCycle} disabled={submitting || !cycleForm.name}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingReview ? 'Edit Review' : 'New Review'}</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <select value={reviewForm.employeeId} disabled={!!editingReview} onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="">Select employee</option>
                    {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Cycle *</Label>
                  <select value={reviewForm.cycleId} disabled={!!editingReview} onChange={(e) => setReviewForm({ ...reviewForm, cycleId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="">Select cycle</option>
                    {cycles.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reviewer</Label>
                  <select value={reviewForm.reviewerId} onChange={(e) => setReviewForm({ ...reviewForm, reviewerId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="">Self</option>
                    {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-2"><Label>Goals achieved</Label><Input value={reviewForm.goalsAchieved} onChange={(e) => setReviewForm({ ...reviewForm, goalsAchieved: e.target.value })} /></div>
              <div className="space-y-2"><Label>Strengths</Label><Input value={reviewForm.strengths} onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })} /></div>
              <div className="space-y-2"><Label>Areas for improvement</Label><Input value={reviewForm.improvements} onChange={(e) => setReviewForm({ ...reviewForm, improvements: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveReview} disabled={submitting || !reviewForm.employeeId || !reviewForm.cycleId}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {editingReview ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </HrShell>
    </DashboardShell>
  )
}