import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const otpSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const organizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(500).optional(),
})

export const workspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(500).optional(),
})

export const teamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(500).optional(),
  workspace_id: z.string().uuid().optional().nullable(),
})

export const projectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  client_name: z.string().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  is_public: z.boolean().optional(),
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional().nullable(),
  estimated_hours: z.number().min(0).optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  is_recurring: z.boolean().optional(),
  recurring_config: z.object({
    interval: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    count: z.number().int().positive().optional(),
    end_date: z.string().optional(),
  }).optional().nullable(),
})

export const milestoneSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  due_date: z.string().optional().nullable(),
})

export const sprintSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  goal: z.string().optional().nullable(),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).default('planning'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
})

export const timeEntrySchema = z.object({
  task_id: z.string().uuid(),
  description: z.string().optional().nullable(),
  start_time: z.string(),
  end_time: z.string().optional().nullable(),
  duration_minutes: z.number().int().min(0).optional().nullable(),
  billable: z.boolean().default(true),
  billable_rate: z.number().min(0).optional().nullable(),
})

export const taskCommentSchema = z.object({
  task_id: z.string().uuid(),
  content: z.string().min(1, 'Comment cannot be empty'),
  mentions: z.array(z.string().uuid()).optional(),
})

export const taskChecklistSchema = z.object({
  task_id: z.string().uuid(),
  text: z.string().min(1, 'Item text is required'),
  sort_order: z.number().int().min(0).optional(),
})

export const taskLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required'),
  color: z.string().default('#6b7280'),
  project_id: z.string().uuid().optional().nullable(),
})

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  avatar_url: z.string().optional().nullable(),
})

export const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expires_at: z.string().optional().nullable(),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
})

export const crmLeadSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  job_title: z.string().optional().or(z.literal('')),
  company_id: z.string().uuid().optional().nullable(),
  company_name: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  lead_source: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'disqualified']).default('new'),
  pipeline_stage_id: z.string().uuid().optional().nullable(),
  estimated_deal_value: z.number().positive().optional().nullable(),
  expected_close_date: z.string().optional().nullable(),
  description: z.string().max(2000).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const crmCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional().or(z.literal('')),
  employee_count: z.number().int().positive().optional().nullable(),
  revenue: z.number().positive().optional().nullable(),
  address_line1: z.string().optional().or(z.literal('')),
  address_line2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zip: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  gst_number: z.string().optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const crmContactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  job_title: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  company_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const crmDealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  deal_value: z.number().min(0).default(0),
  probability: z.number().min(0).max(100).default(0),
  pipeline_id: z.string().uuid(),
  pipeline_stage_id: z.string().uuid(),
  lead_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  expected_close_date: z.string().optional().nullable(),
  notes: z.string().optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const crmActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'task', 'note', 'sms', 'whatsapp']),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional().or(z.literal('')),
  activity_date: z.string().optional(),
  duration_minutes: z.number().int().positive().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const crmNoteSchema = z.object({
  title: z.string().optional().or(z.literal('')),
  content: z.string().optional().or(z.literal('')),
  is_pinned: z.boolean().default(false),
  is_private: z.boolean().default(false),
  lead_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
})

export const crmTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional().nullable(),
  reminder_at: z.string().optional().nullable(),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type OtpInput = z.infer<typeof otpSchema>
export type OrganizationInput = z.infer<typeof organizationSchema>
export type WorkspaceInput = z.infer<typeof workspaceSchema>
export type TeamInput = z.infer<typeof teamSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type TaskInput = z.infer<typeof taskSchema>
export type MilestoneInput = z.infer<typeof milestoneSchema>
export type SprintInput = z.infer<typeof sprintSchema>
export type TimeEntryInput = z.infer<typeof timeEntrySchema>
export type TaskCommentInput = z.infer<typeof taskCommentSchema>
export type TaskChecklistInput = z.infer<typeof taskChecklistSchema>
export type TaskLabelInput = z.infer<typeof taskLabelSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ApiKeyInput = z.infer<typeof apiKeySchema>
export type CrmLeadInput = z.infer<typeof crmLeadSchema>
export type CrmCompanyInput = z.infer<typeof crmCompanySchema>
export type CrmContactInput = z.infer<typeof crmContactSchema>
export type CrmDealInput = z.infer<typeof crmDealSchema>
export type CrmActivityInput = z.infer<typeof crmActivitySchema>
export type CrmNoteInput = z.infer<typeof crmNoteSchema>
export type CrmTaskInput = z.infer<typeof crmTaskSchema>

