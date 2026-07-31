-- ============================================================
-- ACT OS — Sample/Seed Data (all modules)
-- Run this in the Supabase SQL Editor AFTER applying migrations 001–007.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. DEMO USER
-- ------------------------------------------------------------
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-00000000000a',
  'authenticated',
  'authenticated',
  'demo@actos.app',
  crypt('demo1234', gen_salt('bf', 10)),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"sub":"00000000-0000-0000-0000-00000000000a","name":"Demo User","email":"demo@actos.app","email_verified":true,"phone_verified":false}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (instance_id, id, provider, provider_id, user_id, identity_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-00000000000a',
  'email',
  'demo@actos.app',
  '00000000-0000-0000-0000-00000000000a',
  '{"sub":"00000000-0000-0000-0000-00000000000a","email":"demo@actos.app","email_verified":true,"phone_verified":false}',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 2. ORGANIZATION & WORKSPACE
-- ------------------------------------------------------------
INSERT INTO organizations (id, name, slug, website, description, owner_id, settings, tier)
VALUES (
  '10000000-0000-0000-0000-00000000000a',
  'Demo Corp',
  'demo-corp',
  'https://democorp.com',
  'Sample organization for testing',
  '00000000-0000-0000-0000-00000000000a',
  '{"region":"US"}',
  'business'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO workspaces (id, name, slug, description, organization_id, created_by)
VALUES (
  '10000000-0000-0000-0000-00000000000b',
  'Default Workspace',
  'default',
  'Primary workspace',
  '10000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-00000000000a'
)
ON CONFLICT (organization_id, slug) DO NOTHING;

-- ------------------------------------------------------------
-- 3. ROLES, TEAM, MEMBERS
-- ------------------------------------------------------------
INSERT INTO roles (id, name, slug, description, organization_id, is_system, level) VALUES
  ('10000000-0000-0000-0000-00000000000c', 'Super Admin', 'super_admin', 'Full access', '10000000-0000-0000-0000-00000000000a', TRUE, 100),
  ('10000000-0000-0000-0000-00000000000d', 'Admin', 'admin', 'Admin access', '10000000-0000-0000-0000-00000000000a', TRUE, 90),
  ('10000000-0000-0000-0000-00000000000e', 'Manager', 'manager', 'Manager access', '10000000-0000-0000-0000-00000000000a', TRUE, 70),
  ('10000000-0000-0000-0000-00000000000f', 'Employee', 'employee', 'Standard access', '10000000-0000-0000-0000-00000000000a', TRUE, 50),
  ('10000000-0000-0000-0000-000000000010', 'Sales Executive', 'sales_executive', 'Sales access', '10000000-0000-0000-0000-00000000000a', TRUE, 60),
  ('10000000-0000-0000-0000-000000000011', 'Guest', 'guest', 'Limited access', '10000000-0000-0000-0000-00000000000a', TRUE, 10)
ON CONFLICT (organization_id, slug) DO NOTHING;

-- Role -> Permissions (grant all seeded permissions to Super Admin + Admin)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-00000000000c', id FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-00000000000d', id FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role_id, created_by)
VALUES (
  '10000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-00000000000a',
  '10000000-0000-0000-0000-00000000000c',
  '00000000-0000-0000-0000-00000000000a'
)
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO teams (id, name, description, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000012', 'Engineering', 'Product engineering', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000013', 'Sales', 'Sales team', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO team_members (team_id, user_id, created_by)
SELECT id, '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a' FROM teams
ON CONFLICT (team_id, user_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, organization_id)
VALUES (
  '00000000-0000-0000-0000-00000000000a',
  '10000000-0000-0000-0000-00000000000c',
  '10000000-0000-0000-0000-00000000000a'
)
ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;

-- ------------------------------------------------------------
-- 4. CRM — PIPELINE, STAGES, TAGS
-- ------------------------------------------------------------
INSERT INTO crm_pipelines (id, name, description, organization_id, workspace_id, is_default, created_by)
VALUES (
  '10000000-0000-0000-0000-000000000020',
  'Sales Pipeline',
  'Default sales pipeline',
  '10000000-0000-0000-0000-00000000000a',
  '10000000-0000-0000-0000-00000000000b',
  TRUE,
  '00000000-0000-0000-0000-00000000000a'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_pipeline_stages (id, pipeline_id, name, color, probability, order_index) VALUES
  ('10000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000020', 'New', '#3b82f6', 10, 0),
  ('10000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000020', 'Qualified', '#8b5cf6', 30, 1),
  ('10000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000020', 'Proposal', '#6366f1', 50, 2),
  ('10000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000020', 'Negotiation', '#ec4899', 70, 3),
  ('10000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000020', 'Won', '#10b981', 100, 4),
  ('10000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000020', 'Lost', '#ef4444', 0, 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_tags (id, name, color, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000027', 'Enterprise', '#3b82f6', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000028', 'Startup', '#10b981', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000029', 'Hot Lead', '#ef4444', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (organization_id, name) DO NOTHING;

-- ------------------------------------------------------------
-- 5. CRM — COMPANIES
-- ------------------------------------------------------------
INSERT INTO crm_companies (id, name, industry, employee_count, revenue, city, state, country, website, phone, email, description, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000030', 'Demo Corp', 'Technology', 250, 50000000, 'San Francisco', 'CA', 'USA', 'https://democorp.com', '+1-555-0100', 'info@democorp.com', 'Leading tech company', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000031', 'TechStart Inc', 'SaaS', 50, 10000000, 'Austin', 'TX', 'USA', 'https://techstart.io', '+1-555-0101', 'hello@techstart.io', 'Fast-growing SaaS startup', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000032', 'Global Media', 'Media', 500, 200000000, 'New York', 'NY', 'USA', 'https://globalmedia.com', '+1-555-0102', 'contact@globalmedia.com', 'Global media conglomerate', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 6. CRM — LEADS
-- ------------------------------------------------------------
INSERT INTO crm_leads (id, first_name, last_name, email, phone, job_title, company_id, company_name, website, industry, lead_source, priority, status, pipeline_stage_id, estimated_deal_value, expected_close_date, description, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000040', 'Sarah', 'Chen', 'sarah@democorp.com', '+1-555-0200', 'CEO', '10000000-0000-0000-0000-000000000030', 'Demo Corp', 'https://democorp.com', 'Technology', 'website', 'high', 'new', '10000000-0000-0000-0000-000000000021', 25000, CURRENT_DATE + 15, 'Interested in enterprise plan', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000041', 'Mike', 'Johnson', 'mike@techstart.io', '+1-555-0201', 'CTO', '10000000-0000-0000-0000-000000000031', 'TechStart Inc', 'https://techstart.io', 'SaaS', 'referral', 'medium', 'qualified', '10000000-0000-0000-0000-000000000022', 50000, CURRENT_DATE + 30, 'Looking for scalable solution', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000042', 'Emily', 'Davis', 'emily@globalmedia.com', '+1-555-0202', 'Marketing Director', '10000000-0000-0000-0000-000000000032', 'Global Media', 'https://globalmedia.com', 'Media', 'email', 'high', 'proposal', '10000000-0000-0000-0000-000000000023', 75000, CURRENT_DATE + 25, 'Need marketing automation', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000043', 'Raj', 'Patel', 'raj@cloudnex.com', '+1-555-0203', 'VP Engineering', NULL, 'CloudNex', 'https://cloudnex.com', 'Cloud', 'event', 'high', 'negotiation', '10000000-0000-0000-0000-000000000024', 120000, CURRENT_DATE + 10, 'Wants full platform migration', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000044', 'Lisa', 'Nguyen', 'lisa@retailplus.com', '+1-555-0204', 'COO', NULL, 'RetailPlus', 'https://retailplus.com', 'Retail', 'advertisement', 'medium', 'contacted', '10000000-0000-0000-0000-000000000022', 35000, CURRENT_DATE + 45, 'Evaluating CRM options', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 7. CRM — CONTACTS
-- ------------------------------------------------------------
INSERT INTO crm_contacts (id, first_name, last_name, email, phone, job_title, department, company_id, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000050', 'John', 'Smith', 'john@democorp.com', '+1-555-0300', 'VP Sales', 'Sales', '10000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000051', 'Jane', 'Doe', 'jane@techstart.io', '+1-555-0301', 'Product Manager', 'Product', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000052', 'Bob', 'Wilson', 'bob@globalmedia.com', '+1-555-0302', 'CTO', 'Engineering', '10000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000053', 'Alice', 'Brown', 'alice@cloudnex.com', '+1-555-0303', 'Head of Engineering', 'Engineering', NULL, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 8. CRM — DEALS
-- ------------------------------------------------------------
INSERT INTO crm_deals (id, name, deal_value, probability, pipeline_id, pipeline_stage_id, lead_id, company_id, contact_id, expected_close_date, notes, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000060', 'Demo Corp Enterprise', 25000, 10, '10000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000050', CURRENT_DATE + 15, 'Initial discovery done', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000061', 'TechStart Scale-up', 50000, 30, '10000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000051', CURRENT_DATE + 30, 'Demo scheduled', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000062', 'Global Media Suite', 75000, 50, '10000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000052', CURRENT_DATE + 25, 'Proposal sent', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000063', 'CloudNex Migration', 120000, 70, '10000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000043', NULL, '10000000-0000-0000-0000-000000000053', CURRENT_DATE + 10, 'In final negotiations', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 9. CRM — ACTIVITIES, NOTES, TASKS, TIMELINE
-- ------------------------------------------------------------
INSERT INTO crm_activities (id, type, subject, description, activity_date, duration_minutes, lead_id, company_id, contact_id, deal_id, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000070', 'call', 'Discovery call with Demo Corp', 'Discussed requirements and timeline', NOW() - INTERVAL '2 days', 30, '10000000-0000-0000-0000-000000000040', NULL, NULL, NULL, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000071', 'email', 'Follow-up email to TechStart', 'Sent pricing details', NOW() - INTERVAL '1 day', NULL, '10000000-0000-0000-0000-000000000041', NULL, NULL, NULL, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000072', 'meeting', 'Global Media proposal review', 'Walked through the proposal deck', NOW(), 60, '10000000-0000-0000-0000-000000000042', NULL, NULL, NULL, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000073', 'task', 'Prepare CloudNex SOW', 'Draft the statement of work', NOW() + INTERVAL '1 day', 120, NULL, NULL, NULL, '10000000-0000-0000-0000-000000000063', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000074', 'note', 'Internal note', 'Client prefers monthly billing', NOW() - INTERVAL '3 hours', NULL, NULL, '10000000-0000-0000-0000-000000000030', NULL, NULL, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_notes (id, title, content, is_pinned, lead_id, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000080', 'Call notes', 'Very positive response to pricing. Follow up next week.', TRUE, '10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000081', 'Meeting summary', 'Decision maker is CTO Bob Wilson. Needs security review.', FALSE, NULL, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_tasks (id, title, description, status, priority, due_date, lead_id, deal_id, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000090', 'Send proposal to Demo', 'Finalize and send the proposal document', 'in_progress', 'high', NOW() + INTERVAL '3 days', '10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000091', 'Schedule TechStart demo', 'Book a product demo with Mike', 'pending', 'medium', NOW() + INTERVAL '5 days', '10000000-0000-0000-0000-000000000041', NULL, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000092', 'Renew Global Media contract', 'Send renewal terms', 'completed', 'high', NOW() - INTERVAL '2 days', NULL, '10000000-0000-0000-0000-000000000062', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_timeline (id, action, description, entity_type, entity_id, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-0000000000a0', 'created', 'Lead created', 'lead', '10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000000a1', 'status_changed', 'Moved to Qualified', 'deal', '10000000-0000-0000-0000-000000000061', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_entity_tags (tag_id, entity_type, entity_id) VALUES
  ('10000000-0000-0000-0000-000000000027', 'company', '10000000-0000-0000-0000-000000000030'),
  ('10000000-0000-0000-0000-000000000029', 'lead', '10000000-0000-0000-0000-000000000043')
ON CONFLICT (tag_id, entity_type, entity_id) DO NOTHING;

-- ------------------------------------------------------------
-- 10. PROJECTS
-- ------------------------------------------------------------
INSERT INTO projects (id, name, slug, description, organization_id, workspace_id, status, priority, start_date, end_date, owner_id, created_by, client_name, company_id, deal_id, budget, code, color) VALUES
  ('10000000-0000-0000-0000-0000000000b0', 'Website Redesign', 'website-redesign', 'Complete redesign of corporate website', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', 'active', 'high', CURRENT_DATE - 30, CURRENT_DATE + 60, '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'Demo Corp', '10000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000060', 50000, 'WEB-01', '#3b82f6'),
  ('10000000-0000-0000-0000-0000000000b1', 'Mobile App', 'mobile-app', 'iOS and Android mobile application', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', 'planning', 'medium', NULL, CURRENT_DATE + 120, '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'TechStart Inc', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000061', 80000, 'APP-01', '#10b981'),
  ('10000000-0000-0000-0000-0000000000b2', 'Data Migration', 'data-migration', 'Cloud infrastructure migration', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', 'on_hold', 'urgent', CURRENT_DATE - 10, CURRENT_DATE + 90, '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'CloudNex', NULL, '10000000-0000-0000-0000-000000000063', 150000, 'MIG-01', '#ef4444'),
  ('10000000-0000-0000-0000-0000000000b3', 'Marketing Site', 'marketing-site', 'Public marketing landing pages', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', 'completed', 'low', CURRENT_DATE - 90, CURRENT_DATE - 10, '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'Global Media', '10000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000062', 25000, 'MKT-01', '#8b5cf6')
ON CONFLICT (organization_id, slug) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role, created_by)
SELECT id, '00000000-0000-0000-0000-00000000000a', 'owner', '00000000-0000-0000-0000-00000000000a' FROM projects
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_tags (id, project_id, name, color) VALUES
  ('10000000-0000-0000-0000-0000000000c0', '10000000-0000-0000-0000-0000000000b0', 'Redesign', '#3b82f6'),
  ('10000000-0000-0000-0000-0000000000c1', '10000000-0000-0000-0000-0000000000b0', 'Priority', '#ef4444'),
  ('10000000-0000-0000-0000-0000000000c2', '10000000-0000-0000-0000-0000000000b1', 'Mobile', '#10b981')
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_folders (id, project_id, name, created_by) VALUES
  ('10000000-0000-0000-0000-0000000000c3', '10000000-0000-0000-0000-0000000000b0', 'Design Assets', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_files (id, project_id, folder_id, name, url, size, mime_type, created_by) VALUES
  ('10000000-0000-0000-0000-0000000000c4', '10000000-0000-0000-0000-0000000000b0', '10000000-0000-0000-0000-0000000000c3', 'wireframes.pdf', 'https://example.com/files/wireframes.pdf', 2048000, 'application/pdf', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_activities (id, project_id, user_id, action, description) VALUES
  ('10000000-0000-0000-0000-0000000000c5', '10000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-00000000000a', 'task_created', 'Created task "Design homepage"')
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_labels (id, name, color, project_id, organization_id, created_by) VALUES
  ('10000000-0000-0000-0000-0000000000d0', 'Bug', '#ef4444', '10000000-0000-0000-0000-0000000000b0', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000000d1', 'Feature', '#3b82f6', '10000000-0000-0000-0000-0000000000b0', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000000d2', 'Design', '#8b5cf6', '10000000-0000-0000-0000-0000000000b0', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 11. TASKS
-- ------------------------------------------------------------
INSERT INTO tasks (id, title, description, project_id, assignee_id, status, priority, due_date, estimated_hours, created_by, organization_id, workspace_id, start_date) VALUES
  ('10000000-0000-0000-0000-0000000000e0', 'Design homepage', 'Create homepage design in Figma', '10000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-00000000000a', 'done', 'high', CURRENT_DATE - 5, 16, '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', CURRENT_DATE - 20),
  ('10000000-0000-0000-0000-0000000000e1', 'Build landing page', 'Implement landing page with Next.js', '10000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-00000000000a', 'in_progress', 'high', CURRENT_DATE + 7, 32, '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', CURRENT_DATE - 3),
  ('10000000-0000-0000-0000-0000000000e2', 'Set up CI/CD', 'Configure pipelines for deployment', '10000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-00000000000a', 'todo', 'medium', CURRENT_DATE + 14, 8, '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', NULL),
  ('10000000-0000-0000-0000-0000000000e3', 'API design', 'Define REST API contracts', '10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000a', 'in_review', 'medium', CURRENT_DATE + 3, 20, '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', CURRENT_DATE - 2),
  ('10000000-0000-0000-0000-0000000000e4', 'Database schema', 'Design and migrate database schema', '10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000a', 'todo', 'urgent', CURRENT_DATE + 10, 24, '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', NULL),
  ('10000000-0000-0000-0000-0000000000e5', 'Data cleanup', 'Clean and normalize legacy data', '10000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000000a', 'in_progress', 'urgent', CURRENT_DATE + 2, 40, '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', CURRENT_DATE - 5),
  ('10000000-0000-0000-0000-0000000000e6', 'Launch marketing site', 'Deploy and launch', '10000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-00000000000a', 'done', 'low', CURRENT_DATE - 12, 12, '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', CURRENT_DATE - 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_checklist_items (id, task_id, text, completed, created_by) VALUES
  ('10000000-0000-0000-0000-0000000000f0', '10000000-0000-0000-0000-0000000000e1', 'Mobile responsive', TRUE, '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000000f1', '10000000-0000-0000-0000-0000000000e1', 'SEO meta tags', FALSE, '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_comments (id, task_id, user_id, content, workspace_id) VALUES
  ('10000000-0000-0000-0000-0000000000f2', '10000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000a', 'Looking good! Just need to adjust the hero section.', '10000000-0000-0000-0000-00000000000b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_subtasks (parent_task_id, child_task_id) VALUES
  ('10000000-0000-0000-0000-0000000000e1', '10000000-0000-0000-0000-0000000000e2')
ON CONFLICT (parent_task_id, child_task_id) DO NOTHING;

INSERT INTO task_dependencies (task_id, depends_on_task_id, type) VALUES
  ('10000000-0000-0000-0000-0000000000e1', '10000000-0000-0000-0000-0000000000e0', 'blocks')
ON CONFLICT (task_id, depends_on_task_id) DO NOTHING;

INSERT INTO task_watchers (task_id, user_id) VALUES
  ('10000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (task_id, user_id) DO NOTHING;

INSERT INTO task_attachments (id, task_id, name, url, size, mime_type, created_by) VALUES
  ('10000000-0000-0000-0000-0000000000f3', '10000000-0000-0000-0000-0000000000e1', 'homepage-spec.pdf', 'https://example.com/files/homepage-spec.pdf', 1048576, 'application/pdf', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_label_assignments (task_id, label_id) VALUES
  ('10000000-0000-0000-0000-0000000000e1', '10000000-0000-0000-0000-0000000000d1')
ON CONFLICT (task_id, label_id) DO NOTHING;

-- ------------------------------------------------------------
-- 12. MILESTONES & SPRINTS
-- ------------------------------------------------------------
INSERT INTO milestones (id, project_id, name, description, status, due_date, sort_order, created_by) VALUES
  ('10000000-0000-0000-0000-000000000100', '10000000-0000-0000-0000-0000000000b0', 'Design Phase', 'Complete all design work', 'completed', CURRENT_DATE - 10, 0, '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-0000000000b0', 'Development Phase', 'Build all pages', 'in_progress', CURRENT_DATE + 20, 1, '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-0000000000b0', 'QA & Launch', 'Test and launch', 'pending', CURRENT_DATE + 55, 2, '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO milestone_tasks (milestone_id, task_id) VALUES
  ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-0000000000e1')
ON CONFLICT (milestone_id, task_id) DO NOTHING;

INSERT INTO sprints (id, project_id, name, goal, status, start_date, end_date, created_by) VALUES
  ('10000000-0000-0000-0000-000000000110', '10000000-0000-0000-0000-0000000000b0', 'Sprint 1', 'Design and build homepage', 'active', CURRENT_DATE - 7, CURRENT_DATE + 7, '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000111', '10000000-0000-0000-0000-0000000000b0', 'Sprint 2', 'Build remaining pages', 'planning', CURRENT_DATE + 8, CURRENT_DATE + 22, '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sprint_tasks (sprint_id, task_id) VALUES
  ('10000000-0000-0000-0000-000000000110', '10000000-0000-0000-0000-0000000000e0'),
  ('10000000-0000-0000-0000-000000000110', '10000000-0000-0000-0000-0000000000e1')
ON CONFLICT (sprint_id, task_id) DO NOTHING;

-- ------------------------------------------------------------
-- 13. TIME ENTRIES
-- ------------------------------------------------------------
INSERT INTO time_entries (id, task_id, user_id, description, start_time, end_time, duration_minutes, billable, billable_rate, workspace_id) VALUES
  ('10000000-0000-0000-0000-000000000120', '10000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000a', 'Building landing page components', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '4 hours', 240, TRUE, 75, '10000000-0000-0000-0000-00000000000b'),
  ('10000000-0000-0000-0000-000000000121', '10000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-00000000000a', 'Designing homepage', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '3 hours', 180, TRUE, 75, '10000000-0000-0000-0000-00000000000b'),
  ('10000000-0000-0000-0000-000000000122', '10000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-00000000000a', 'Cleaning legacy data', NOW() - INTERVAL '1 day', NULL, 300, FALSE, NULL, '10000000-0000-0000-0000-00000000000b')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 14. NOTIFICATIONS, CALENDAR, REPORTS, AI
-- ------------------------------------------------------------
INSERT INTO notifications (id, organization_id, user_id, title, message, type, link) VALUES
  ('10000000-0000-0000-0000-000000000130', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'New task assigned', 'Build landing page was assigned to you', 'info', '/demo-corp/projects/website-redesign/tasks'),
  ('10000000-0000-0000-0000-000000000131', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'Deal won', 'Global Media Suite closed', 'success', '/demo-corp/crm/pipeline'),
  ('10000000-0000-0000-0000-000000000132', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'Invoice overdue', 'Invoice INV-2025-0001 is overdue', 'warning', '/demo-corp/finance/invoices')
ON CONFLICT (id) DO NOTHING;

INSERT INTO calendar_events (id, organization_id, project_id, task_id, title, description, event_type, start_date, end_date, color, created_by) VALUES
  ('10000000-0000-0000-0000-000000000140', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000b0', NULL, 'Design Review', 'Weekly design review', 'meeting', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', '#3b82f6', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000141', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000b0', '10000000-0000-0000-0000-0000000000e1', 'Landing page due', 'Final submission', 'deadline', NOW() + INTERVAL '7 days', NULL, '#ef4444', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO report_definitions (id, organization_id, name, description, report_type, config, created_by) VALUES
  ('10000000-0000-0000-0000-000000000150', '10000000-0000-0000-0000-00000000000a', 'Project Progress', 'Weekly project progress', 'project_progress', '{"period":"weekly"}', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_suggestions (id, organization_id, project_id, suggestion_type, content, created_by) VALUES
  ('10000000-0000-0000-0000-000000000160', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000b0', 'risk_detection', 'Sprint 2 has no tasks assigned yet — consider assigning before the sprint starts.', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_reactions (comment_id, user_id, emoji) VALUES
  ('10000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-00000000000a', '👍')
ON CONFLICT (comment_id, user_id, emoji) DO NOTHING;

-- ------------------------------------------------------------
-- 15. FINANCE — CATEGORIES, TAX RATES, PRODUCTS
-- ------------------------------------------------------------
INSERT INTO finance_product_categories (id, name, description, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000170', 'Services', 'Professional services', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000171', 'Licenses', 'Software licenses', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO finance_tax_rates (id, name, rate, type, is_default, applies_to, organization_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000180', 'GST 18%', 18, 'gst', TRUE, '{"sales"}', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000181', 'VAT 20%', 20, 'vat', FALSE, '{"sales"}', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000182', 'No Tax', 0, 'custom', FALSE, '{}', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO finance_products (id, name, sku, category_id, description, unit_price, unit, tax_rate_id, type, status, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-000000000190', 'Consulting', 'SVC-CON', '10000000-0000-0000-0000-000000000170', 'Hourly consulting', 150, 'hour', '10000000-0000-0000-0000-000000000180', 'service', 'active', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000191', 'Development', 'SVC-DEV', '10000000-0000-0000-0000-000000000170', 'Custom development', 100, 'hour', '10000000-0000-0000-0000-000000000180', 'service', 'active', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000192', 'Design', 'SVC-DES', '10000000-0000-0000-0000-000000000170', 'UI/UX design', 120, 'hour', '10000000-0000-0000-0000-000000000180', 'service', 'active', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000193', 'Starter License', 'LIC-STAR', '10000000-0000-0000-0000-000000000171', 'Starter plan', 500, 'license', '10000000-0000-0000-0000-000000000182', 'product', 'active', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 16. FINANCE — QUOTATIONS
-- ------------------------------------------------------------
INSERT INTO finance_quotations (id, quote_number, client_name, client_email, client_phone, company_id, deal_id, project_id, issue_date, expiry_date, currency, subtotal, discount_type, discount_value, discount_amount, tax_amount, total, notes, status, type, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-0000000001a0', 'QT-2026-0001', 'Demo Corp', 'billing@democorp.com', '+1-555-0100', '10000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-0000000000b0', CURRENT_DATE, CURRENT_DATE + 30, 'USD', 15000, 'percentage', 5, 750, 2565, 16815, 'Valid for 30 days', 'sent', 'quote', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001a1', 'QT-2026-0002', 'TechStart Inc', 'hello@techstart.io', '+1-555-0101', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000061', '10000000-0000-0000-0000-0000000000b1', CURRENT_DATE, CURRENT_DATE + 30, 'USD', 25000, NULL, 0, 0, 4500, 29500, 'Includes onboarding', 'draft', 'quote', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001a2', 'EST-2026-0001', 'CloudNex', 'raj@cloudnex.com', '+1-555-0203', NULL, '10000000-0000-0000-0000-000000000063', NULL, CURRENT_DATE, CURRENT_DATE + 60, 'USD', 60000, NULL, 0, 0, 10800, 70800, 'Detailed estimate', 'accepted', 'estimate', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO finance_quotation_items (id, quotation_id, product_id, description, quantity, unit_price, discount_percent, tax_rate_id, tax_amount, total, sort_order) VALUES
  ('10000000-0000-0000-0000-0000000001a3', '10000000-0000-0000-0000-0000000001a0', '10000000-0000-0000-0000-000000000191', 'Development services', 100, 100, 5, '10000000-0000-0000-0000-000000000180', 1710, 9500, 0),
  ('10000000-0000-0000-0000-0000000001a4', '10000000-0000-0000-0000-0000000001a0', '10000000-0000-0000-0000-000000000192', 'Design services', 50, 120, 0, '10000000-0000-0000-0000-000000000180', 1080, 6000, 1),
  ('10000000-0000-0000-0000-0000000001a5', '10000000-0000-0000-0000-0000000001a1', '10000000-0000-0000-0000-000000000193', 'Starter License', 50, 500, 0, '10000000-0000-0000-0000-000000000182', 0, 25000, 0)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 17. FINANCE — INVOICES
-- ------------------------------------------------------------
INSERT INTO finance_invoices (id, invoice_number, client_name, client_email, client_phone, company_id, deal_id, project_id, quotation_id, issue_date, due_date, currency, subtotal, discount_amount, tax_amount, total, amount_paid, balance_due, status, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-0000000001b0', 'INV-2026-0001', 'Demo Corp', 'billing@democorp.com', '+1-555-0100', '10000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-0000000000b0', '10000000-0000-0000-0000-0000000001a0', CURRENT_DATE - 20, CURRENT_DATE + 10, 'USD', 15000, 750, 2565, 16815, 16815, 0, 'paid', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001b1', 'INV-2026-0002', 'TechStart Inc', 'hello@techstart.io', '+1-555-0101', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000061', NULL, NULL, CURRENT_DATE - 5, CURRENT_DATE + 25, 'USD', 12000, 0, 2160, 14160, 0, 14160, 'sent', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001b2', 'INV-2026-0003', 'Global Media', 'contact@globalmedia.com', '+1-555-0102', '10000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000062', '10000000-0000-0000-0000-0000000000b3', NULL, CURRENT_DATE - 45, CURRENT_DATE - 15, 'USD', 25000, 0, 4500, 29500, 10000, 19500, 'partial', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001b3', 'INV-2026-0004', 'CloudNex', 'raj@cloudnex.com', '+1-555-0203', NULL, '10000000-0000-0000-0000-000000000063', '10000000-0000-0000-0000-0000000000b2', NULL, CURRENT_DATE - 40, CURRENT_DATE - 10, 'USD', 30000, 0, 5400, 35400, 0, 35400, 'overdue', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001b4', 'INV-2026-0005', 'RetailPlus', 'lisa@retailplus.com', '+1-555-0204', NULL, NULL, NULL, NULL, CURRENT_DATE, CURRENT_DATE + 30, 'USD', 8000, 0, 1440, 9440, 0, 9440, 'draft', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO finance_invoice_items (id, invoice_id, product_id, description, quantity, unit_price, discount_percent, tax_rate_id, tax_amount, total, sort_order) VALUES
  ('10000000-0000-0000-0000-0000000001b5', '10000000-0000-0000-0000-0000000001b0', '10000000-0000-0000-0000-000000000191', 'Development services', 100, 100, 5, '10000000-0000-0000-0000-000000000180', 1710, 9500, 0),
  ('10000000-0000-0000-0000-0000000001b6', '10000000-0000-0000-0000-0000000001b0', '10000000-0000-0000-0000-000000000192', 'Design services', 50, 120, 0, '10000000-0000-0000-0000-000000000180', 1080, 6000, 1),
  ('10000000-0000-0000-0000-0000000001b7', '10000000-0000-0000-0000-0000000001b1', '10000000-0000-0000-0000-000000000191', 'Development services', 120, 100, 0, '10000000-0000-0000-0000-000000000180', 2160, 12000, 0),
  ('10000000-0000-0000-0000-0000000001b8', '10000000-0000-0000-0000-0000000001b3', '10000000-0000-0000-0000-000000000190', 'Consulting services', 200, 150, 0, '10000000-0000-0000-0000-000000000180', 5400, 30000, 0)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 18. FINANCE — PAYMENTS
-- ------------------------------------------------------------
INSERT INTO finance_payments (id, invoice_id, amount, currency, payment_method_name, transaction_reference, status, payment_date, notes, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-0000000001c0', '10000000-0000-0000-0000-0000000001b0', 16815, 'USD', 'Bank Transfer', 'TXN-1001', 'completed', NOW() - INTERVAL '15 days', 'Full payment received', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001c1', '10000000-0000-0000-0000-0000000001b2', 5000, 'USD', 'Credit Card', 'TXN-1002', 'completed', NOW() - INTERVAL '30 days', 'First installment', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001c2', '10000000-0000-0000-0000-0000000001b2', 5000, 'USD', 'Bank Transfer', 'TXN-1003', 'completed', NOW() - INTERVAL '10 days', 'Second installment', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 19. FINANCE — EXPENSES
-- ------------------------------------------------------------
INSERT INTO finance_expense_categories (id, name, description, color, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-0000000001d0', 'Software', 'Software subscriptions', '#3b82f6', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001d1', 'Travel', 'Travel and accommodation', '#f59e0b', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001d2', 'Office', 'Office supplies', '#10b981', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001d3', 'Equipment', 'Hardware and equipment', '#8b5cf6', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO finance_expenses (id, title, category_id, vendor, project_id, amount, currency, expense_date, notes, billable, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-0000000001e0', 'Figma subscription', '10000000-0000-0000-0000-0000000001d0', 'Figma', '10000000-0000-0000-0000-0000000000b0', 45, 'USD', CURRENT_DATE - 5, 'Monthly design tool', TRUE, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001e1', 'AWS hosting', '10000000-0000-0000-0000-0000000001d0', 'Amazon', '10000000-0000-0000-0000-0000000000b0', 320, 'USD', CURRENT_DATE - 12, 'Cloud hosting', TRUE, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001e2', 'Team lunch', '10000000-0000-0000-0000-0000000001d1', 'Local Bistro', NULL, 120, 'USD', CURRENT_DATE - 3, 'Client meeting lunch', FALSE, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001e3', 'New monitors', '10000000-0000-0000-0000-0000000001d3', 'Best Buy', '10000000-0000-0000-0000-0000000000b1', 600, 'USD', CURRENT_DATE - 20, 'Dual monitors for dev', TRUE, '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 20. FINANCE — PURCHASE ORDERS
-- ------------------------------------------------------------
INSERT INTO finance_purchase_orders (id, po_number, vendor_name, vendor_email, vendor_phone, project_id, issue_date, delivery_date, currency, subtotal, tax_amount, total, status, organization_id, workspace_id, created_by) VALUES
  ('10000000-0000-0000-0000-0000000001f0', 'PO-2026-0001', 'Amazon Web Services', 'billing@aws.com', '+1-555-0400', '10000000-0000-0000-0000-0000000000b0', CURRENT_DATE, CURRENT_DATE + 7, 'USD', 2000, 0, 2000, 'approved', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001f1', 'PO-2026-0002', 'Apple Inc', 'procurement@apple.com', '+1-555-0401', '10000000-0000-0000-0000-0000000000b1', CURRENT_DATE - 2, CURRENT_DATE + 14, 'USD', 4500, 0, 4500, 'pending_approval', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-0000000001f2', 'PO-2026-0003', 'Dell Technologies', 'sales@dell.com', '+1-555-0402', NULL, CURRENT_DATE - 10, CURRENT_DATE + 5, 'USD', 1500, 0, 1500, 'received', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO finance_purchase_order_items (id, purchase_order_id, product_id, description, quantity, unit_price, tax_rate_id, tax_amount, total, sort_order) VALUES
  ('10000000-0000-0000-0000-0000000001f3', '10000000-0000-0000-0000-0000000001f0', NULL, 'AWS credits', 2000, 1, '10000000-0000-0000-0000-000000000182', 0, 2000, 0),
  ('10000000-0000-0000-0000-0000000001f4', '10000000-0000-0000-0000-0000000001f1', NULL, 'MacBook Pro', 3, 1500, '10000000-0000-0000-0000-000000000182', 0, 4500, 0),
  ('10000000-0000-0000-0000-0000000001f5', '10000000-0000-0000-0000-0000000001f2', NULL, 'Monitors', 5, 300, '10000000-0000-0000-0000-000000000182', 0, 1500, 0)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 21. API KEYS
-- ------------------------------------------------------------
INSERT INTO api_keys (id, name, key_prefix, key_hash, organization_id, created_by, permissions) VALUES
  ('10000000-0000-0000-0000-0000000001f6', 'Production API Key', 'act_pub_9f3a', 'sha256$demo$hash$notreal', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', ARRAY['project_view','task_view']),
  ('10000000-0000-0000-0000-0000000001f7', 'Dev API Key', 'act_pub_8b2c', 'sha256$demo$hash$notreal2', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', ARRAY['project_view','task_view','crm:leads:read'])
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 22. AUDIT LOGS & ACTIVITIES
-- ------------------------------------------------------------
INSERT INTO audit_logs (id, organization_id, user_id, action, resource, resource_id) VALUES
  ('10000000-0000-0000-0000-000000000200', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'create', 'project', '10000000-0000-0000-0000-0000000000b0'),
  ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'create', 'invoice', '10000000-0000-0000-0000-0000000001b0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activities (id, organization_id, user_id, action, resource, resource_id) VALUES
  ('10000000-0000-0000-0000-000000000210', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'create', 'project', '10000000-0000-0000-0000-0000000000b0'),
  ('10000000-0000-0000-0000-000000000211', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'create', 'deal', '10000000-0000-0000-0000-000000000060')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- DONE
-- ------------------------------------------------------------
SELECT 'Seed complete' AS status;
