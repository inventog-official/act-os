-- ============================================================
-- ACT OS — Documents & Business Knowledge Seed Data (Phase 6)
-- Run AFTER applying migration 012_documents.sql.
-- Idempotent: safe to re-run.
-- Uses Demo Corp org 10000000-0000-0000-0000-00000000000a,
-- workspace 10000000-0000-0000-0000-00000000000b,
-- demo user 00000000-0000-0000-0000-00000000000a.
-- ============================================================

-- ------------------------------------------------------------
-- 1. FOLDERS
-- ------------------------------------------------------------
INSERT INTO document_folders (id, name, description, parent_id, color, icon, organization_id, workspace_id, created_by) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Company Policies', 'Official company policies and procedures', NULL, '#ef4444', 'badge', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000002', 'SOPs', 'Standard operating procedures', NULL, '#3b82f6', 'list-checks', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000003', 'Contracts', 'Customer and vendor contracts', NULL, '#10b981', 'file-text', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000004', 'Project Documents', 'Documents produced for customer projects', NULL, '#8b5cf6', 'folder', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000005', 'Internal', 'Internal working documents and templates', NULL, '#f59e0b', 'lock', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. DOCUMENTS
-- ------------------------------------------------------------
INSERT INTO documents (id, title, description, document_type, content, content_text, mime_type, folder_id, owner_id, status, current_version, expiration_date, effective_date, template_id, tags, organization_id, workspace_id, created_by, updated_by) VALUES
  ('30000000-0000-0000-0000-000000000010', 'Employee Handbook 2026', 'Company-wide handbook covering culture, benefits, and conduct', 'policy', '{"title":"Employee Handbook"}'::jsonb, 'Welcome to Demo Corp. This handbook covers our culture, benefits, and expected conduct.', 'application/json', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'published', 3, NULL, DATE '2026-01-01'::timestamp, NULL, ARRAY['handbook','culture','benefits'], '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000011', 'Remote Work Policy', 'Guidelines for remote and hybrid work arrangements', 'policy', '{"title":"Remote Work Policy"}'::jsonb, 'Demo Corp supports remote-first work. This policy outlines expectations.', 'application/json', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'published', 2, NULL, DATE '2026-03-01'::timestamp, NULL, ARRAY['remote','hybrid'], '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000012', 'Onboarding SOP', 'Step-by-step onboarding procedure for new hires', 'sop', '{"title":"Onboarding SOP"}'::jsonb, 'Steps for IT setup, HR onboarding, and first-week goals.', 'application/json', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'published', 2, NULL, DATE '2026-02-01'::timestamp, NULL, ARRAY['onboarding','hiring'], '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000013', 'Expense Reimbursement SOP', 'Procedure for submitting and approving expense reports', 'sop', '{"title":"Expense Reimbursement SOP"}'::jsonb, 'How employees submit expenses and how finance reviews them.', 'application/json', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'published', 1, NULL, DATE '2026-01-15'::timestamp, NULL, ARRAY['expenses','finance'], '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000014', 'TechStart Master Agreement', 'Renewable master services agreement with TechStart Inc', 'contract', '{"title":"TechStart Master Agreement"}'::jsonb, 'MSA governing services delivered to TechStart Inc.', 'application/json', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000a', 'approved', 1, NULL, DATE '2025-06-01'::timestamp, NULL, ARRAY['msa','techstart'], '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000015', 'Global Media Renewal Agreement', '2026 renewal agreement with Global Media', 'agreement', '{"title":"Global Media Renewal"}'::jsonb, 'Renewal of services for Global Media, starts next month.', 'application/json', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000a', 'review', 1, NULL, DATE '2026-07-01'::timestamp, NULL, ARRAY['renewal','globalmedia'], '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000016', 'Website Redesign Project Kickoff', 'Kickoff deck and scope for the website redesign project', 'project_document', '{"title":"Project Kickoff"}'::jsonb, 'Project charter, timelines, and deliverables for WEB-01.', 'application/json', '30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000a', 'published', 2, NULL, DATE '2026-08-01'::timestamp, NULL, ARRAY['project','web'], '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000017', 'Mobile App Requirements', 'Requirements document for the mobile application project', 'project_document', '{"title":"Mobile App Requirements"}'::jsonb, 'Functional requirements for the APP-01 mobile app.', 'application/json', '30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000a', 'draft', 1, NULL, NULL, NULL, ARRAY['project','app'], '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000018', 'IDP / Onboarding Template', 'Internal template for new employee onboarding documents', 'internal', '{"title":"Onboarding Template"}'::jsonb, 'Editable template for creating onboarding checklists.', 'application/json', '30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-00000000000a', 'published', 1, NULL, NULL, NULL, ARRAY['template','onboarding'], '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 3. VERSIONS
-- ------------------------------------------------------------
INSERT INTO document_versions (id, document_id, version_number, content, content_text, change_summary, created_by, organization_id) VALUES
  ('30000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000010', 1, '{"title":"Employee Handbook"}'::jsonb, 'Initial handbook.', 'Initial version', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000010', 2, '{"title":"Employee Handbook"}'::jsonb, 'Updated benefits section.', 'Added benefits section', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000010', 3, '{"title":"Employee Handbook"}'::jsonb, 'Full 2026 refresh.', '2026 annual refresh', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000012', 1, '{"title":"Onboarding SOP"}'::jsonb, 'Initial procedure.', 'Initial version', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 4. SHARES
-- ------------------------------------------------------------
INSERT INTO document_shares (id, document_id, share_type, shared_with_user_id, permission, share_token, organization_id, created_by) VALUES
  ('30000000-0000-0000-0000-000000000030', '30000000-0000-0000-0000-000000000010', 'organization', NULL, 'view', NULL, '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000031', '30000000-0000-0000-0000-000000000014', 'organization', NULL, 'view', NULL, '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000032', '30000000-0000-0000-0000-000000000015', 'link', NULL, 'view', 'demo-share-link-global-media', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 5. COMMENTS
-- ------------------------------------------------------------
INSERT INTO document_comments (id, document_id, parent_id, content, mentions, is_resolved, organization_id, created_by) VALUES
  ('30000000-0000-0000-0000-000000000040', '30000000-0000-0000-0000-000000000015', NULL, 'Please confirm start date with client before we approve.', '[]'::jsonb, FALSE, '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000041', '30000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000040', 'Confirmed — effective July 1.', '[]'::jsonb, TRUE, '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 6. APPROVALS
-- ------------------------------------------------------------
INSERT INTO document_approvals (id, document_id, requested_by, assigned_to, status, comment, organization_id) VALUES
  ('30000000-0000-0000-0000-000000000050', '30000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-00000000000a', NULL, 'pending', 'Awaiting final sign-off.', '10000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 7. TEMPLATES
-- ------------------------------------------------------------
INSERT INTO document_templates (id, name, description, document_type, content, content_text, category, organization_id, created_by, is_system) VALUES
  ('30000000-0000-0000-0000-000000000060', 'Blank Proposal', 'Generic project proposal template', 'proposal', '{"title":"Proposal"}'::jsonb, 'Section headings for a standard proposal.', 'Sales', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', TRUE),
  ('30000000-0000-0000-0000-000000000061', 'Meeting Notes', 'Template for capturing meeting minutes', 'meeting_notes', '{"title":"Meeting Notes"}'::jsonb, 'Attendees, agenda, notes, action items.', 'General', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', TRUE),
  ('30000000-0000-0000-0000-000000000062', 'Staff Performance Review', 'Annual performance review form', 'hr_document', '{"title":"Performance Review"}'::jsonb, 'Ratings and comments form for annual reviews.', 'HR', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 8. KNOWLEDGE ARTICLES
-- ------------------------------------------------------------
INSERT INTO knowledge_articles (id, title, summary, content, content_text, category, tags, status, author_id, organization_id, workspace_id, created_by, updated_by) VALUES
  ('30000000-0000-0000-0000-000000000070', 'How to request PTO', 'Step-by-step guide for requesting paid time off', '{"title":"PTO Guide"}'::jsonb, 'Log into the HR portal, click Leave, choose PTO, and submit.', 'HR', ARRAY['pto','leave'], 'published', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000071', 'Sales demo script', 'Canonical script for product demos', '{"title":"Demo Script"}'::jsonb, 'Open with the problem, show the workflow, close with pricing.', 'Sales', ARRAY['sales','demo'], 'published', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000072', 'VPN and laptop setup', 'IT self-service guide for new hardware', '{"title":"VPN and laptop setup"}'::jsonb, 'Follow the IT onboarding checklist to configure your laptop and VPN.', 'Engineering', ARRAY['it','setup'], 'published', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000073', 'Expense policy quick reference', 'What is reimbursable and what is not', '{"title":"Expense Reference"}'::jsonb, 'Meals under $50 are reimbursable; alcohol is not.', 'Finance', ARRAY['expenses','policy'], 'published', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000074', 'Incident response runbook (Draft)', 'Draft runbook for security incidents', '{"title":"Incident Runbook"}'::jsonb, 'Draft in progress: triage, containment, escalation steps.', 'Policies', ARRAY['security','runbook'], 'draft', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 9. SOPS
-- ------------------------------------------------------------
INSERT INTO document_sops (id, title, purpose, scope, department_id, owner_id, steps, required_inputs, expected_outputs, related_document_ids, version, approval_status, organization_id, workspace_id, created_by, updated_by) VALUES
  ('30000000-0000-0000-0000-000000000080', 'Onboarding New Hires', 'Standardize the process for onboarding new employees', 'Applies to all new full-time hires', '20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-00000000000a',
   '[{"title":"IT setup","description":"Provision laptop and accounts","order":1},{"title":"HR paperwork","description":"Collect documents and set up payroll","order":2},{"title":"First week goals","description":"Schedule 1:1s and assign first tasks","order":3}]'::jsonb,
   '["Employee name","Start date","Manager email"]'::jsonb,
   '["Completed onboarding checklist","Welcome email sent"]'::jsonb,
   ARRAY['30000000-0000-0000-0000-000000000012']::uuid[],
   2, 'published', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000081', 'Processing Expense Reports', 'Ensure expense submissions are reviewed quickly', 'Applies to finance reviewers and admins', '20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-00000000000a',
   '[{"title":"Submission","description":"Employee submits report with receipts","order":1},{"title":"Review","description":"Finance checks policy compliance","order":2},{"title":"Reimbursement","description":"Process payment","order":3}]'::jsonb,
   '["Receipts","Expense rationale"]'::jsonb,
   '["Approved or rejected with reason","Payment confirmation"]'::jsonb,
   ARRAY['30000000-0000-0000-0000-000000000013']::uuid[],
   1, 'approved', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 10. POLICIES
-- ------------------------------------------------------------
INSERT INTO document_policies (id, title, policy_type, summary, content, content_text, department_id, owner_id, version, effective_date, expiration_date, approval_status, organization_id, workspace_id, created_by, updated_by) VALUES
  ('30000000-0000-0000-0000-000000000090', 'Code of Conduct', 'company', 'Behavior and ethical standards for all employees', '{"title":"Code of Conduct"}'::jsonb, 'Treat others with respect, avoid conflicts of interest, protect company assets.', NULL, '00000000-0000-0000-0000-00000000000a', 4, DATE '2026-01-01', NULL, 'published', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000091', 'Data Protection Policy', 'security', 'How we handle customer and employee data', '{"title":"Data Protection"}'::jsonb, 'Guest accounts must be reviewed quarterly; data must be encrypted at rest.', NULL, '00000000-0000-0000-0000-00000000000a', 2, DATE '2026-02-15', DATE '2027-12-31', 'published', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000092', 'Social Media Guidelines', 'hr', 'Guidance for representing Demo Corp online', '{"title":"Social Media"}'::jsonb, 'Clarify personal views vs company views when posting.', NULL, '00000000-0000-0000-0000-00000000000a', 1, DATE '2026-04-01', NULL, 'review', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 11. CONTRACTS
-- ------------------------------------------------------------
INSERT INTO document_contracts (id, name, contract_number, customer_id, company_id, deal_id, project_id, start_date, end_date, renewal_date, value, currency, status, owner_id, document_id, notes, organization_id, workspace_id, created_by, updated_by) VALUES
  ('30000000-0000-0000-0000-0000000000a0', 'TechStart Master Services Agreement', 'MSA-2026-001', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000031', NULL, NULL, DATE '2025-06-01', DATE '2026-06-30', DATE '2026-04-15', 120000, 'USD', 'active', '00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000014', 'Renews automatically unless cancelled 30 days prior.', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-0000000000a1', 'Global Media Media Services', 'MSA-2025-014', '10000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000032', NULL, NULL, DATE '2025-03-01', DATE '2026-08-31', DATE '2026-07-15', 240000, 'USD', 'active', '00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000015', 'Renewal in progress.', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-0000000000a2', 'Website Redesign SOW', 'SOW-WEB-01', '10000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000030', NULL, '10000000-0000-0000-0000-0000000000b0', DATE '2026-01-01', DATE '2026-12-31', NULL, 50000, 'USD', 'active', '00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000016', 'Project scope WEB-01.', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-0000000000a3', 'Expired Vendor Agreement', 'VND-2024-008', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000031', NULL, NULL, DATE '2024-01-01', DATE '2024-12-31', NULL, 24000, 'USD', 'expired', '00000000-0000-0000-0000-00000000000a', NULL, 'Not renewed.', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 12. RELATIONSHIPS
-- ------------------------------------------------------------
INSERT INTO document_relationships (id, document_id, entity_type, entity_id, metadata, organization_id, created_by) VALUES
  ('30000000-0000-0000-0000-0000000000b0', '30000000-0000-0000-0000-000000000016', 'project', '10000000-0000-0000-0000-0000000000b0', '{"role":"kickoff"}'::jsonb, '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-0000000000b1', '30000000-0000-0000-0000-000000000014', 'company', '10000000-0000-0000-0000-000000000031', '{"role":"msa"}'::jsonb, '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-0000000000b2', '30000000-0000-0000-0000-000000000015', 'deal', '10000000-0000-0000-0000-000000000060', '{"role":"renewal"}'::jsonb, '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- DONE
-- ------------------------------------------------------------
SELECT 'Documents seed complete' AS status;