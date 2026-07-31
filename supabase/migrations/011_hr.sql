-- ACT OS Phase 5 — HR & Workforce Management
-- Follows existing conventions: UUID PKs, organization_id isolation,
-- created_by/created_at/updated_at/deleted_at, update_updated_at() triggers,
-- RLS via is_org_member/is_project_member helpers + role-level helpers.

-- ============================================================================
-- RLS helpers for role-tiered access (reuse org_members + org roles)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    JOIN roles r ON r.id = om.role_id
    WHERE om.organization_id = org_id AND om.user_id = auth.uid()
      AND r.level >= 80
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_org_manager(org_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    JOIN roles r ON r.id = om.role_id
    WHERE om.organization_id = org_id AND om.user_id = auth.uid()
      AND r.level >= 70
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_org_manager(UUID) TO anon, authenticated;

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================
CREATE TABLE hr_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, slug)
);
CREATE TRIGGER update_hr_departments_updated_at
  BEFORE UPDATE ON hr_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_departments_org ON hr_departments(organization_id, deleted_at);

-- ============================================================================
-- WORK SCHEDULES (created before employees which reference them)
-- ============================================================================
CREATE TABLE hr_work_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  working_days TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri'],
  start_time TIME,
  end_time TIME,
  weekly_hours NUMERIC(5,2) DEFAULT 40,
  shift TEXT DEFAULT 'day' CHECK (shift IN ('day', 'evening', 'night', 'custom')),
  flexible BOOLEAN DEFAULT FALSE,
  work_mode TEXT DEFAULT 'office' CHECK (work_mode IN ('office', 'remote', 'hybrid')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_work_schedules_updated_at
  BEFORE UPDATE ON hr_work_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_work_schedules_org ON hr_work_schedules(organization_id, deleted_at);

-- ============================================================================
-- EMPLOYEES
-- ============================================================================
CREATE TABLE hr_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  profile_photo TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  department_id UUID REFERENCES hr_departments(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  job_title TEXT,
  manager_id UUID REFERENCES hr_employees(id) ON DELETE SET NULL,
  employment_type TEXT NOT NULL DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'freelance')),
  employment_status TEXT NOT NULL DEFAULT 'active'
    CHECK (employment_status IN ('active', 'on_leave', 'probation', 'terminated', 'archived')),
  joining_date DATE,
  exit_date DATE,
  location TEXT,
  work_schedule_id UUID REFERENCES hr_work_schedules(id) ON DELETE SET NULL,
  work_mode TEXT DEFAULT 'office' CHECK (work_mode IN ('office', 'remote', 'hybrid')),
  emergency_contact JSONB DEFAULT '{}',
  skills JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, employee_code)
);
CREATE TRIGGER update_hr_employees_updated_at
  BEFORE UPDATE ON hr_employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_employees_org ON hr_employees(organization_id, deleted_at);
CREATE INDEX idx_hr_employees_dept ON hr_employees(department_id);
CREATE INDEX idx_hr_employees_team ON hr_employees(team_id);
CREATE INDEX idx_hr_employees_manager ON hr_employees(manager_id);
CREATE INDEX idx_hr_employees_email ON hr_employees(organization_id, email);

-- ============================================================================
-- EMPLOYEE SKILLS (normalized, level-tracked)
-- ============================================================================
CREATE TABLE hr_employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience NUMERIC(5,2) DEFAULT 0,
  certification TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, skill)
);
CREATE TRIGGER update_hr_employee_skills_updated_at
  BEFORE UPDATE ON hr_employee_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_employee_skills_emp ON hr_employee_skills(employee_id);
CREATE INDEX idx_hr_employee_skills_skill ON hr_employee_skills(skill, level);

-- ============================================================================
-- ATTENDANCE
-- ============================================================================
CREATE TABLE hr_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday')),
  working_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  late_minutes INTEGER DEFAULT 0,
  early_departure_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);
CREATE TRIGGER update_hr_attendance_updated_at
  BEFORE UPDATE ON hr_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_attendance_org ON hr_attendance(organization_id, attendance_date DESC);
