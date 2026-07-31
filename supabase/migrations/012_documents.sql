-- ACT OS Phase 6 — Documents & Business Knowledge
-- Follows existing conventions: UUID PKs, organization_id isolation,
-- created_by/created_at/updated_at/deleted_at, update_updated_at() triggers,
-- RLS via is_org_member/is_project_member helpers + role-level helpers.

-- ============================================================================
-- RLS helpers for document access (member / manager / admin tiers)
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

-- A user is an org member
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = org_id AND om.user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO anon, authenticated;

-- ============================================================================
-- FOLDERS
-- ============================================================================
CREATE TABLE document_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_document_folders_updated_at
  BEFORE UPDATE ON document_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_document_folders_org ON document_folders(organization_id, deleted_at);
CREATE INDEX idx_document_folders_parent ON document_folders(parent_id);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'document'
    CHECK (document_type IN (
      'document', 'sop', 'policy', 'contract', 'proposal', 'agreement', 'invoice',
      'project_document', 'hr_document', 'training', 'meeting_notes',
      'knowledge_article', 'internal', 'technical', 'custom'
    )),
  content JSONB,
  content_text TEXT,
  mime_type TEXT DEFAULT 'text/plain',
  file_url TEXT,
  file_size INTEGER DEFAULT 0,
  folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES hr_departments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'approval', 'approved', 'published', 'archived')),
  current_version INTEGER DEFAULT 1,
  is_archived BOOLEAN DEFAULT FALSE,
  expiration_date TIMESTAMPTZ,
  effective_date TIMESTAMPTZ,
  template_id UUID,
  tags TEXT[] DEFAULT '{}',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_documents_org ON documents(organization_id, deleted_at);
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_type ON documents(organization_id, document_type, deleted_at);
CREATE INDEX idx_documents_status ON documents(organization_id, status, deleted_at);
CREATE INDEX idx_documents_owner ON documents(organization_id, owner_id, deleted_at);
CREATE INDEX idx_documents_expiration ON documents(organization_id, expiration_date);

-- ============================================================================
-- DOCUMENT VERSIONS
-- ============================================================================
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB,
  content_text TEXT,
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_document_versions_doc ON document_versions(document_id, version_number DESC);

-- ============================================================================
-- DOCUMENT SHARES
-- ============================================================================
CREATE TABLE document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL DEFAULT 'user'
    CHECK (share_type IN ('user', 'team', 'department', 'organization', 'link')),
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  shared_with_department_id UUID REFERENCES hr_departments(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view'
    CHECK (permission IN ('view', 'comment', 'edit', 'manage')),
  share_token TEXT,
  expires_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_document_shares_doc ON document_shares(document_id);
CREATE INDEX idx_document_shares_user ON document_shares(shared_with_user_id);
CREATE INDEX idx_document_shares_token ON document_shares(share_token);

-- ============================================================================
-- DOCUMENT COMMENTS
-- ============================================================================
CREATE TABLE document_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]',
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER update_document_comments_updated_at
  BEFORE UPDATE ON document_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_document_comments_doc ON document_comments(document_id, created_at);
CREATE INDEX idx_document_comments_parent ON document_comments(parent_id);

-- ============================================================================
-- DOCUMENT APPROVALS
-- ============================================================================
CREATE TABLE document_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  comment TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);
CREATE TRIGGER update_document_approvals_updated_at
  BEFORE UPDATE ON document_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_document_approvals_doc ON document_approvals(document_id);
CREATE INDEX idx_document_approvals_status ON document_approvals(organization_id, status);

