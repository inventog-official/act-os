'use server'

import { db } from '@/db'
import { hrOnboardingTemplates, hrOnboardingAssignments, hrOnboardingTasks, hrOffboardingRequests } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, logHrActivity, guardHrPermission } from './utils'
import { hrOnboardingTemplateSchema, hrOnboardingAssignmentSchema } from '@/lib/utils/validations'

export async function getOnboardingTemplates(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_onboarding_templates')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  return (data || []) as any[]
}

export async function createOnboardingTemplate(input: { name: string; description?: string | null; steps?: unknown[]; organizationId: string }) {
  const parsed = hrOnboardingTemplateSchema.parse({ name: input.name, description: input.description ?? undefined, steps: input.steps })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:onboarding:manage')

  const [data] = await db.insert(hrOnboardingTemplates).values({
    name: parsed.name,
    description: parsed.description || null,
    steps: parsed.steps ? JSON.stringify(parsed.steps) : '[]',
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_onboarding_templates', resourceId: (data as any).id })
  return data
}

export async function deleteOnboardingTemplate(id: string) {
  await db.update(hrOnboardingTemplates).set({ deletedAt: new Date() }).where(eq(hrOnboardingTemplates.id, id))
  return { success: true }
}

export async function getOnboardingAssignments(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_onboarding_assignments')
    .select('*, employee:employee_id(first_name, last_name), template:template_id(name), tasks:hr_onboarding_tasks(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export async function createOnboardingAssignment(input: { employeeId: string; templateId?: string | null; organizationId: string }) {
  const parsed = hrOnboardingAssignmentSchema.parse({ employee_id: input.employeeId, template_id: input.templateId })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:onboarding:manage')

  const [data] = await db.insert(hrOnboardingAssignments).values({
    employeeId: parsed.employee_id,
    templateId: parsed.template_id ?? null,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_onboarding_assignments', resourceId: (data as any).id })
  return data
}

export async function updateOnboardingAssignmentStatus(id: string, status: 'not_started' | 'in_progress' | 'completed' | 'cancelled', organizationId: string) {
  await db.update(hrOnboardingAssignments)
    .set({
      status,
      startedAt: status === 'in_progress' ? new Date() : undefined,
      completedAt: status === 'completed' ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(hrOnboardingAssignments.id, id))
  await logHrActivity({ organizationId, action: `onboarding_${status}`, resource: 'hr_onboarding_assignments', resourceId: id })
  return { success: true }
}

export async function deleteOnboardingAssignment(id: string) {
  await db.update(hrOnboardingAssignments).set({ deletedAt: new Date() }).where(eq(hrOnboardingAssignments.id, id))
  return { success: true }
}

export async function addOnboardingTask(input: { assignmentId: string; title: string; description?: string | null; assignedTo?: string | null; dueDate?: string | null; organizationId: string }) {
  const [data] = await db.insert(hrOnboardingTasks).values({
    assignmentId: input.assignmentId,
    title: input.title,
    description: input.description ?? null,
    assignedTo: input.assignedTo ?? null,
    dueDate: input.dueDate || null,
    organizationId: input.organizationId,
  } as any).returning()
  return data
}

export async function updateOnboardingTask(id: string, input: Record<string, unknown>) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  if (input.status !== undefined) values.status = input.status
  if (input.status === 'completed') values.completedAt = new Date()
  if (input.title !== undefined) values.title = input.title
  if (input.description !== undefined) values.description = input.description ?? null
  if (input.dueDate !== undefined) values.dueDate = input.dueDate ? new Date(input.dueDate as string) : null
  await db.update(hrOnboardingTasks).set(values).where(eq(hrOnboardingTasks.id, id))
  return { success: true }
}

export async function deleteOnboardingTask(id: string) {
  await db.update(hrOnboardingTasks).set({ deletedAt: new Date() }).where(eq(hrOnboardingTasks.id, id))
  return { success: true }
}

export async function getOffboardingRequests(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_offboarding_requests')
    .select('*, employee:employee_id(first_name, last_name, job_title)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export async function createOffboardingRequest(input: {
  employeeId: string
  exitDate?: string | null
  reason?: string | null
  noticePeriodDays?: number
  status?: string
  organizationId: string
}) {
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:offboarding:manage')

  const [data] = await db.insert(hrOffboardingRequests).values({
    employeeId: input.employeeId,
    exitDate: input.exitDate || null,
    reason: input.reason ?? null,
    noticePeriodDays: input.noticePeriodDays ?? 0,
    status: input.status ?? 'requested',
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_offboarding_requests', resourceId: (data as any).id })
  return data
}
export async function updateOffboardingRequest(id: string, input: Record<string, unknown>) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  const fieldMap: Record<string, string> = {
    exitDate: 'exitDate', reason: 'reason', noticePeriodDays: 'noticePeriodDays', status: 'status',
    managerReview: 'managerReview', assetReturned: 'assetReturned', accessRevoked: 'accessRevoked',
    finalDocuments: 'finalDocuments', exitInterviewNotes: 'exitInterviewNotes',
  }
  for (const [key, value] of Object.entries(input)) {
    if (key in fieldMap) values[key] = value ?? null
  }
  await db.update(hrOffboardingRequests).set(values).where(eq(hrOffboardingRequests.id, id))
  return { success: true }
}

export async function deleteOffboardingRequest(id: string) {
  await db.update(hrOffboardingRequests).set({ deletedAt: new Date() }).where(eq(hrOffboardingRequests.id, id))
  return { success: true }
}