CREATE INDEX idx_hr_attendance_emp ON hr_attendance(employee_id, attendance_date DESC);

-- ============================================================================
-- HOLIDAYS
-- ============================================================================
CREATE TABLE hr_holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  holiday_type TEXT NOT NULL DEFAULT 'public'
    CHECK (holiday_type IN ('public', 'company', 'custom', 'department')),
  department_id UUID REFERENCES hr_departments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, name, holiday_date)
);
CREATE TRIGGER update_hr_holidays_updated_at
  BEFORE UPDATE ON hr_holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_holidays_org ON hr_holidays(organization_id, holiday_date);

-- ============================================================================
-- LEAVE TYPES
-- ============================================================================
CREATE TABLE hr_leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  days_per_year NUMERIC(5,1) DEFAULT 0,
  carry_over NUMERIC(5,1) DEFAULT 0,
  requires_approval BOOLEAN DEFAULT TRUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, code)
);
CREATE TRIGGER update_hr_leave_types_updated_at
  BEFORE UPDATE ON hr_leave_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_leave_types_org ON hr_leave_types(organization_id, deleted_at);

-- ============================================================================
-- LEAVE BALANCES
-- ============================================================================
CREATE TABLE hr_leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES hr_leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days NUMERIC(5,1) DEFAULT 0,
  used_days NUMERIC(5,1) DEFAULT 0,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);
CREATE TRIGGER update_hr_leave_balances_updated_at
  BEFORE UPDATE ON hr_leave_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_leave_balances_emp ON hr_leave_balances(employee_id, year);

-- ============================================================================
-- LEAVE REQUESTS
-- ============================================================================
CREATE TABLE hr_leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES hr_leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(5,1) NOT NULL DEFAULT 1,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_leave_requests_updated_at
  BEFORE UPDATE ON hr_leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_leave_requests_org ON hr_leave_requests(organization_id, status, created_at DESC);
CREATE INDEX idx_hr_leave_requests_emp ON hr_leave_requests(employee_id, created_at DESC);

-- ============================================================================
-- RECRUITMENT — JOB OPENINGS
-- ============================================================================
CREATE TABLE hr_job_openings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  department_id UUID REFERENCES hr_departments(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  hiring_manager_id UUID REFERENCES hr_employees(id) ON DELETE SET NULL,
  location TEXT,
  employment_type TEXT DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'freelance')),
  salary_min NUMERIC(15,2),
  salary_max NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',
  required_skills TEXT[] DEFAULT '{}',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'on_hold', 'closed', 'filled')),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_job_openings_updated_at
  BEFORE UPDATE ON hr_job_openings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_job_openings_org ON hr_job_openings(organization_id, status, deleted_at);

