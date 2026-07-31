'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { Target, Plus, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getGoals, createGoal, updateGoal, deleteGoal, getDepartments, getEmployees } from '@/lib/actions/hr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

export default function GoalsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [goals, setGoals] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', goalLevel: 'company', parentGoalId: '', departmentId: '', employeeId: '', target: '', deadline: '', status: 'in_progress',
  })

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [g, d, e] = await Promise.all([
      getGoals(currentOrganization.id).catch(() => []),
      getDepartments(currentOrganization.id).catch(() => []),
      getEmployees(currentOrganization.id).catch(() => []),
    ])
    setGoals(g)
    setDepartments(d)
    setEmployees(e)
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const employeeName = (id: string | null) => {
    const e = employees.find((e) => e.id === id)
    return e ? `${e.first_name} ${e.last_name}` : null
  }

  const handleSave = async () => {
    if (!currentOrganization?.id || !form.title) return
    setSubmitting(true)
    try {
      await createGoal({
        title: form.title,
        description: form.description || null,
        goalLevel: form.goalLevel,
        parentGoalId: form.parentGoalId || null,
        departmentId: form.departmentId || null,
        employeeId: form.employeeId || null,
        target: form.target ? Number(form.target) : null,
        deadline: form.deadline || null,
        status: form.status,
        organizationId: currentOrganization.id,
      })
      setDialogOpen(false)
      setForm({ title: '', description: '', goalLevel: 'company', parentGoalId: '', departmentId: '', employeeId: '', target: '', deadline: '', status: 'in_progress' })
      load()
    } finally { setSubmitting(false) }
  }

  const statusColor: Record<string, string> = {
    not_started: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    on_hold: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  }

  const levelColor: Record<string, string> = {
    company: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
    department: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    team: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    employee: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  }

  const progressOf = (g: any) => {
    if (g.progress != null) return Number(g.progress)
    const target = Number(g.target || 0)
    const current = Number(g.current_value || 0)
    if (target > 0) return Math.min(100, Math.round((current / target) * 100))
    return 0
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-4 grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
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
              <h1 className="text-2xl font-semibold">Goals</h1>
              <p className="text-sm text-zinc-500 mt-1">Company, department and individual goals</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Goal
            </Button>
          </div>

          {goals.length === 0 ? (
            <EmptyState icon={Target} title="No goals yet" description="Create goals to align your team." />
          ) : (
            <div className="grid gap-4 grid-cols-3">
              {goals.map((g) => (
                <Card key={g.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={levelColor[g.goal_level] || ''}>{g.goal_level}</Badge>
                        <Badge className={statusColor[g.status] || ''}>{g.status}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteGoal(g.id).then(load)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <h3 className="mt-3 font-semibold">{g.title}</h3>
                    {g.description && <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{g.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-3">
                      {g.department?.name && <span>Dept: {g.department.name}</span>}
                      {employeeName(g.employee_id) && <span>· {employeeName(g.employee_id)}</span>}
                      {g.parent?.title && <span>· parent: {g.parent.title}</span>}
                    </div>
                    {g.target && <p className="text-xs text-zinc-500 mt-1">Target: {g.target}{g.deadline ? ` · Due ${g.deadline.slice(0, 10)}` : ''}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div className={`h-full rounded-full ${progressOf(g) >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progressOf(g)}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{progressOf(g)}%</span>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => updateGoal(g.id, { progress: Math.min(100, progressOf(g) + 10) }, currentOrganization!.id).then(load)}>
                      Mark +10% progress
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Grow revenue by 20%" /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <select value={form.goalLevel} onChange={(e) => setForm({ ...form, goalLevel: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="company">Company</option>
                    <option value="department">Department</option>
                    <option value="team">Team</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="on_hold">On hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="">None</option>
                    {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="">None</option>
                    {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Parent goal</Label>
                  <select value={form.parentGoalId} onChange={(e) => setForm({ ...form, parentGoalId: e.target.value })} className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <option value="">None</option>
                    {goals.map((g) => (<option key={g.id} value={g.id}>{g.title}</option>))}
                  </select>
                </div>
                <div className="space-y-2"><Label>Target (number)</Label><Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={submitting || !form.title}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </HrShell>
    </DashboardShell>
  )
}