'use client'

import { useState, useEffect, use, useMemo, useCallback } from 'react'
import { Search, UserPlus, Mail, Phone, Archive, Building2, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { HrShell } from '@/components/hr/hr-shell'
import { useOrganizationStore } from '@/lib/store'
import { getEmployees, createEmployee, updateEmployee, archiveEmployee, getDepartments } from '@/lib/actions/hr'
import { EmployeeDialog } from './employee-dialog'

export default function EmployeesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params)
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization)

  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const load = useCallback(async () => {
    if (!currentOrganization?.id) return
    const [emps, deps] = await Promise.all([
      getEmployees(currentOrganization.id).catch(() => []),
      getDepartments(currentOrganization.id).catch(() => []),
    ])
    setEmployees(emps)
    setDepartments(deps)
    setLoading(false)
  }, [currentOrganization?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q || e.first_name?.toLowerCase().includes(q) || e.last_name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.title?.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [employees, search, statusFilter])

  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name || '—'

  const handleSave = async (input: any) => {
    if (!currentOrganization?.id) return
    if (editing) {
      await updateEmployee(editing.id, input)
    } else {
      await createEmployee({ ...input, organizationId: currentOrganization.id })
    }
    setDialogOpen(false)
    setEditing(null)
    load()
  }

  const handleArchive = async (id: string) => {
    if (!currentOrganization?.id) return
    await archiveEmployee(id, currentOrganization.id)
    load()
  }

  if (loading) {
    return (
      <DashboardShell orgSlug={orgSlug}>
        <HrShell orgSlug={orgSlug}>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))}
            </div>
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
              <h1 className="text-2xl font-semibold">Employees</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage your workforce</p>
            </div>
            <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Employee
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="probation">Probation</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500">
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Department</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Hired</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium">
                              {e.first_name?.[0]}{e.last_name?.[0]}
                            </div>
                            <div>
                              <p className="font-medium">{e.first_name} {e.last_name}</p>
                              <p className="text-xs text-zinc-500 flex items-center gap-1"><Mail className="h-3 w-3" />{e.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{e.title || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                            <Building2 className="h-3.5 w-3.5" /> {deptName(e.department_id)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={e.status === 'active' ? 'default' : 'outline'}>{e.status}</Badge>
                        </td>
                        <td className="px-4 py-3">{e.hire_date ? e.hire_date : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setEditing(e); setDialogOpen(true) }}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleArchive(e.id)}>
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">No employees found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <EmployeeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          editing={editing}
          departments={departments}
        />
      </HrShell>
    </DashboardShell>
  )
}