-- ============================================================================
-- RECRUITMENT — CANDIDATES
-- ============================================================================
CREATE TABLE hr_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_opening_id UUID REFERENCES hr_job_openings(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  resume_url TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_years NUMERIC(5,2) DEFAULT 0,
  source TEXT,
  stage TEXT NOT NULL DEFAULT 'applied'
    CHECK (stage IN ('applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected')),
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_candidates_updated_at
  BEFORE UPDATE ON hr_candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_candidates_org ON hr_candidates(organization_id, stage, deleted_at);
CREATE INDEX idx_hr_candidates_job ON hr_candidates(job_opening_id);

-- ============================================================================
-- RECRUITMENT — INTERVIEWS
-- ============================================================================
CREATE TABLE hr_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES hr_candidates(id) ON DELETE CASCADE,
  job_opening_id UUID REFERENCES hr_job_openings(id) ON DELETE SET NULL,
  interviewer_ids UUID[] DEFAULT '{}',
  interview_type TEXT DEFAULT 'video'
    CHECK (interview_type IN ('phone', 'video', 'technical', 'hr', 'final')),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_url TEXT,
  notes TEXT,
  feedback TEXT,
  score INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_interviews_updated_at
  BEFORE UPDATE ON hr_interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_interviews_org ON hr_interviews(organization_id, scheduled_at);
CREATE INDEX idx_hr_interviews_candidate ON hr_interviews(candidate_id);

-- ============================================================================
-- RECRUITMENT — OFFERS
-- ============================================================================
CREATE TABLE hr_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES hr_candidates(id) ON DELETE CASCADE,
  job_opening_id UUID REFERENCES hr_job_openings(id) ON DELETE SET NULL,
  position TEXT NOT NULL,
  salary NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',
  joining_date DATE,
  benefits JSONB DEFAULT '{}',
  notes TEXT,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_offers_updated_at
  BEFORE UPDATE ON hr_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_offers_org ON hr_offers(organization_id, status, deleted_at);
CREATE INDEX idx_hr_offers_candidate ON hr_offers(candidate_id);

-- ============================================================================
-- ONBOARDING — TEMPLATES & ASSIGNMENTS & TASKS
-- ============================================================================
CREATE TABLE hr_onboarding_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB DEFAULT '[]',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_onboarding_templates_updated_at
  BEFORE UPDATE ON hr_onboarding_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_onboarding_templates_org ON hr_onboarding_templates(organization_id, deleted_at);

CREATE TABLE hr_onboarding_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES hr_onboarding_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_onboarding_assignments_updated_at
  BEFORE UPDATE ON hr_onboarding_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_onboarding_assign_org ON hr_onboarding_assignments(organization_id, status);
CREATE INDEX idx_hr_onboarding_assign_emp ON hr_onboarding_assignments(employee_id);

CREATE TABLE hr_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES hr_onboarding_assignments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_onboarding_tasks_updated_at
  BEFORE UPDATE ON hr_onboarding_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_onboarding_tasks_assign ON hr_onboarding_tasks(assignment_id);

-- ============================================================================
-- OFFBOARDING
-- ============================================================================
CREATE TABLE hr_offboarding_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  exit_date DATE,
  reason TEXT,
  notice_period_days INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'in_review', 'approved', 'completed', 'cancelled')),
  manager_review TEXT,
  asset_returned BOOLEAN DEFAULT FALSE,
  access_revoked BOOLEAN DEFAULT FALSE,
  final_documents BOOLEAN DEFAULT FALSE,
  exit_interview_notes TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_offboarding_requests_updated_at
  BEFORE UPDATE ON hr_offboarding_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_offboarding_org ON hr_offboarding_requests(organization_id, status, deleted_at);

-- ============================================================================
-- PERFORMANCE — CYCLES & REVIEWS
-- ============================================================================
CREATE TABLE hr_performance_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'quarterly'
    CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'active', 'completed')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_performance_cycles_updated_at
  BEFORE UPDATE ON hr_performance_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_perf_cycles_org ON hr_performance_cycles(organization_id, deleted_at);

CREATE TABLE hr_performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES hr_performance_cycles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES hr_employees(id) ON DELETE SET NULL,
  rating NUMERIC(3,2),
  goals_achieved TEXT,
  strengths TEXT,
  improvements TEXT,
  overall_feedback TEXT,
  development_plan TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'acknowledged', 'completed')),
  submitted_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(employee_id, cycle_id)
);
CREATE TRIGGER update_hr_performance_reviews_updated_at
  BEFORE UPDATE ON hr_performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_perf_reviews_org ON hr_performance_reviews(organization_id, deleted_at);
CREATE INDEX idx_hr_perf_reviews_emp ON hr_performance_reviews(employee_id);