export const hrDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  description: z.string().optional().or(z.literal('')),
  manager_id: z.string().uuid().optional().nullable(),
})

export const hrEmployeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  department_id: z.string().uuid().optional().nullable(),
  team_id: z.string().uuid().optional().nullable(),
  job_title: z.string().optional().or(z.literal('')),
  manager_id: z.string().uuid().optional().nullable(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern', 'freelance']).default('full_time'),
  employment_status: z.enum(['active', 'on_leave', 'probation', 'terminated', 'archived']).default('active'),
  joining_date: z.string().optional().nullable(),
  exit_date: z.string().optional().nullable(),
  location: z.string().optional().or(z.literal('')),
  work_schedule_id: z.string().uuid().optional().nullable(),
  work_mode: z.enum(['office', 'remote', 'hybrid']).default('office'),
})

export const hrWorkScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional().or(z.literal('')),
  working_days: z.array(z.string()).default(['mon', 'tue', 'wed', 'thu', 'fri']),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  weekly_hours: z.number().min(0).max(168).optional(),
  shift: z.enum(['day', 'evening', 'night', 'custom']).default('day'),
  flexible: z.boolean().default(false),
  work_mode: z.enum(['office', 'remote', 'hybrid']).default('office'),
})

export const hrSkillSchema = z.object({
  employee_id: z.string().uuid(),
  skill: z.string().min(1, 'Skill name is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('beginner'),
  years_experience: z.number().min(0).optional(),
  certification: z.string().optional().or(z.literal('')),
})

export const hrAttendanceSchema = z.object({
  employee_id: z.string().uuid(),
  attendance_date: z.string(),
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday']).default('present'),
  working_minutes: z.number().int().min(0).optional(),
  overtime_minutes: z.number().int().min(0).optional(),
  late_minutes: z.number().int().min(0).optional(),
  early_departure_minutes: z.number().int().min(0).optional(),
  notes: z.string().optional().or(z.literal('')),
})

export const hrHolidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  holiday_date: z.string(),
  holiday_type: z.enum(['public', 'company', 'custom', 'department']).default('public'),
  department_id: z.string().uuid().optional().nullable(),
})

export const hrLeaveTypeSchema = z.object({
  name: z.string().min(1, 'Leave type name is required'),
  code: z.string().min(1, 'Code is required'),
  color: z.string().default('#3b82f6'),
  days_per_year: z.number().min(0).optional(),
  carry_over: z.number().min(0).optional(),
  requires_approval: z.boolean().default(true),
})

export const hrLeaveRequestSchema = z.object({
  employee_id: z.string().uuid().optional().nullable(),
  leave_type_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional().or(z.literal('')),
}).refine(d => !d.start_date || !d.end_date || d.end_date >= d.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
})

export const hrJobOpeningSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  department_id: z.string().uuid().optional().nullable(),
  location: z.string().optional().or(z.literal('')),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern', 'freelance']).default('full_time'),
  salary_min: z.number().min(0).optional().nullable(),
  salary_max: z.number().min(0).optional().nullable(),
  currency: z.string().default('USD'),
  required_skills: z.array(z.string()).optional(),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['draft', 'open', 'on_hold', 'closed', 'filled']).default('draft'),
})

export const hrCandidateSchema = z.object({
  job_opening_id: z.string().uuid().optional().nullable(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  experience_years: z.number().min(0).optional(),
  source: z.string().optional().or(z.literal('')),
  stage: z.enum(['applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']).default('applied'),
  notes: z.string().optional().or(z.literal('')),
})

export const hrInterviewSchema = z.object({
  candidate_id: z.string().uuid(),
  job_opening_id: z.string().uuid().optional().nullable(),
  interviewer_ids: z.array(z.string().uuid()).optional(),
  interview_type: z.enum(['phone', 'video', 'technical', 'hr', 'final']).default('video'),
  scheduled_at: z.string().optional().nullable(),
  duration_minutes: z.number().int().positive().optional(),
  location: z.string().optional().or(z.literal('')),
  meeting_url: z.string().optional().or(z.literal('')),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).default('scheduled'),
})

