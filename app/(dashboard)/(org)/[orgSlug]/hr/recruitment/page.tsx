'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { Briefcase, Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react'
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
import { getJobOpenings, createJobOpening, updateJobOpening, deleteJobOpening, getCandidates, createCandidate, updateCandidate, deleteCandidate, getDepartments } from '@/lib/actions/hr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

export default function RecruitmentPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [openings, setOpenings] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('openings')
  const [jobDialogOpen, setJobDialogOpen] = useState(false)
  const [candDialogOpen, setCandDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [jobForm, setJobForm] = useState({
    title: '', departmentId: '', location: '', employmentType: 'full_time', salaryMin: '', salaryMax: '', currency: 'USD', description: '', status: 'open',
  })
  const [candForm, setCandForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', jobOpeningId: '', stage: 'applied', source: '', notes: '',
  })

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [jobs, cands, deps] = await Promise.all([
      getJobOpenings(currentOrganization.id).catch(() => []),
      getCandidates(currentOrganization.id).catch(() => []),
      getDepartments(currentOrganization.id).catch(() => []),
    ])
    setOpenings(jobs)
    setCandidates(cands)
    setDepartments(deps)
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const handleSaveJob = async () => {
    if (!currentOrganization?.id || !jobForm.title) return
    setSubmitting(true)
    try {
      if (editingJob) {
        await updateJobOpening(editingJob.id, { title: jobForm.title, departmentId: jobForm.departmentId || null, location: jobForm.location || null, employmentType: jobForm.employmentType, status: jobForm.status })
      } else {
        await createJobOpening({
          title: jobForm.title,
          departmentId: jobForm.departmentId || null,
          location: jobForm.location || null,
          employmentType: jobForm.employmentType,
          salaryMin: jobForm.salaryMin ? Number(jobForm.salaryMin) : null,
          salaryMax: jobForm.salaryMax ? Number(jobForm.salaryMax) : null,
          currency: jobForm.currency,
          description: jobForm.description || null,
          status: jobForm.status,
          organizationId: currentOrganization.id,
        })
      }
      setJobDialogOpen(false)
      setEditingJob(null)
      setJobForm({ title: '', departmentId: '', location: '', employmentType: 'full_time', salaryMin: '', salaryMax: '', currency: 'USD', description: '', status: 'open' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveCandidate = async () => {
    if (!currentOrganization?.id || !candForm.firstName || !candForm.jobOpeningId) return
    setSubmitting(true)
    try {
      await createCandidate({
        firstName: candForm.firstName.split(' ')[0],
        lastName: candForm.firstName.split(' ').slice(1).join(' ') || candForm.firstName,
        email: candForm.email || null,
        phone: candForm.phone || null,
        jobOpeningId: candForm.jobOpeningId,
        stage: candForm.stage,
        source: candForm.source || null,
        notes: candForm.notes || null,
        organizationId: currentOrganization.id,
      })
      setCandDialogOpen(false)
      setCandForm({ firstName: '', lastName: '', email: '', phone: '', jobOpeningId: '', stage: 'applied', source: '', notes: '' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const stageColor: Record<string, string> = {
    applied: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    screening: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    interview: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    technical: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
    final: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    hired: 'bg-emerald-600 text-white',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  }

  const openEditJob = (j: any) => {
    setEditingJob(j)
    setJobForm({
      title: j.title, departmentId: j.department_id || '', location: j.location || '', employmentType: j.employment_type || 'full_time',
      salaryMin: j.salary_min || '', salaryMax: j.salary_max || '', currency: j.currency || 'USD', description: j.description || '', status: j.status || 'open',
    })
    setJobDialogOpen(true)
  }

  const candidatesForJob = (jobId: string) => candidates.filter((c) => c.job_opening_id === jobId)

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
              <h1 className="text-2xl font-semibold">Recruitment</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage job openings and candidates</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCandDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Candidate</Button>
              <Button onClick={() => { setEditingJob(null); setJobForm({ title: '', departmentId: '', location: '', employmentType: 'full_time', salaryMin: '', salaryMax: '', currency: 'USD', description: '', status: 'open' }); setJobDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" /> New Job Opening
              </Button>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="openings">Job Openings ({openings.length})</TabsTrigger>
              <TabsTrigger value="candidates">Candidates ({candidates.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="openings" className="space-y-4 mt-4">
              {openings.length === 0 ? (
                <EmptyState icon={Briefcase} title="No job openings" description="Create openings to start recruiting." />
              ) : (
                openings.map((j) => (
                  <Card key={j.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{j.title}</h3>
                            <Badge variant={j.status === 'open' ? 'default' : 'outline'}>{j.status}</Badge>
                          </div>
                          <p className="text-sm text-zinc-500 mt-1">
                            {j.department?.name && <span>{j.department.name} · </span>}
                            {j.location && <span>{j.location} · </span>}
                            <span>{j.employment_type}</span>
                            {j.salary_min && <span> · {j.currency} {Number(j.salary_min).toLocaleString()}{j.salary_max ? `–${Number(j.salary_max).toLocaleString()}` : ''}</span>}
                          </p>
                          {j.description && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">{j.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-sm text-zinc-500"><Users className="h-4 w-4" /> {candidatesForJob(j.id).length}</span>
                          <Button variant="ghost" size="sm" onClick={() => openEditJob(j)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteJobOpening(j.id).then(load)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="candidates" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500">
                          <th className="px-4 py-3 font-medium">Candidate</th>
                          <th className="px-4 py-3 font-medium">Job Opening</th>
                          <th className="px-4 py-3 font-medium">Stage</th>
                          <th className="px-4 py-3 font-medium">Source</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((c) => (
                          <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                            <td className="px-4 py-3">
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-zinc-500">{c.email}</p>
                            </td>
                            <td className="px-4 py-3">{openings.find((o) => o.id === c.job_opening_id)?.title || '—'}</td>
                            <td className="px-4 py-3"><Badge className={stageColor[c.stage] || ''}>{c.stage}</Badge></td>
                            <td className="px-4 py-3">{c.source || '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteCandidate(c.id).then(load)}><Trash2 className="h-4 w-4" /></Button>
                            </td>
                          </tr>
                        ))}
                        {candidates.length === 0 && (
                          <tr><td colSpan={5}><EmptyState title="No candidates yet" description="Add candidates to your pipeline." /></td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingJob ? 'Edit Job Opening' : 'New Job Opening'}</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="Senior Software Engineer" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <select value={jobForm.departmentId} onChange={(e) => setJobForm({ ...jobForm, departmentId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="">None</option>
                    {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
                <div className="space-y-2"><Label>Location</Label><Input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Salary min</Label><Input type="number" value={jobForm.salaryMin} onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })} /></div>
                <div className="space-y-2"><Label>Salary max</Label><Input type="number" value={jobForm.salaryMax} onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Currency</Label><Input value={jobForm.currency} onChange={(e) => setJobForm({ ...jobForm, currency: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="open">Open</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                    <option value="on_hold">On hold</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Input value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setJobDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveJob} disabled={submitting || !jobForm.title}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {editingJob ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={candDialogOpen} onOpenChange={setCandDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full name *</Label><Input value={candForm.firstName} onChange={(e) => setCandForm({ ...candForm, firstName: e.target.value })} placeholder="Jane Doe" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={candForm.email} onChange={(e) => setCandForm({ ...candForm, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={candForm.phone} onChange={(e) => setCandForm({ ...candForm, phone: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Job opening *</Label>
                  <select value={candForm.jobOpeningId} onChange={(e) => setCandForm({ ...candForm, jobOpeningId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="">Select opening</option>
                    {openings.map((o) => (<option key={o.id} value={o.id}>{o.title}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <select value={candForm.stage} onChange={(e) => setCandForm({ ...candForm, stage: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="applied">Applied</option>
                    <option value="screening">Screening</option>
                    <option value="interview">Interview</option>
                    <option value="technical">Technical</option>
                    <option value="final">Final</option>
                    <option value="offer">Offer</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Source</Label><Input value={candForm.source} onChange={(e) => setCandForm({ ...candForm, source: e.target.value })} placeholder="LinkedIn" /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Input value={candForm.notes} onChange={(e) => setCandForm({ ...candForm, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setCandDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCandidate} disabled={submitting || !candForm.firstName || !candForm.jobOpeningId}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </HrShell>
    </DashboardShell>
  )
}