-- ============================================================================
-- GOALS (company -> department -> team -> employee hierarchy)
-- ============================================================================
CREATE TABLE hr_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  goal_level TEXT NOT NULL DEFAULT 'employee'
    CHECK (goal_level IN ('company', 'department', 'team', 'employee')),
  parent_goal_id UUID REFERENCES hr_goals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES hr_departments(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target NUMERIC(10,2),
  current_value NUMERIC(10,2) DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_goals_updated_at
  BEFORE UPDATE ON hr_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_goals_org ON hr_goals(organization_id, status, deleted_at);
CREATE INDEX idx_hr_goals_emp ON hr_goals(employee_id);

-- ============================================================================
-- COMPENSATION (sensitive — separate table, admin/HR only)
-- ============================================================================
CREATE TABLE hr_compensation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  base_salary NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',
  pay_cycle TEXT DEFAULT 'monthly' CHECK (pay_cycle IN ('hourly', 'weekly', 'bi_weekly', 'monthly', 'annual')),
  effective_date DATE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_hr_compensation_updated_at
  BEFORE UPDATE ON hr_compensation FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_hr_compensation_org ON hr_compensation(organization_id, deleted_at);
CREATE INDEX idx_hr_compensation_emp ON hr_compensation(employee_id);

-- ============================================================================
-- HR ACTIVITY TIMELINE (reuses activities conventions, HR-scoped)
-- ============================================================================
CREATE TABLE hr_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_hr_activities_org ON hr_activities(organization_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE hr_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_onboarding_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_offboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_performance_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_activities ENABLE ROW LEVEL SECURITY;

-- Base pattern: all org members can SELECT most HR data
CREATE POLICY "Members can view departments" ON hr_departments FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view employees" ON hr_employees FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view work schedules" ON hr_work_schedules FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view employee skills" ON hr_employee_skills FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Members can view attendance" ON hr_attendance FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Members can view holidays" ON hr_holidays FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view leave types" ON hr_leave_types FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view leave balances" ON hr_leave_balances FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Members can view leave requests" ON hr_leave_requests FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view job openings" ON hr_job_openings FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view candidates" ON hr_candidates FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view interviews" ON hr_interviews FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view offers" ON hr_offers FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view onboarding templates" ON hr_onboarding_templates FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view onboarding assignments" ON hr_onboarding_assignments FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view onboarding tasks" ON hr_onboarding_tasks FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view offboarding requests" ON hr_offboarding_requests FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view performance cycles" ON hr_performance_cycles FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view performance reviews" ON hr_performance_reviews FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view goals" ON hr_goals FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can view HR activities" ON hr_activities FOR SELECT
  USING (public.is_org_member(organization_id));

-- EMPLOYEES: all org members can create (they work here); managers/admins update
CREATE POLICY "Members can insert employees" ON hr_employees FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Managers can update employees" ON hr_employees FOR UPDATE
  USING (public.is_org_member(organization_id) AND (public.is_org_manager(organization_id) OR user_id = auth.uid()))
  WITH CHECK (public.is_org_member(organization_id) AND (public.is_org_manager(organization_id) OR user_id = auth.uid()));

-- Departments: manager+ can manage
CREATE POLICY "Managers can create departments" ON hr_departments FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update departments" ON hr_departments FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can delete departments" ON hr_departments FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Work schedules: manager+ can manage
CREATE POLICY "Managers can create work schedules" ON hr_work_schedules FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update work schedules" ON hr_work_schedules FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can delete work schedules" ON hr_work_schedules FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Employee skills: employees own their own, managers manage all
CREATE POLICY "Employees can insert own skills" ON hr_employee_skills FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.is_org_manager(organization_id) OR employee_id IN (SELECT id FROM hr_employees WHERE user_id = auth.uid()))
  );
CREATE POLICY "Members can update skills" ON hr_employee_skills FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (public.is_org_manager(organization_id) OR employee_id IN (SELECT id FROM hr_employees WHERE user_id = auth.uid()))
  );
CREATE POLICY "Admins can delete skills" ON hr_employee_skills FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Attendance: employees manage own, managers manage all
CREATE POLICY "Employees can insert own attendance" ON hr_attendance FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.is_org_manager(organization_id) OR employee_id IN (SELECT id FROM hr_employees WHERE user_id = auth.uid()))
  );
CREATE POLICY "Members can update attendance" ON hr_attendance FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (public.is_org_manager(organization_id) OR employee_id IN (SELECT id FROM hr_employees WHERE user_id = auth.uid()))
  );