export const hrOfferSchema = z.object({
  candidate_id: z.string().uuid(),
  job_opening_id: z.string().uuid().optional().nullable(),
  position: z.string().min(1, 'Position is required'),
  salary: z.number().min(0).optional().nullable(),
  currency: z.string().default('USD'),
  joining_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).default('draft'),
})

export const hrOnboardingTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional().or(z.literal('')),
  steps: z.array(z.object({ title: z.string(), description: z.string().optional() })).optional(),
})

export const hrOnboardingAssignmentSchema = z.object({
  employee_id: z.string().uuid(),
  template_id: z.string().uuid().optional().nullable(),
})

export const hrOffboardingRequestSchema = z.object({
  employee_id: z.string().uuid(),
  exit_date: z.string().optional().nullable(),
  reason: z.string().optional().or(z.literal('')),
  notice_period_days: z.number().int().min(0).optional(),
  status: z.enum(['requested', 'in_review', 'approved', 'completed', 'cancelled']).default('requested'),
})

export const hrPerformanceCycleSchema = z.object({
  name: z.string().min(1, 'Cycle name is required'),
  period_type: z.enum(['monthly', 'quarterly', 'annual']).default('quarterly'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  status: z.enum(['planned', 'active', 'completed']).default('planned'),
})

export const hrPerformanceReviewSchema = z.object({
  employee_id: z.string().uuid(),
  cycle_id: z.string().uuid(),
  reviewer_id: z.string().uuid().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  goals_achieved: z.string().optional().or(z.literal('')),
  strengths: z.string().optional().or(z.literal('')),
  improvements: z.string().optional().or(z.literal('')),
  overall_feedback: z.string().optional().or(z.literal('')),
  development_plan: z.string().optional().or(z.literal('')),
  status: z.enum(['draft', 'submitted', 'acknowledged', 'completed']).default('draft'),
})

export const hrGoalSchema = z.object({
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional().or(z.literal('')),
  goal_level: z.enum(['company', 'department', 'team', 'employee']).default('employee'),
  parent_goal_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  employee_id: z.string().uuid().optional().nullable(),
  target: z.number().min(0).optional().nullable(),
  current_value: z.number().min(0).optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
  deadline: z.string().optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).default('not_started'),
})

export const hrCompensationSchema = z.object({
  employee_id: z.string().uuid(),
  base_salary: z.number().min(0).optional().nullable(),
  currency: z.string().default('USD'),
  pay_cycle: z.enum(['hourly', 'weekly', 'bi_weekly', 'monthly', 'annual']).default('monthly'),
  effective_date: z.string().optional().nullable(),
})

export type HrDepartmentInput = z.infer<typeof hrDepartmentSchema>
export type HrEmployeeInput = z.infer<typeof hrEmployeeSchema>
export type HrWorkScheduleInput = z.infer<typeof hrWorkScheduleSchema>
export type HrSkillInput = z.infer<typeof hrSkillSchema>
export type HrAttendanceInput = z.infer<typeof hrAttendanceSchema>
export type HrHolidayInput = z.infer<typeof hrHolidaySchema>
export type HrLeaveTypeInput = z.infer<typeof hrLeaveTypeSchema>
export type HrLeaveRequestInput = z.infer<typeof hrLeaveRequestSchema>
export type HrJobOpeningInput = z.infer<typeof hrJobOpeningSchema>
export type HrCandidateInput = z.infer<typeof hrCandidateSchema>
export type HrInterviewInput = z.infer<typeof hrInterviewSchema>
export type HrOfferInput = z.infer<typeof hrOfferSchema>
export type HrOnboardingTemplateInput = z.infer<typeof hrOnboardingTemplateSchema>
export type HrOnboardingAssignmentInput = z.infer<typeof hrOnboardingAssignmentSchema>
export type HrOffboardingRequestInput = z.infer<typeof hrOffboardingRequestSchema>
export type HrPerformanceCycleInput = z.infer<typeof hrPerformanceCycleSchema>
export type HrPerformanceReviewInput = z.infer<typeof hrPerformanceReviewSchema>
export type HrGoalInput = z.infer<typeof hrGoalSchema>
export type HrCompensationInput = z.infer<typeof hrCompensationSchema>

// ============================================================================
// PHASE 6 — DOCUMENTS & BUSINESS KNOWLEDGE
// ============================================================================

export const documentFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  parent_id: z.string().uuid().optional().nullable(),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
})

