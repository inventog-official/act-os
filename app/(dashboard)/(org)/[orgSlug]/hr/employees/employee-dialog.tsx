'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface EmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (input: any) => Promise<void>
  editing: any
  departments: any[]
}

const defaultForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  departmentId: '',
  jobTitle: '',
  employmentType: 'full_time',
  employmentStatus: 'active',
  joiningDate: new Date().toISOString().slice(0, 10),
  workMode: 'onsite',
  employeeCode: '',
}

export function EmployeeDialog({ open, onOpenChange, onSave, editing, departments }: EmployeeDialogProps) {
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              firstName: editing.first_name || '',
              lastName: editing.last_name || '',
              email: editing.email || '',
              phone: editing.phone || '',
              departmentId: editing.department_id || '',
              jobTitle: editing.job_title || '',
              employmentType: editing.employment_type || 'full_time',
              employmentStatus: editing.employment_status || 'active',
              joiningDate: editing.joining_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
              workMode: editing.work_mode || 'onsite',
              employeeCode: editing.employee_code || '',
            }
          : defaultForm
      )
    }
  }, [open, editing])

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName) return
    setSubmitting(true)
    try {
      await onSave({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        departmentId: form.departmentId || null,
        jobTitle: form.jobTitle || null,
        employmentType: form.employmentType,
        employmentStatus: form.employmentStatus,
        joiningDate: form.joiningDate || null,
        workMode: form.workMode,
        employeeCode: form.employeeCode || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Last name *</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.departmentId || undefined} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Job title</Label>
              <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employment type</Label>
              <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.employmentStatus} onValueChange={(v) => setForm({ ...form, employmentStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="on_leave">On leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Joining date</Label>
              <Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Work mode</Label>
              <Select value={form.workMode} onValueChange={(v) => setForm({ ...form, workMode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Employee code</Label>
            <Input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="EMP-001" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.firstName || !form.lastName}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editing ? 'Save changes' : 'Add employee'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}