CREATE POLICY "Admins can delete attendance" ON hr_attendance FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Holidays: manager+ manages
CREATE POLICY "Managers can create holidays" ON hr_holidays FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update holidays" ON hr_holidays FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Admins can delete holidays" ON hr_holidays FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Leave types: manager+ manages
CREATE POLICY "Managers can create leave types" ON hr_leave_types FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update leave types" ON hr_leave_types FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Admins can delete leave types" ON hr_leave_types FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Leave balances: managers+ can manage
CREATE POLICY "Managers can create leave balances" ON hr_leave_balances FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update leave balances" ON hr_leave_balances FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Admins can delete leave balances" ON hr_leave_balances FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Leave requests: employees create their own, managers approve
CREATE POLICY "Employees can insert own leave requests" ON hr_leave_requests FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (employee_id IN (SELECT id FROM hr_employees WHERE user_id = auth.uid()) OR public.is_org_manager(organization_id))
  );
CREATE POLICY "Members can update leave requests" ON hr_leave_requests FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (public.is_org_manager(organization_id) OR employee_id IN (SELECT id FROM hr_employees WHERE user_id = auth.uid()))
  );
CREATE POLICY "Admins can delete leave requests" ON hr_leave_requests FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Recruitment: manager+ manages openings/offers; all members can see
CREATE POLICY "Managers can create job openings" ON hr_job_openings FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update job openings" ON hr_job_openings FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Admins can delete job openings" ON hr_job_openings FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

CREATE POLICY "Members can insert candidates" ON hr_candidates FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update candidates" ON hr_candidates FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete candidates" ON hr_candidates FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

CREATE POLICY "Managers can create interviews" ON hr_interviews FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update interviews" ON hr_interviews FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete interviews" ON hr_interviews FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

CREATE POLICY "Managers can create offers" ON hr_offers FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update offers" ON hr_offers FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Admins can delete offers" ON hr_offers FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Onboarding: manager+ manages
CREATE POLICY "Managers can create onboarding templates" ON hr_onboarding_templates FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update onboarding templates" ON hr_onboarding_templates FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Admins can delete onboarding templates" ON hr_onboarding_templates FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

CREATE POLICY "Managers can create onboarding assignments" ON hr_onboarding_assignments FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Members can update onboarding assignments" ON hr_onboarding_assignments FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete onboarding assignments" ON hr_onboarding_assignments FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

CREATE POLICY "Members can create onboarding tasks" ON hr_onboarding_tasks FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update onboarding tasks" ON hr_onboarding_tasks FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete onboarding tasks" ON hr_onboarding_tasks FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Offboarding: sensitive — manager+ creates/manages
CREATE POLICY "Managers can create offboarding requests" ON hr_offboarding_requests FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update offboarding requests" ON hr_offboarding_requests FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Admins can delete offboarding requests" ON hr_offboarding_requests FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Performance: manager+ manages
CREATE POLICY "Managers can create performance cycles" ON hr_performance_cycles FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Managers can update performance cycles" ON hr_performance_cycles FOR UPDATE
  USING (public.is_org_member(organization_id) AND public.is_org_manager(organization_id));
CREATE POLICY "Admins can delete performance cycles" ON hr_performance_cycles FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

CREATE POLICY "Managers can create performance reviews" ON hr_performance_reviews FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND (public.is_org_manager(organization_id) OR employee_id IN (SELECT id FROM hr_employees WHERE user_id = auth.uid())));
CREATE POLICY "Members can update performance reviews" ON hr_performance_reviews FOR UPDATE
  USING (public.is_org_member(organization_id) AND (public.is_org_manager(organization_id) OR employee_id IN (SELECT id FROM hr_employees WHERE user_id = auth.uid())));