export const documentTypeSchema = z.enum([
  'document', 'sop', 'policy', 'contract', 'proposal', 'agreement', 'invoice',
  'project_document', 'hr_document', 'training', 'meeting_notes',
  'knowledge_article', 'internal', 'technical', 'custom',
])

export const documentStatusSchema = z.enum(['draft', 'review', 'approval', 'approved', 'published', 'archived'])

export const documentSchema = z.object({
  title: z.string().min(1, 'Document title is required').max(300),
  description: z.string().max(2000).optional().or(z.literal('')),
  document_type: documentTypeSchema.default('document'),
  content: z.unknown().optional(),
  content_text: z.string().optional().or(z.literal('')),
  mime_type: z.string().default('text/plain'),
  file_url: z.string().optional().or(z.literal('')),
  file_size: z.number().int().min(0).optional(),
  folder_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  status: documentStatusSchema.default('draft'),
  expiration_date: z.string().optional().nullable(),
  effective_date: z.string().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().max(50)).max(30).optional(),
})

export const documentUpdateContentSchema = z.object({
  content: z.unknown(),
  content_text: z.string().optional().or(z.literal('')),
  title: z.string().min(1).max(300).optional(),
})

export const documentShareSchema = z.object({
  document_id: z.string().uuid(),
  share_type: z.enum(['user', 'team', 'department', 'organization', 'link']),
  shared_with_user_id: z.string().uuid().optional().nullable(),
  shared_with_team_id: z.string().uuid().optional().nullable(),
  shared_with_department_id: z.string().uuid().optional().nullable(),
  permission: z.enum(['view', 'comment', 'edit', 'manage']).default('view'),
  expires_at: z.string().optional().nullable(),
})

export const documentCommentSchema = z.object({
  document_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().nullable(),
  content: z.string().min(1, 'Comment is required').max(10000),
  mentions: z.array(z.string().uuid()).optional(),
})

export const documentApprovalSchema = z.object({
  document_id: z.string().uuid(),
  assigned_to: z.string().uuid().optional().nullable(),
  comment: z.string().max(5000).optional().or(z.literal('')),
})

export const documentApprovalResponseSchema = z.object({
  approval_id: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'changes_requested']),
  comment: z.string().max(5000).optional().or(z.literal('')),
})

export const documentTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(300),
  description: z.string().max(1000).optional().or(z.literal('')),
  document_type: documentTypeSchema.default('document'),
  content: z.unknown().optional(),
  content_text: z.string().optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
})

export const knowledgeArticleSchema = z.object({
  title: z.string().min(1, 'Article title is required').max(300),
  summary: z.string().max(2000).optional().or(z.literal('')),
  content: z.unknown().optional(),
  content_text: z.string().optional().or(z.literal('')),
  category: z.enum(['Company', 'Sales', 'Operations', 'Finance', 'HR', 'Projects', 'Customer Support', 'Engineering', 'Policies', 'General']).default('General'),
  tags: z.array(z.string().max(50)).max(30).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  author_id: z.string().uuid().optional().nullable(),
})

export const documentSopSchema = z.object({
  title: z.string().min(1, 'SOP title is required').max(300),
  purpose: z.string().max(5000).optional().or(z.literal('')),
  scope: z.string().max(5000).optional().or(z.literal('')),
  department_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  steps: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional().or(z.literal('')),
    order: z.number().int().min(0),
  })).optional(),
  required_inputs: z.array(z.string()).optional(),
  expected_outputs: z.array(z.string()).optional(),
  related_document_ids: z.array(z.string().uuid()).optional(),
  version: z.number().int().min(1).optional(),
  approval_status: z.enum(['draft', 'review', 'approved', 'published', 'archived']).default('draft'),
})

export const documentPolicySchema = z.object({
  title: z.string().min(1, 'Policy title is required').max(300),
  policy_type: z.enum(['company', 'hr', 'finance', 'security', 'it', 'department']).default('company'),
  summary: z.string().max(2000).optional().or(z.literal('')),
  content: z.unknown().optional(),
  content_text: z.string().optional().or(z.literal('')),
  department_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  version: z.number().int().min(1).optional(),
  effective_date: z.string().optional().nullable(),
  expiration_date: z.string().optional().nullable(),
  approval_status: z.enum(['draft', 'review', 'approved', 'published', 'archived']).default('draft'),
})

