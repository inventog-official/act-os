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