CREATE POLICY "Admins can delete performance reviews" ON hr_performance_reviews FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Goals: all members can create (aligned with company), manager+ can manage all
CREATE POLICY "Members can create goals" ON hr_goals FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update goals" ON hr_goals FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete goals" ON hr_goals FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- COMPENSATION: sensitive — only managers+ can view/manage (no employee self-access)
CREATE POLICY "Managers can view compensation" ON hr_compensation FOR SELECT
  USING (public.is_org_manager(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Managers can create compensation" ON hr_compensation FOR INSERT
  WITH CHECK (public.is_org_manager(organization_id));
CREATE POLICY "Managers can update compensation" ON hr_compensation FOR UPDATE
  USING (public.is_org_manager(organization_id))
  WITH CHECK (public.is_org_manager(organization_id));
CREATE POLICY "Admins can delete compensation" ON hr_compensation FOR DELETE
  USING (public.is_org_manager(organization_id) AND public.is_org_admin(organization_id));

-- HR activities: any member can insert (audit log), all can view
CREATE POLICY "Members can create HR activities" ON hr_activities FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

-- ============================================================================
-- PERMISSIONS (slug convention: hr_<resource>_<action>)
-- ============================================================================
INSERT INTO permissions (name, slug, description, resource, action) VALUES
  ('View HR Dashboard', 'hr_dashboard_view', 'View HR dashboard', 'hr', 'view_dashboard'),
  ('View Employees', 'hr_employee_view', 'View employees', 'hr_employee', 'view'),
  ('Create Employees', 'hr_employee_create', 'Create employees', 'hr_employee', 'create'),
  ('Update Employees', 'hr_employee_update', 'Update employees', 'hr_employee', 'update'),
  ('Archive Employees', 'hr_employee_archive', 'Archive/terminate employees', 'hr_employee', 'archive'),
  ('View Departments', 'hr_department_view', 'View departments', 'hr_department', 'view'),
  ('Manage Departments', 'hr_department_manage', 'Manage departments', 'hr_department', 'manage'),
  ('View Teams', 'hr_team_view', 'View teams', 'hr_team', 'view'),
  ('Manage Teams', 'hr_team_manage', 'Manage teams', 'hr_team', 'manage'),
  ('View Attendance', 'hr_attendance_view', 'View attendance', 'hr_attendance', 'view'),
  ('Manage Attendance', 'hr_attendance_manage', 'Check in/out and manage attendance', 'hr_attendance', 'manage'),
  ('View Leave', 'hr_leave_view', 'View leave requests', 'hr_leave', 'view'),
  ('Request Leave', 'hr_leave_request', 'Request leave', 'hr_leave', 'request'),
  ('Approve Leave', 'hr_leave_approve', 'Approve or reject leave', 'hr_leave', 'approve'),
  ('View Recruitment', 'hr_recruitment_view', 'View job openings and candidates', 'hr_recruitment', 'view'),
  ('Manage Recruitment', 'hr_recruitment_manage', 'Manage job openings, candidates, interviews', 'hr_recruitment', 'manage'),
  ('Issue Offers', 'hr_offer_manage', 'Create/send offers', 'hr_offer', 'manage'),
  ('Manage Onboarding', 'hr_onboarding_manage', 'Manage onboarding workflows', 'hr_onboarding', 'manage'),
  ('Manage Offboarding', 'hr_offboarding_manage', 'Manage offboarding', 'hr_offboarding', 'manage'),
  ('View Skills', 'hr_skill_view', 'View employee skills', 'hr_skill', 'view'),
  ('Manage Skills', 'hr_skill_manage', 'Manage employee skills', 'hr_skill', 'manage'),
  ('View Capacity', 'hr_capacity_view', 'View workforce capacity', 'hr_capacity', 'view'),
  ('Manage Capacity', 'hr_capacity_manage', 'Manage resource/capacity allocation', 'hr_capacity', 'manage'),
  ('View Performance', 'hr_performance_view', 'View performance reviews', 'hr_performance', 'view'),
  ('Manage Performance', 'hr_performance_manage', 'Manage performance reviews', 'hr_performance', 'manage'),
  ('View Goals', 'hr_goal_view', 'View goals', 'hr_goal', 'view'),
  ('Manage Goals', 'hr_goal_manage', 'Manage goals', 'hr_goal', 'manage'),
  ('View Compensation', 'hr_compensation_view', 'View employee compensation', 'hr_compensation', 'view'),
  ('Manage Compensation', 'hr_compensation_manage', 'Manage employee compensation', 'hr_compensation', 'manage'),
  ('View HR Reports', 'hr_report_view', 'View workforce reports', 'hr_report', 'view'),
  ('View HR Activity', 'hr_activity_view', 'View HR activity timeline', 'hr_activity', 'view')
ON CONFLICT (slug) DO NOTHING;