export const documentContractSchema = z.object({
  name: z.string().min(1, 'Contract name is required').max(300),
  contract_number: z.string().max(100).optional().or(z.literal('')),
  customer_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  renewal_date: z.string().optional().nullable(),
  value: z.number().min(0).optional().nullable(),
  currency: z.string().max(10).default('USD'),
  status: z.enum(['draft', 'active', 'expiring', 'expired', 'renewed', 'cancelled', 'terminated']).default('draft'),
  owner_id: z.string().uuid().optional().nullable(),
  document_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(5000).optional().or(z.literal('')),
})

export const documentRelationshipSchema = z.object({
  document_id: z.string().uuid(),
  entity_type: z.enum(['lead', 'company', 'contact', 'deal', 'project', 'task', 'milestone', 'invoice', 'quotation', 'employee', 'department', 'template']),
  entity_id: z.string().uuid(),
  metadata: z.unknown().optional(),
})

export type DocumentFolderInput = z.infer<typeof documentFolderSchema>
export type DocumentInput = z.infer<typeof documentSchema>
export type DocumentShareInput = z.infer<typeof documentShareSchema>
export type DocumentCommentInput = z.infer<typeof documentCommentSchema>
export type DocumentApprovalInput = z.infer<typeof documentApprovalSchema>
export type DocumentApprovalResponseInput = z.infer<typeof documentApprovalResponseSchema>
export type DocumentTemplateInput = z.infer<typeof documentTemplateSchema>
export type KnowledgeArticleInput = z.infer<typeof knowledgeArticleSchema>
export type DocumentSopInput = z.infer<typeof documentSopSchema>
export type DocumentPolicyInput = z.infer<typeof documentPolicySchema>
export type DocumentContractInput = z.infer<typeof documentContractSchema>

// Inventory & Procurement
export const inventoryUnitSchema = z.object({
  name: z.string().min(1, 'Unit name is required'),
  symbol: z.string().min(1, 'Unit symbol is required'),
  unit_type: z.enum(['length', 'weight', 'volume', 'area', 'count', 'custom']).default('custom'),
})

export const inventoryWarehouseSchema = z.object({
  code: z.string().min(1, 'Warehouse code is required'),
  name: z.string().min(1, 'Warehouse name is required'),
  description: z.string().max(1000).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  workspace_id: z.string().uuid().optional().nullable(),
})

export const inventoryLocationSchema = z.object({
  code: z.string().min(1, 'Location code is required'),
  name: z.string().min(1, 'Location name is required'),
  description: z.string().max(1000).optional().or(z.literal('')),
  warehouse_id: z.string().uuid(),
  row_location: z.string().max(100).optional().or(z.literal('')),
  rack: z.string().max(100).optional().or(z.literal('')),
  bin: z.string().max(100).optional().or(z.literal('')),
  capacity: z.number().positive().optional().nullable(),
})

