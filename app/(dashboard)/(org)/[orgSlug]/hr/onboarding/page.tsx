'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { Rocket, Plus, Trash2, Loader2, CheckCircle2, Circle, ArrowRight, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { getOnboardingTemplates, getOnboardingAssignments, createOnboardingTemplate, createOnboardingAssignment, updateOnboardingAssignmentStatus, addOnboardingTask, updateOnboardingTask, deleteOnboardingTask, deleteOnboardingAssignment, getOffboardingRequests, createOffboardingRequest, updateOffboardingRequest, deleteOffboardingRequest, getEmployees } from '@/lib/actions/hr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

export default function OnboardingPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [templates, setTemplates] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [offboarding, setOffboarding] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('assignments')
  const [tempDialogOpen, setTempDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [offboardDialogOpen, setOffboardDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tempForm, setTempForm] = useState({ name: '', description: '' })
  const [assignForm, setAssignForm] = useState({ employeeId: '', templateId: '' })
  const [offForm, setOffForm] = useState({ employeeId: '', reason: '', exitDate: new Date().toISOString().slice(0, 10) })
  const [taskDialog, setTaskDialog] = useState<{ assignmentId: string } | null>(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '' })

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [temps, assign, off, emps] = await Promise.all([
      getOnboardingTemplates(currentOrganization.id).catch(() => []),
      getOnboardingAssignments(currentOrganization.id).catch(() => []),
      getOffboardingRequests(currentOrganization.id).catch(() => []),
      getEmployees(currentOrganization.id).catch(() => []),
    ])
    setTemplates(temps)
    setAssignments(assign)
    setOffboarding(off)
    setEmployees(emps)
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

  const handleCreateTemplate = async () => {
    if (!currentOrganization?.id || !tempForm.name) return
    setSubmitting(true)
    try {
      await createOnboardingTemplate({ name: tempForm.name, description: tempForm.description || null, organizationId: currentOrganization.id })
      setTempDialogOpen(false)
      setTempForm({ name: '', description: '' })
      load()
    } finally { setSubmitting(false) }
  }

  const handleCreateAssignment = async () => {
    if (!currentOrganization?.id || !assignForm.employeeId) return
    setSubmitting(true)
    try {
      await createOnboardingAssignment({ employeeId: assignForm.employeeId, templateId: assignForm.templateId || null, organizationId: currentOrganization.id })
      setAssignDialogOpen(false)
      setAssignForm({ employeeId: '', templateId: '' })
      load()
    } finally { setSubmitting(false) }
  }

  const handleAddTask = async () => {
    if (!taskDialog || !currentOrganization?.id || !taskForm.title) return
    setSubmitting(true)
    try {
      await addOnboardingTask({ assignmentId: taskDialog.assignmentId, title: taskForm.title, description: taskForm.description || null, dueDate: taskForm.dueDate || null, organizationId: currentOrganization.id })
      setTaskDialog(null)
      setTaskForm({ title: '', description: '', dueDate: '' })
      load()
    } finally { setSubmitting(false) }
  }

  const handleCreateOffboarding = async () => {
    if (!currentOrganization?.id || !offForm.employeeId) return
    setSubmitting(true)
    try {
      await createOffboardingRequest({
        employeeId: offForm.employeeId,
        reason: offForm.reason,
        exitDate: offForm.exitDate,
        organizationId: currentOrganization.id,
      })
      setOffboardDialogOpen(false)
      setOffForm({ employeeId: '', reason: '', exitDate: new Date().toISOString().slice(0, 10) })
      load()
    } finally { setSubmitting(false) }
  }

  const taskProgress = (a: any) => {
    const tasks = a.tasks || []
    const done = tasks.filter((t: any) => t.status === 'completed').length
    return tasks.length ? Math.round((done / tasks.length) * 100) : 0
  }

  const statusColor: Record<string, string> = {
    not_started: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
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
              <h1 className="text-2xl font-semibold">Onboarding & Offboarding</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage employee journeys</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOffboardDialogOpen(true)}><LogOut className="h-4 w-4 mr-2" /> Offboard</Button>
              <Button variant="outline" onClick={() => setTempDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Template</Button>
              <Button onClick={() => setAssignDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Onboarding</Button>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="assignments">Onboarding ({assignments.length})</TabsTrigger>
              <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
              <TabsTrigger value="offboarding">Offboarding ({offboarding.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="assignments" className="mt-4 space-y-4">
              {assignments.length === 0 ? (
                <EmptyState icon={Rocket} title="No onboarding assignments" description="Assign onboarding plans to new hires." />
              ) : (
                assignments.map((a) => {
                  const tasks = a.tasks || []
                  return (
                    <Card key={a.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{employeeName(a.employee_id)}</h3>
                              <Badge className={statusColor[a.status] || ''}>{a.status}</Badge>
                            </div>
                            <p className="text-sm text-zinc-500 mt-1">
                              {a.template?.name ? `Template: ${a.template.name}` : 'No template'} · {tasks.length} tasks
                            </p>
                            <div className="mt-2 flex items-center gap-2 w-full max-w-md">
                              <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${taskProgress(a)}%` }} />
                              </div>
                              <span className="text-xs text-zinc-500">{taskProgress(a)}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" onClick={() => { setTaskDialog({ assignmentId: a.id }); setTaskForm({ title: '', description: '', dueDate: '' }) }}>Add task</Button>
                            {a.status === 'not_started' && (
                              <Button variant="outline" size="sm" onClick={() => updateOnboardingAssignmentStatus(a.id, 'in_progress', currentOrganization!.id).then(load)}>Start</Button>
                            )}
                            {a.status === 'in_progress' && (
                              <Button variant="outline" size="sm" className="text-emerald-600" onClick={() => updateOnboardingAssignmentStatus(a.id, 'completed', currentOrganization!.id).then(load)}>Complete</Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteOnboardingAssignment(a.id).then(load)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        {tasks.length > 0 && (
                          <div className="mt-4 space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                            {tasks.map((t: any) => (
                              <div key={t.id} className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-0 h-6 w-6"
                                  onClick={() => updateOnboardingTask(t.id, { status: t.status === 'completed' ? 'pending' : 'completed' }).then(load)}
                                >
                                  {t.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-zinc-400" />}
                                </Button>
                                <div className="flex-1">
                                  <p className={`text-sm ${t.status === 'completed' ? 'line-through text-zinc-400' : ''}`}>{t.title}</p>
                                  {t.due_date && <p className="text-xs text-zinc-500">Due {t.due_date.slice(0, 10)}</p>}
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteOnboardingTask(t.id).then(load)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <div className="grid gap-4 grid-cols-3">
                {templates.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
                        <Rocket className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="mt-3 font-semibold">{t.name}</h3>
                      {t.description && <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{t.description}</p>}
                      <p className="text-xs text-zinc-500 mt-3">{Array.isArray(t.steps) ? t.steps.length : 0} steps</p>
                    </CardContent>
                  </Card>
                ))}
                {templates.length === 0 && <div className="col-span-3"><EmptyState title="No templates" description="Create onboarding templates to standardize the process." /></div>}
              </div>
            </TabsContent>

            <TabsContent value="offboarding" className="mt-4 space-y-4">
              {offboarding.length === 0 ? (
                <EmptyState icon={LogOut} title="No offboarding requests" description="Offboarding requests will appear here." />
              ) : (
                offboarding.map((o) => (
                  <Card key={o.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{employeeName(o.employee_id)}</h3>
                            <Badge className={statusColor[o.status] || ''}>{o.status}</Badge>
                          </div>
                          <p className="text-sm text-zinc-500 mt-1">{o.reason}</p>
                          <p className="text-xs text-zinc-500 mt-1">Exit date: {o.exit_date?.slice(0, 10)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {o.status === 'requested' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => updateOffboardingRequest(o.id, { status: 'in_review' }).then(load)}><ArrowRight className="h-3.5 w-3.5 mr-1" /> Review</Button>
                            </>
                          )}
                          {o.status === 'in_review' && (
                            <>
                              <Button variant="outline" size="sm" className="text-emerald-600" onClick={() => updateOffboardingRequest(o.id, { status: 'approved' }).then(load)}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve</Button>
                            </>
                          )}
                          {(o.status === 'requested' || o.status === 'in_review' || o.status === 'approved') && (
                            <Button variant="outline" size="sm" className="text-emerald-600" onClick={() => updateOffboardingRequest(o.id, { status: 'completed' }).then(load)}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete</Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteOffboardingRequest(o.id).then(load)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={tempDialogOpen} onOpenChange={setTempDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Onboarding Template</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={tempForm.name} onChange={(e) => setTempForm({ ...tempForm, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={tempForm.description} onChange={(e) => setTempForm({ ...tempForm, description: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setTempDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTemplate} disabled={submitting || !tempForm.name}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Onboarding Assignment</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <select value={assignForm.employeeId} onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="">Select employee</option>
                  {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <select value={assignForm.templateId} onChange={(e) => setAssignForm({ ...assignForm, templateId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="">None</option>
                  {templates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAssignment} disabled={submitting || !assignForm.employeeId}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Assign</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!taskDialog} onOpenChange={() => setTaskDialog(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Onboarding Task</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Set up email" /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Due date</Label><Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setTaskDialog(null)}>Cancel</Button>
              <Button onClick={handleAddTask} disabled={submitting || !taskForm.title}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={offboardDialogOpen} onOpenChange={setOffboardDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Offboarding Request</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <select value={offForm.employeeId} onChange={(e) => setOffForm({ ...offForm, employeeId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="">Select employee</option>
                  {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
                </select>
              </div>
              <div className="space-y-2"><Label>Reason *</Label><Input value={offForm.reason} onChange={(e) => setOffForm({ ...offForm, reason: e.target.value })} placeholder="Resignation" /></div>
              <div className="space-y-2"><Label>Exit date</Label><Input type="date" value={offForm.exitDate} onChange={(e) => setOffForm({ ...offForm, exitDate: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOffboardDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateOffboarding} disabled={submitting || !offForm.employeeId || !offForm.reason}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </HrShell>
    </DashboardShell>
  )
}