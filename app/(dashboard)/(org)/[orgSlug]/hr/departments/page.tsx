'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { Plus, Pencil, Trash2, Building2, Users, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getEmployees } from '@/lib/actions/hr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function DepartmentsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [departments, setDepartments] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', managerId: '' })

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [deps, emps] = await Promise.all([
      getDepartments(currentOrganization.id).catch(() => []),
      getEmployees(currentOrganization.id).catch(() => []),
    ])
    setDepartments(deps)
    setEmployees(emps.filter((e: any) => e.employment_status !== 'terminated'))
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', managerId: '' })
    setDialogOpen(true)
  }

  const openEdit = (d: any) => {
    setEditing(d)
    setForm({
      name: d.name,
      slug: d.slug,
      description: d.description || '',
      managerId: d.manager_id || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!currentOrganization?.id || !form.name) return
    setSubmitting(true)
    try {
      if (editing) {
        await updateDepartment(editing.id, { name: form.name, description: form.description || null, managerId: form.managerId || null })
      } else {
        await createDepartment({ name: form.name, slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: form.description || null, managerId: form.managerId || null, organizationId: currentOrganization.id })
      }
      setDialogOpen(false)
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteDepartment(deleteId)
    setDeleteId(null)
    load()
  }

  const employeeName = (id: string | null) => {
    if (!id) return null
    const e = employees.find((e) => e.id === id)
    return e ? `${e.first_name} ${e.last_name}` : null
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-4 grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
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
              <h1 className="text-2xl font-semibold">Departments</h1>
              <p className="text-sm text-zinc-500 mt-1">Organize your workforce</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add Department
            </Button>
          </div>

          {departments.length === 0 ? (
            <EmptyState
              title="No departments yet"
              description="Create departments to organize your employees."
              action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Department</Button>}
            />
          ) : (
            <div className="grid gap-4 grid-cols-3">
              {departments.map((d) => {
                const managerName = employeeName(d.manager_id)
                return (
                  <Card key={d.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                          <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <h3 className="mt-3 font-semibold">{d.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{d.slug}</p>
                      {d.description && <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{d.description}</p>}
                      <div className="flex items-center gap-3 mt-4 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {employees.filter((e) => e.department_id === d.id).length} employees</span>
                        {managerName && <span className="inline-flex items-center gap-1">Manager: {managerName}</span>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Department' : 'Add Department'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              {!editing && (
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="engineering" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Department head</Label>
                <select
                  value={form.managerId}
                  onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="">None</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={submitting || !form.name}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? 'Save changes' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete department?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the department. Employees in it will be unassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </HrShell>
    </DashboardShell>
  )
}