export const inventorySupplierSchema = z.object({
  company_id: z.string().uuid(),
  supplier_code: z.string().max(100).optional().or(z.literal('')),
  tax_number: z.string().max(100).optional().or(z.literal('')),
  payment_terms: z.string().max(200).optional().or(z.literal('')),
  currency: z.string().length(3).default('USD'),
  lead_time_days: z.number().int().min(0).default(0),
  contact_name: z.string().max(200).optional().or(z.literal('')),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  is_preferred: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export const inventorySupplierUpdateSchema = inventorySupplierSchema.partial().extend({
  company_id: z.string().uuid().optional(),
})

export const inventorySupplierProductSchema = z.object({
  supplier_id: z.string().uuid(),
  product_id: z.string().uuid(),
  supplier_sku: z.string().max(100).optional().or(z.literal('')),
  supplier_price: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  minimum_order_quantity: z.number().positive().default(1),
  lead_time_days: z.number().int().min(0).default(0),
  is_preferred: z.boolean().optional(),
})

export const inventoryStockMovementSchema = z.object({
  movement_type: z.enum([
    'receipt', 'issue', 'transfer', 'adjustment', 'return',
    'reservation', 'release', 'production', 'opening_balance',
    'damage', 'sale', 'consumption', 'correction', 'allocation',
  ]),
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  location_id: z.string().uuid().optional().nullable(),
  quantity: z.number().min(0.001, 'Quantity must be positive'),
  reference_type: z.string().max(50).optional().or(z.literal('')),
  reference_id: z.string().uuid().optional().nullable(),
  reason: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const inventoryTransferSchema = z.object({
  transfer_number: z.string().min(1, 'Transfer number is required').max(100),
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  source_location_id: z.string().uuid().optional().nullable(),
  destination_warehouse_id: z.string().uuid(),
  destination_location_id: z.string().uuid().optional().nullable(),
  quantity: z.number().min(0.001, 'Quantity must be positive'),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const inventoryStockAdjustmentSchema = z.object({
  adjustment_number: z.string().min(1, 'Adjustment number is required').max(100),
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  location_id: z.string().uuid().optional().nullable(),
  quantity_change: z.number().refine(v => v !== 0, { message: 'Quantity change cannot be zero' }),
  reason: z.string().min(1, 'Reason is required').max(200),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const inventoryReservationSchema = z.object({
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  quantity: z.number().min(0.001, 'Quantity must be positive'),
  reservation_type: z.enum(['project', 'order', 'customer', 'department', 'internal']).default('internal'),
  reference_type: z.string().max(50).optional().or(z.literal('')),
  reference_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const inventoryReorderRuleSchema = z.object({
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  reorder_point: z.number().min(0),
  reorder_quantity: z.number().min(0.001, 'Reorder quantity must be positive'),
  maximum_stock: z.number().positive().optional().nullable(),
  is_active: z.boolean().optional(),
})

export const inventoryPrSchema = z.object({
  request_number: z.string().min(1, 'Request number is required').max(100),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  department_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  currency: z.string().length(3).default('USD'),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const inventoryPrLineSchema = z.object({
  request_id: z.string().uuid(),
  product_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().min(0.001, 'Quantity must be positive'),
  unit_id: z.string().uuid().optional().nullable(),
  unit_price: z.number().min(0).default(0),
  preferred_supplier_id: z.string().uuid().optional().nullable(),
})

export const inventoryPoSchema = z.object({
  po_number: z.string().min(1, 'PO number is required').max(100),
  supplier_id: z.string().uuid(),
  project_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  currency: z.string().length(3).default('USD'),
  subtotal: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  shipping_cost: z.number().min(0).default(0),
  discount_amount: z.number().min(0).default(0),
  expected_delivery: z.string().optional().nullable(),
  terms: z.string().max(2000).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const inventoryPoLineSchema = z.object({
  purchase_order_id: z.string().uuid(),
  product_id: z.string().uuid(),
  description: z.string().max(500).optional().or(z.literal('')),
  quantity: z.number().min(0.001, 'Quantity must be positive'),
  unit_price: z.number().min(0).default(0),
})

export const inventoryGoodsReceiptSchema = z.object({
  receipt_number: z.string().min(1, 'Receipt number is required').max(100),
  po_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  location_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid(),
  received_date: z.string(),
  currency: z.string().length(3).default('USD'),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const inventoryReceiptLineSchema = z.object({
  receipt_id: z.string().uuid(),
  po_line_id: z.string().uuid().optional().nullable(),
  product_id: z.string().uuid(),
  quantity: z.number().min(0.001, 'Quantity must be positive'),
  unit_price: z.number().min(0).default(0),
  received_quantity: z.number().min(0).default(0),
  damaged_quantity: z.number().min(0).default(0),
  missing_quantity: z.number().min(0).default(0),
  rejected_quantity: z.number().min(0).default(0),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const inventoryReturnSchema = z.object({
  return_number: z.string().min(1, 'Return number is required').max(100),
  po_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required').max(500),
  currency: z.string().length(3).default('USD'),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const inventoryReturnLineSchema = z.object({
  return_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().min(0.001, 'Quantity must be positive'),
  unit_price: z.number().min(0).default(0),
  reason: z.string().max(500).optional().or(z.literal('')),
})

export const inventoryProjectAllocationSchema = z.object({
  project_id: z.string().uuid(),
  product_id: z.string().uuid(),
  required_quantity: z.number().min(0.001, 'Required quantity must be positive'),
  allocated_quantity: z.number().min(0).default(0),
  consumed_quantity: z.number().min(0).default(0),
})

export const inventoryAssetAssignmentSchema = z.object({
  product_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  serial_number: z.string().max(100).optional().or(z.literal('')),
  assigned_date: z.string(),
  return_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export type InventoryUnitInput = z.infer<typeof inventoryUnitSchema>
export type InventoryWarehouseInput = z.infer<typeof inventoryWarehouseSchema>
export type InventoryLocationInput = z.infer<typeof inventoryLocationSchema>
export type InventorySupplierInput = z.infer<typeof inventorySupplierSchema>
export type InventorySupplierProductInput = z.infer<typeof inventorySupplierProductSchema>
export type InventoryStockMovementInput = z.infer<typeof inventoryStockMovementSchema>
export type InventoryTransferInput = z.infer<typeof inventoryTransferSchema>
export type InventoryStockAdjustmentInput = z.infer<typeof inventoryStockAdjustmentSchema>
export type InventoryReservationInput = z.infer<typeof inventoryReservationSchema>
export type InventoryReorderRuleInput = z.infer<typeof inventoryReorderRuleSchema>
export type InventoryPrInput = z.infer<typeof inventoryPrSchema>
export type InventoryPrLineInput = z.infer<typeof inventoryPrLineSchema>
export type InventoryPoInput = z.infer<typeof inventoryPoSchema>
export type InventoryPoLineInput = z.infer<typeof inventoryPoLineSchema>
export type InventoryGoodsReceiptInput = z.infer<typeof inventoryGoodsReceiptSchema>
export type InventoryReceiptLineInput = z.infer<typeof inventoryReceiptLineSchema>
export type InventoryReturnInput = z.infer<typeof inventoryReturnSchema>
export type InventoryReturnLineInput = z.infer<typeof inventoryReturnLineSchema>
export type InventoryProjectAllocationInput = z.infer<typeof inventoryProjectAllocationSchema>
export type InventoryAssetAssignmentInput = z.infer<typeof inventoryAssetAssignmentSchema>

// ============================================================================
// Phase 8 — Calendar, Communication & Meetings
// ============================================================================
export const calendarEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(300),
  description: z.string().max(5000).optional().or(z.literal('')),
  event_type: z.enum(['task', 'milestone', 'meeting', 'deadline', 'reminder', 'event', 'appointment', 'call']).default('event'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable(),
  all_day: z.boolean().default(false),
  color: z.string().max(20).default('#3b82f6'),
  timezone: z.string().max(64).default('UTC'),
  location: z.string().max(500).optional().or(z.literal('')),
  meeting_link: z.string().max(1000).optional().or(z.literal('')),
  organizer_id: z.string().uuid().optional().nullable(),
  reminder_minutes: z.array(z.number().int().min(0).max(10080)).max(10).default([]),
  project_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  employee_id: z.string().uuid().optional().nullable(),
  workspace_id: z.string().uuid().optional().nullable(),
  status: z.enum(['scheduled', 'cancelled', 'completed']).default('scheduled'),
})

export const calendarDuplicateSchema = z.object({
  event_id: z.string().uuid(),
  start_date: z.string().optional(),
  title: z.string().max(300).optional(),
})

export const calendarRescheduleSchema = z.object({
  event_id: z.string().uuid(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable(),
})

export const calendarSeriesEditSchema = z.object({
  event_id: z.string().uuid(),
  title: z.string().max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  meeting_link: z.string().max(1000).optional().nullable(),
  all_day: z.boolean().optional(),
  color: z.string().max(20).optional(),
  timezone: z.string().max(64).optional(),
})

export const calendarRecurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(366).default(1),
  by_day: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).optional(),
  until: z.string().optional().nullable(),
  count: z.number().int().min(1).max(999).optional().nullable(),
})

export const calendarParticipantSchema = z.object({
  event_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')),
  name: z.string().max(200).optional().or(z.literal('')),
  status: z.enum(['pending', 'accepted', 'declined', 'tentative']).default('pending'),
  role: z.enum(['organizer', 'attendee', 'optional']).default('attendee'),
})

export const calendarAvailabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM'),
  timezone: z.string().max(64).default('UTC'),
  is_active: z.boolean().default(true),
})

export const calendarScheduleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  duration_minutes: z.number().int().min(5).max(480),
  attendee_ids: z.array(z.string().uuid()).min(1, 'At least one attendee is required'),
  start_date: z.string().min(1, 'Start date is required'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  timezone: z.string().max(64).default('UTC'),
  buffer_minutes: z.number().int().min(0).max(120).default(15),
})

export const meetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(300),
  description: z.string().max(5000).optional().or(z.literal('')),
  agenda: z.string().max(10000).optional().or(z.literal('')),
  meeting_type: z.enum(['internal', 'customer', 'project', 'one_on_one', 'recruitment', 'standup', 'other']).default('internal'),
  status: z.enum(['scheduled', 'confirmed', 'rescheduled', 'cancelled', 'completed']).default('scheduled'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().optional().nullable(),
  timezone: z.string().max(64).default('UTC'),
  duration_minutes: z.number().int().min(5).max(600).optional(),
  location: z.string().max(500).optional().or(z.literal('')),
  meeting_link: z.string().max(1000).optional().or(z.literal('')),
  organizer_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  employee_id: z.string().uuid().optional().nullable(),
  workspace_id: z.string().uuid().optional().nullable(),
})

export const meetingParticipantSchema = z.object({
  meeting_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')),
  name: z.string().max(200).optional().or(z.literal('')),
  status: z.enum(['pending', 'accepted', 'declined', 'tentative']).default('pending'),
  role: z.enum(['organizer', 'attendee', 'optional']).default('attendee'),
})

export const meetingNotesSchema = z.object({
  meeting_id: z.string().uuid(),
  title: z.string().max(300).default('Meeting Notes'),
  content: z.string().max(50000).optional().or(z.literal('')),
  document_id: z.string().uuid().optional().nullable(),
  mentions: z.array(z.string().uuid()).max(50).default([]),
})

export const meetingDecisionSchema = z.object({
  meeting_id: z.string().uuid(),
  decision: z.string().min(1, 'Decision is required').max(5000),
  context: z.string().max(5000).optional().or(z.literal('')),
  owner_id: z.string().uuid().optional().nullable(),
  decision_date: z.string().default(() => new Date().toISOString().slice(0, 10)),
  project_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  document_id: z.string().uuid().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'done', 'blocked', 'cancelled']).default('open'),
})

export const meetingActionItemSchema = z.object({
  meeting_id: z.string().uuid(),
  description: z.string().min(1, 'Action item is required').max(2000),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).default('open'),
})

export const communicationThreadSchema = z.object({
  thread_type: z.enum(['direct', 'team', 'department', 'entity', 'group']).default('direct'),
  entity_type: z.enum(['company', 'contact', 'deal', 'lead', 'project', 'employee', 'task', 'document']).optional().nullable(),
  entity_id: z.string().uuid().optional().nullable(),
  title: z.string().max(300).optional().or(z.literal('')),
  member_ids: z.array(z.string().uuid()).max(200).default([]),
  workspace_id: z.string().uuid().optional().nullable(),
})

export const communicationMessageSchema = z.object({
  thread_id: z.string().uuid(),
  body: z.string().trim().min(1, 'Message body is required').max(10000),
  message_type: z.enum(['message', 'email', 'call', 'note', 'system']).default('message'),
  parent_id: z.string().uuid().optional().nullable(),
  mentions: z.array(z.string().uuid()).max(50).default([]),
  attachment_url: z.string().max(1000).optional().or(z.literal('')),
})

export const emailMessageSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().max(50000).optional().or(z.literal('')),
  to_emails: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  cc_emails: z.array(z.string().email()).default([]),
  bcc_emails: z.array(z.string().email()).default([]),
  thread_id: z.string().uuid().optional().nullable(),
  connection_id: z.string().uuid().optional().nullable(),
})

export type CalendarEventInput = z.infer<typeof calendarEventSchema>
export type CalendarRecurrenceInput = z.infer<typeof calendarRecurrenceSchema>
export type CalendarParticipantInput = z.infer<typeof calendarParticipantSchema>
export type CalendarAvailabilityInput = z.infer<typeof calendarAvailabilitySchema>
export type CalendarScheduleInput = z.infer<typeof calendarScheduleSchema>
export type MeetingInput = z.infer<typeof meetingSchema>
export type MeetingParticipantInput = z.infer<typeof meetingParticipantSchema>
export type MeetingNotesInput = z.infer<typeof meetingNotesSchema>
export type MeetingDecisionInput = z.infer<typeof meetingDecisionSchema>
export type MeetingActionItemInput = z.infer<typeof meetingActionItemSchema>
export type CommunicationThreadInput = z.infer<typeof communicationThreadSchema>
export type CommunicationMessageInput = z.infer<typeof communicationMessageSchema>
export type EmailMessageInput = z.infer<typeof emailMessageSchema>
