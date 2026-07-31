'use server'

import { db } from '@/db'
import { hrDepartments, hrEmployees, hrEmployeeSkills, hrCompensation } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, logHrActivity, guardHrPermission } from './utils'
import { hrEmployeeSchema, hrDepartmentSchema } from '@/lib/utils/validations'

export async function getDepartments(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_departments')
    .select('*, manager:manager_id(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  return (data || []) as any[]
}

export async function createDepartment(input: { name: string; slug: string; description?: string | null; managerId?: string | null; organizationId: string }) {
  const parsed = hrDepartmentSchema.parse({ name: input.name, slug: input.slug, description: input.description ?? undefined, manager_id: input.managerId })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:departments:manage')

  const [data] = await db.insert(hrDepartments).values({
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description || null,
    managerId: parsed.manager_id ?? null,
    organizationId: input.organizationId,
    createdBy: user.id,
  }).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_departments', resourceId: (data as any).id, metadata: { name: parsed.name } })
  return data
}

export async function updateDepartment(id: string, input: { name?: string; description?: string | null; managerId?: string | null }) {
  const user = await getCurrentUser()
  const values: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) values.name = input.name
  if (input.description !== undefined) values.description = input.description ?? null
  if (input.managerId !== undefined) values.managerId = input.managerId

  await db.update(hrDepartments).set(values).where(and(eq(hrDepartments.id, id), isNull(hrDepartments.deletedAt)))
  return { success: true, updatedBy: user.id }
}

export async function deleteDepartment(id: string) {
  await db.update(hrDepartments).set({ deletedAt: new Date() }).where(eq(hrDepartments.id, id))
  return { success: true }
}

export async function getEmployees(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_employees')
    .select('*, department:department_id(*), team:team_id(*), manager:manager_id(first_name, last_name, id)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('last_name')
  return (data || []) as any[]
}

export async function getEmployeeById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_employees')
    .select('*, department:department_id(*), team:team_id(*), manager:manager_id(first_name, last_name, id), skills:hr_employee_skills(*), compensation:hr_compensation(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data as any
}

export async function createEmployee(input: {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  departmentId?: string | null
  teamId?: string | null
  jobTitle?: string | null
  managerId?: string | null
  employmentType?: string
  employmentStatus?: string
  joiningDate?: string | null
  workMode?: string
  employeeCode?: string | null
  organizationId: string
}) {
  const parsed = hrEmployeeSchema.parse({
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email ?? undefined,
    phone: input.phone ?? undefined,
    department_id: input.departmentId,
    team_id: input.teamId,
    job_title: input.jobTitle ?? undefined,
    manager_id: input.managerId,
    employment_type: input.employmentType,
    employment_status: input.employmentStatus,
    joining_date: input.joiningDate,
    work_mode: input.workMode,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:employees:create')

  const [data] = await db.insert(hrEmployees).values({
    firstName: parsed.first_name,
    lastName: parsed.last_name,
    email: parsed.email || null,
    phone: parsed.phone || null,
    employeeCode: input.employeeCode || null,
    departmentId: parsed.department_id ?? null,
    teamId: parsed.team_id ?? null,
    jobTitle: parsed.job_title || null,
    managerId: parsed.manager_id ?? null,
    employmentType: parsed.employment_type,
    employmentStatus: parsed.employment_status,
    joiningDate: parsed.joining_date || null,
    workMode: parsed.work_mode,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_employees', resourceId: (data as any).id, metadata: { name: `${parsed.first_name} ${parsed.last_name}` } })
  return data
}

export async function updateEmployee(id: string, input: Record<string, unknown>) {
  const user = await getCurrentUser()
  const values: Record<string, unknown> = { updatedAt: new Date(), updatedBy: user.id }
  const fieldMap: Record<string, string> = {
    firstName: 'firstName', lastName: 'lastName', email: 'email', phone: 'phone',
    departmentId: 'departmentId', teamId: 'teamId', jobTitle: 'jobTitle',
    managerId: 'managerId', employmentType: 'employmentType', employmentStatus: 'employmentStatus',
    joiningDate: 'joiningDate', exitDate: 'exitDate', location: 'location',
    workMode: 'workMode', workScheduleId: 'workScheduleId', city: 'city', state: 'state',
    country: 'country', postalCode: 'postalCode', address: 'address', gender: 'gender',
  }
  for (const [key, value] of Object.entries(input)) {
    if (key in fieldMap) {
      const dateFields = ['joiningDate', 'exitDate']
      values[key] = dateFields.includes(key) && value ? (value instanceof Date ? value.toISOString().slice(0, 10) : String(value)) : (value ?? null)
    }
  }
  await db.update(hrEmployees).set(values).where(and(eq(hrEmployees.id, id), isNull(hrEmployees.deletedAt)))
  return { success: true, updatedBy: user.id }
}

export async function archiveEmployee(id: string, organizationId: string) {
  await guardHrPermission(organizationId, 'hr:employees:update')
  const user = await getCurrentUser()
  await db.update(hrEmployees).set({ employmentStatus: 'terminated', exitDate: new Date().toISOString().slice(0, 10), updatedAt: new Date(), updatedBy: user.id }).where(eq(hrEmployees.id, id))
  await logHrActivity({ organizationId, action: 'archive', resource: 'hr_employees', resourceId: id })
  return { success: true }
}

export async function getEmployeeSkills(employeeId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_employee_skills')
    .select('*')
    .eq('employee_id', employeeId)
    .order('skill')
  return (data || []) as any[]
}

export async function addEmployeeSkill(input: { employeeId: string; skill: string; level?: string; yearsExperience?: number; certification?: string | null; organizationId: string }) {
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:skills:manage')
  const [data] = await db.insert(hrEmployeeSkills).values({
    employeeId: input.employeeId,
    skill: input.skill,
    level: input.level ?? 'beginner',
    yearsExperience: input.yearsExperience?.toString() ?? '0',
    certification: input.certification ?? null,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()
  return data
}

export async function removeEmployeeSkill(id: string) {
  await db.delete(hrEmployeeSkills).where(eq(hrEmployeeSkills.id, id))
  return { success: true }
}

export async function getCompensation(organizationId: string) {
  await guardHrPermission(organizationId, 'hr:compensation:read')
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_compensation')
    .select('*, employee:employee_id(first_name, last_name, job_title)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
  return (data || []) as any[]
}

export async function setCompensation(input: { employeeId: string; baseSalary?: number | null; currency?: string; payCycle?: string; effectiveDate?: string | null; organizationId: string }) {
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:compensation:manage')
  const [data] = await db.insert(hrCompensation).values({
    employeeId: input.employeeId,
    baseSalary: input.baseSalary?.toString() ?? null,
    currency: input.currency ?? 'USD',
    payCycle: input.payCycle ?? 'monthly',
    effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
    organizationId: input.organizationId,
    createdBy: user.id,
    updatedBy: user.id,
  } as any).returning()
  await logHrActivity({ organizationId: input.organizationId, action: 'update', resource: 'hr_compensation', resourceId: input.employeeId })
  return data
}