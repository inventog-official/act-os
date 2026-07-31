'use server'

import { db } from '@/db'
import { hrJobOpenings, hrCandidates, hrInterviews, hrOffers } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, logHrActivity, guardHrPermission } from './utils'
import { hrJobOpeningSchema, hrCandidateSchema, hrInterviewSchema, hrOfferSchema } from '@/lib/utils/validations'

export async function getJobOpenings(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_job_openings')
    .select('*, department:department_id(*), candidates:hr_candidates(id, stage)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export async function createJobOpening(input: {
  title: string
  departmentId?: string | null
  location?: string | null
  employmentType?: string
  salaryMin?: number | null
  salaryMax?: number | null
  currency?: string
  requiredSkills?: string[]
  description?: string | null
  status?: string
  organizationId: string
}) {
  const parsed = hrJobOpeningSchema.parse({
    title: input.title,
    department_id: input.departmentId,
    location: input.location ?? undefined,
    employment_type: input.employmentType,
    salary_min: input.salaryMin,
    salary_max: input.salaryMax,
    currency: input.currency,
    required_skills: input.requiredSkills,
    description: input.description ?? undefined,
    status: input.status,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:recruitment:manage')

  const [data] = await db.insert(hrJobOpenings).values({
    title: parsed.title,
    departmentId: parsed.department_id ?? null,
    location: parsed.location || null,
    employmentType: parsed.employment_type,
    salaryMin: parsed.salary_min?.toString() ?? null,
    salaryMax: parsed.salary_max?.toString() ?? null,
    currency: parsed.currency,
    requiredSkills: parsed.required_skills ?? [],
    description: parsed.description || null,
    status: parsed.status,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_job_openings', resourceId: (data as any).id, metadata: { title: parsed.title } })
  return data
}

export async function updateJobOpening(id: string, input: Record<string, unknown>) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  const fieldMap: Record<string, string> = {
    title: 'title', departmentId: 'departmentId', location: 'location', employmentType: 'employmentType',
    salaryMin: 'salaryMin', salaryMax: 'salaryMax', currency: 'currency', requiredSkills: 'requiredSkills',
    description: 'description', status: 'status', hiringManagerId: 'hiringManagerId',
  }
  for (const [key, value] of Object.entries(input)) {
    if (key in fieldMap) values[key] = value ?? null
  }
  await db.update(hrJobOpenings).set(values).where(and(eq(hrJobOpenings.id, id), isNull(hrJobOpenings.deletedAt)))
  return { success: true }
}

export async function deleteJobOpening(id: string) {
  await db.update(hrJobOpenings).set({ deletedAt: new Date() }).where(eq(hrJobOpenings.id, id))
  return { success: true }
}

export async function getCandidates(organizationId: string, jobOpeningId?: string) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('hr_candidates')
    .select('*, job:job_opening_id(title, department_id), interviews:hr_interviews(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (jobOpeningId) query = query.eq('job_opening_id', jobOpeningId)
  const { data } = await query
  return (data || []) as any[]
}

export async function createCandidate(input: {
  jobOpeningId?: string | null
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  skills?: string[]
  experienceYears?: number
  source?: string | null
  stage?: string
  notes?: string | null
  organizationId: string
}) {
  const parsed = hrCandidateSchema.parse({
    job_opening_id: input.jobOpeningId,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email ?? undefined,
    phone: input.phone ?? undefined,
    skills: input.skills,
    experience_years: input.experienceYears,
    source: input.source ?? undefined,
    stage: input.stage,
    notes: input.notes ?? undefined,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:recruitment:manage')

  const [data] = await db.insert(hrCandidates).values({
    jobOpeningId: parsed.job_opening_id ?? null,
    firstName: parsed.first_name,
    lastName: parsed.last_name,
    email: parsed.email || null,
    phone: parsed.phone || null,
    skills: parsed.skills ?? [],
    experienceYears: parsed.experience_years?.toString() ?? '0',
    source: parsed.source || null,
    stage: parsed.stage,
    notes: parsed.notes || null,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_candidates', resourceId: (data as any).id, metadata: { name: `${parsed.first_name} ${parsed.last_name}` } })
  return data
}

export async function updateCandidate(id: string, input: Record<string, unknown>) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  const fieldMap: Record<string, string> = {
    jobOpeningId: 'jobOpeningId', firstName: 'firstName', lastName: 'lastName', email: 'email',
    phone: 'phone', skills: 'skills', experienceYears: 'experienceYears', source: 'source',
    stage: 'stage', notes: 'notes',
  }
  for (const [key, value] of Object.entries(input)) {
    if (key in fieldMap) values[key] = value ?? null
  }
  await db.update(hrCandidates).set(values).where(and(eq(hrCandidates.id, id), isNull(hrCandidates.deletedAt)))
  return { success: true }
}

export async function deleteCandidate(id: string) {
  await db.update(hrCandidates).set({ deletedAt: new Date() }).where(eq(hrCandidates.id, id))
  return { success: true }
}

export async function getInterviews(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_interviews')
    .select('*, candidate:candidate_id(first_name, last_name, email, job_opening_id), job:job_opening_id(title)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
  return (data || []) as any[]
}

export async function createInterview(input: {
  candidateId: string
  jobOpeningId?: string | null
  interviewerIds?: string[]
  interviewType?: string
  scheduledAt?: string | null
  durationMinutes?: number
  location?: string | null
  meetingUrl?: string | null
  status?: string
  organizationId: string
}) {
  const parsed = hrInterviewSchema.parse({
    candidate_id: input.candidateId,
    job_opening_id: input.jobOpeningId,
    interviewer_ids: input.interviewerIds,
    interview_type: input.interviewType,
    scheduled_at: input.scheduledAt,
    duration_minutes: input.durationMinutes,
    location: input.location ?? undefined,
    meeting_url: input.meetingUrl ?? undefined,
    status: input.status,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:recruitment:manage')

  const [data] = await db.insert(hrInterviews).values({
    candidateId: parsed.candidate_id,
    jobOpeningId: parsed.job_opening_id ?? null,
    interviewerIds: parsed.interviewer_ids ?? [],
    interviewType: parsed.interview_type,
    scheduledAt: parsed.scheduled_at ? new Date(parsed.scheduled_at) : null,
    durationMinutes: parsed.duration_minutes ?? 60,
    location: parsed.location || null,
    meetingUrl: parsed.meeting_url || null,
    status: parsed.status,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_interviews', resourceId: (data as any).id })
  return data
}

export async function updateInterview(id: string, input: Record<string, unknown>) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  const fieldMap: Record<string, string> = {
    scheduledAt: 'scheduledAt', durationMinutes: 'durationMinutes', location: 'location',
    meetingUrl: 'meetingUrl', notes: 'notes', feedback: 'feedback', score: 'score', status: 'status',
    interviewerIds: 'interviewerIds', interviewType: 'interviewType',
  }
  for (const [key, value] of Object.entries(input)) {
    if (key in fieldMap) values[key] = value ?? null
  }
  await db.update(hrInterviews).set(values).where(and(eq(hrInterviews.id, id), isNull(hrInterviews.deletedAt)))
  return { success: true }
}

export async function deleteInterview(id: string) {
  await db.update(hrInterviews).set({ deletedAt: new Date() }).where(eq(hrInterviews.id, id))
  return { success: true }
}

export async function getOffers(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_offers')
    .select('*, candidate:candidate_id(first_name, last_name, email), job:job_opening_id(title)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export async function createOffer(input: {
  candidateId: string
  jobOpeningId?: string | null
  position: string
  salary?: number | null
  currency?: string
  joiningDate?: string | null
  expiryDate?: string | null
  notes?: string | null
  status?: string
  organizationId: string
}) {
  const parsed = hrOfferSchema.parse({
    candidate_id: input.candidateId,
    job_opening_id: input.jobOpeningId,
    position: input.position,
    salary: input.salary,
    currency: input.currency,
    joining_date: input.joiningDate,
    expiry_date: input.expiryDate,
    notes: input.notes ?? undefined,
    status: input.status,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:offers:manage')

  const [data] = await db.insert(hrOffers).values({
    candidateId: parsed.candidate_id,
    jobOpeningId: parsed.job_opening_id ?? null,
    position: parsed.position,
    salary: parsed.salary?.toString() ?? null,
    currency: parsed.currency,
    joiningDate: parsed.joining_date || null,
    expiryDate: parsed.expiry_date || null,
    notes: parsed.notes || null,
    status: parsed.status,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_offers', resourceId: (data as any).id })
  return data
}

export async function updateOfferStatus(id: string, status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired', organizationId: string) {
  const user = await getCurrentUser()
  await guardHrPermission(organizationId, 'hr:offers:manage')
  await db.update(hrOffers).set({ status, updatedAt: new Date() }).where(eq(hrOffers.id, id))
  await logHrActivity({ organizationId, action: `offer_${status}`, resource: 'hr_offers', resourceId: id })
  return { success: true }
}

export async function deleteOffer(id: string) {
  await db.update(hrOffers).set({ deletedAt: new Date() }).where(eq(hrOffers.id, id))
  return { success: true }
}