CREATE TABLE document_approval_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_id UUID NOT NULL REFERENCES document_approvals(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  comment TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_doc_approval_history ON document_approval_history(approval_id, created_at);

-- ============================================================================
-- DOCUMENT TEMPLATES
-- ============================================================================
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'document',
  content JSONB,
  content_text TEXT,
  category TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_document_templates_org ON document_templates(organization_id, deleted_at);

-- ============================================================================
-- KNOWLEDGE BASE
-- ============================================================================
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT,
  content JSONB,
  content_text TEXT,
  category TEXT NOT NULL DEFAULT 'General'
    CHECK (category IN ('Company', 'Sales', 'Operations', 'Finance', 'HR', 'Projects', 'Customer Support', 'Engineering', 'Policies', 'General')),
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_knowledge_articles_updated_at
  BEFORE UPDATE ON knowledge_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_knowledge_articles_org ON knowledge_articles(organization_id, category, status, deleted_at);

-- ============================================================================
-- SOPs
-- ============================================================================
CREATE TABLE document_sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  purpose TEXT,
  scope TEXT,
  department_id UUID REFERENCES hr_departments(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  steps JSONB DEFAULT '[]',
  required_inputs JSONB DEFAULT '[]',
  expected_outputs JSONB DEFAULT '[]',
  related_document_ids UUID[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  approval_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft', 'review', 'approved', 'published', 'archived')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_document_sops_updated_at
  BEFORE UPDATE ON document_sops FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_document_sops_org ON document_sops(organization_id, deleted_at);

-- ============================================================================
-- POLICIES
-- ============================================================================
CREATE TABLE document_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  policy_type TEXT NOT NULL DEFAULT 'company'
    CHECK (policy_type IN ('company', 'hr', 'finance', 'security', 'it', 'department')),
  summary TEXT,
  content JSONB,
  content_text TEXT,
  department_id UUID REFERENCES hr_departments(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  effective_date DATE,
  expiration_date DATE,
  approval_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft', 'review', 'approved', 'published', 'archived')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_document_policies_updated_at
  BEFORE UPDATE ON document_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_document_policies_org ON document_policies(organization_id, policy_type, deleted_at);

-- ============================================================================
-- CONTRACTS
-- ============================================================================
CREATE TABLE document_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contract_number TEXT,
  customer_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  renewal_date DATE,
  value NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'expiring', 'expired', 'renewed', 'cancelled', 'terminated')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_document_contracts_updated_at
  BEFORE UPDATE ON document_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_document_contracts_org ON document_contracts(organization_id, status, deleted_at);
CREATE INDEX idx_document_contracts_renewal ON document_contracts(organization_id, renewal_date);
CREATE INDEX idx_document_contracts_end ON document_contracts(organization_id, end_date);

-- ============================================================================
-- DOCUMENT RELATIONSHIPS (document -> CRM / projects / finance / HR / tasks)
-- ============================================================================
CREATE TABLE document_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL
    CHECK (entity_type IN (
      'lead', 'company', 'contact', 'deal', 'project', 'task', 'milestone',
      'invoice', 'quotation', 'employee', 'department', 'template'
    )),
  entity_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_document_relationships_doc ON document_relationships(document_id);
CREATE INDEX idx_document_relationships_entity ON document_relationships(entity_type, entity_id);

-- ============================================================================
-- DOCUMENT ACTIVITY (audit timeline — reuses activities conventions)
-- ============================================================================
CREATE TABLE document_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  document_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_document_activities_org ON document_activities(organization_id, created_at DESC);
CREATE INDEX idx_document_activities_doc ON document_activities(document_id, created_at DESC);

-- ============================================================================
-- DOCUMENT ACCESS FUNCTIONS (defined after tables so SQL function bodies resolve)
--   can_edit_document: manager/admin OR document creator/owner OR explicit share with edit/manage
--   can_view_document: org member (documents are company knowledge) OR explicit share
--   can_manage_document: manager/admin OR explicit share with manage
-- ============================================================================
CREATE OR REPLACE FUNCTION public.can_edit_document(doc_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = doc_id
      AND (
        d.created_by = auth.uid()
        OR d.owner_id = auth.uid()
        OR public.is_org_manager(d.organization_id)
        OR EXISTS (
          SELECT 1 FROM document_shares ds
          WHERE ds.document_id = d.id
            AND ds.permission IN ('edit', 'manage')
            AND (
              ds.share_type = 'organization'
              OR (ds.share_type = 'user' AND ds.shared_with_user_id = auth.uid())
              OR (ds.share_type = 'team' AND EXISTS (
                SELECT 1 FROM team_members tm WHERE tm.team_id = ds.shared_with_team_id AND tm.user_id = auth.uid()
              ))
              OR (ds.share_type = 'department' AND EXISTS (
                SELECT 1 FROM hr_employees he
                WHERE he.department_id = ds.shared_with_department_id AND he.user_id = auth.uid()
              ))
            )
        )
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.can_edit_document(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_view_document(doc_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = doc_id
      AND (
        public.is_org_member(d.organization_id)
        OR EXISTS (
          SELECT 1 FROM document_shares ds
          WHERE ds.document_id = d.id
            AND (
              ds.share_type = 'organization'
              OR (ds.share_type = 'user' AND ds.shared_with_user_id = auth.uid())
              OR (ds.share_type = 'team' AND EXISTS (
                SELECT 1 FROM team_members tm WHERE tm.team_id = ds.shared_with_team_id AND tm.user_id = auth.uid()
              ))
              OR (ds.share_type = 'department' AND EXISTS (
                SELECT 1 FROM hr_employees he
                WHERE he.department_id = ds.shared_with_department_id AND he.user_id = auth.uid()
              ))
            )
        )
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.can_view_document(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_document(doc_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = doc_id
      AND (
        d.created_by = auth.uid()
        OR d.owner_id = auth.uid()
        OR public.is_org_manager(d.organization_id)
        OR EXISTS (
          SELECT 1 FROM document_shares ds
          WHERE ds.document_id = d.id
            AND ds.permission = 'manage'
            AND (
              ds.share_type = 'organization'
              OR (ds.share_type = 'user' AND ds.shared_with_user_id = auth.uid())
              OR (ds.share_type = 'team' AND EXISTS (
                SELECT 1 FROM team_members tm WHERE tm.team_id = ds.shared_with_team_id AND tm.user_id = auth.uid()
              ))
              OR (ds.share_type = 'department' AND EXISTS (
                SELECT 1 FROM hr_employees he
                WHERE he.department_id = ds.shared_with_department_id AND he.user_id = auth.uid()
              ))
            )
        )
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.can_manage_document(UUID) TO anon, authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_activities ENABLE ROW LEVEL SECURITY;

-- Folders: org members can view; managers create/manage; admins delete
CREATE POLICY "Members can view folders" ON document_folders FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create folders" ON document_folders FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update folders" ON document_folders FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete folders" ON document_folders FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Documents: org members can view (knowledge is org-shared); creators/managers edit; admins delete
CREATE POLICY "Members can view documents" ON documents FOR SELECT
  USING (public.can_view_document(id) AND deleted_at IS NULL);
CREATE POLICY "Members can create documents" ON documents FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Editors can update documents" ON documents FOR UPDATE
  USING (public.can_edit_document(id) AND deleted_at IS NULL)
  WITH CHECK (public.can_edit_document(id) AND deleted_at IS NULL);
CREATE POLICY "Admins can delete documents" ON documents FOR DELETE
  USING (public.is_org_admin(organization_id) OR created_by = auth.uid());

-- Versions
CREATE POLICY "Members can view versions" ON document_versions FOR SELECT
  USING (public.can_view_document(document_id));
CREATE POLICY "Editors can create versions" ON document_versions FOR INSERT
  WITH CHECK (public.can_edit_document(document_id));

-- Shares
CREATE POLICY "Members can view shares" ON document_shares FOR SELECT
  USING (public.can_view_document(document_id));
CREATE POLICY "Editors can share documents" ON document_shares FOR INSERT
  WITH CHECK (public.can_edit_document(document_id));
CREATE POLICY "Editors can update shares" ON document_shares FOR UPDATE
  USING (public.can_edit_document(document_id));
CREATE POLICY "Editors can delete shares" ON document_shares FOR DELETE
  USING (public.can_edit_document(document_id));

-- Comments: view if can view doc; create if can view doc; resolve/update by creator or editor
CREATE POLICY "Members can view comments" ON document_comments FOR SELECT
  USING (public.can_view_document(document_id));
CREATE POLICY "Members can create comments" ON document_comments FOR INSERT
  WITH CHECK (public.can_view_document(document_id));
CREATE POLICY "Editors can update comments" ON document_comments FOR UPDATE
  USING (public.can_view_document(document_id) AND (created_by = auth.uid() OR public.can_edit_document(document_id)));

-- Approvals
CREATE POLICY "Members can view approvals" ON document_approvals FOR SELECT
  USING (public.can_view_document(document_id));
CREATE POLICY "Editors can create approvals" ON document_approvals FOR INSERT
  WITH CHECK (public.can_edit_document(document_id));
CREATE POLICY "Reviewers can update approvals" ON document_approvals FOR UPDATE
  USING (
    public.can_edit_document(document_id)
    OR assigned_to = auth.uid()
    OR public.is_org_manager(organization_id)
  );

CREATE POLICY "Members can view approval history" ON document_approval_history FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Editors can create approval history" ON document_approval_history FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

-- Templates
CREATE POLICY "Members can view templates" ON document_templates FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create templates" ON document_templates FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update templates" ON document_templates FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "Admins can delete templates" ON document_templates FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Knowledge base
CREATE POLICY "Members can view articles" ON knowledge_articles FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create articles" ON knowledge_articles FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update articles" ON knowledge_articles FOR UPDATE
  USING (public.is_org_member(organization_id) AND (created_by = auth.uid() OR public.is_org_manager(organization_id)));
CREATE POLICY "Admins can delete articles" ON knowledge_articles FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- SOPs
CREATE POLICY "Members can view SOPs" ON document_sops FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create SOPs" ON document_sops FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update SOPs" ON document_sops FOR UPDATE
  USING (public.is_org_member(organization_id) AND (created_by = auth.uid() OR public.is_org_manager(organization_id)));
CREATE POLICY "Admins can delete SOPs" ON document_sops FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Policies
CREATE POLICY "Members can view policies" ON document_policies FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create policies" ON document_policies FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update policies" ON document_policies FOR UPDATE
  USING (public.is_org_member(organization_id) AND (created_by = auth.uid() OR public.is_org_manager(organization_id)));
CREATE POLICY "Admins can delete policies" ON document_policies FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Contracts
CREATE POLICY "Members can view contracts" ON document_contracts FOR SELECT
  USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Members can create contracts" ON document_contracts FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Members can update contracts" ON document_contracts FOR UPDATE
  USING (public.is_org_member(organization_id) AND (created_by = auth.uid() OR public.is_org_manager(organization_id)));
CREATE POLICY "Admins can delete contracts" ON document_contracts FOR DELETE
  USING (public.is_org_member(organization_id) AND public.is_org_admin(organization_id));

-- Relationships
CREATE POLICY "Members can view relationships" ON document_relationships FOR SELECT
  USING (public.can_view_document(document_id));
CREATE POLICY "Editors can create relationships" ON document_relationships FOR INSERT
  WITH CHECK (public.can_edit_document(document_id));
CREATE POLICY "Editors can delete relationships" ON document_relationships FOR DELETE
  USING (public.can_edit_document(document_id));

-- Activities: any member can insert (audit), all can view
CREATE POLICY "Members can view document activities" ON document_activities FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "Members can create document activities" ON document_activities FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

-- ============================================================================
-- STORAGE BUCKET for uploaded documents
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  TRUE,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
    'application/zip',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Org members may upload documents
CREATE POLICY "Org members can upload documents" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  );

-- Org members may view documents
CREATE POLICY "Org members can view documents" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  );

-- Org members may replace documents
CREATE POLICY "Org members can replace documents" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  );

-- Admins may delete documents
CREATE POLICY "Org members can delete documents" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  );

-- ============================================================================
-- PERMISSIONS (slug convention: document_<resource>_<action>)
-- ============================================================================
INSERT INTO permissions (name, slug, description, resource, action) VALUES
  ('View Documents', 'document_view', 'View documents and knowledge', 'document', 'view'),
  ('Create Documents', 'document_create', 'Create documents and folders', 'document', 'create'),
  ('Update Documents', 'document_update', 'Edit documents', 'document', 'update'),
  ('Delete Documents', 'document_delete', 'Delete documents', 'document', 'delete'),
  ('Share Documents', 'document_share', 'Share documents', 'document', 'share'),
  ('Approve Documents', 'document_approve', 'Approve documents', 'document', 'approve'),
  ('Publish Documents', 'document_publish', 'Publish documents', 'document', 'publish'),
  ('Manage Templates', 'document_template_manage', 'Manage document templates', 'document_template', 'manage'),
  ('Manage Knowledge', 'knowledge_manage', 'Manage knowledge base', 'knowledge', 'manage'),
  ('Manage SOPs', 'document_sop_manage', 'Manage SOPs', 'document_sop', 'manage'),
  ('Manage Policies', 'document_policy_manage', 'Manage policies', 'document_policy', 'manage'),
  ('Manage Contracts', 'document_contract_manage', 'Manage contracts', 'document_contract', 'manage'),
  ('Manage Document Expiration', 'document_expiration_manage', 'Configure expiration rules', 'document_expiration', 'manage'),
  ('View Document Activity', 'document_activity_view', 'View document audit activity', 'document_activity', 'view')
ON CONFLICT (slug) DO NOTHING;
