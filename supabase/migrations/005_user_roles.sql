-- User Roles (direct user-to-role assignment, distinct from organization_members)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id, organization_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN roles r ON om.role_id = r.id
      WHERE om.user_id = auth.uid() AND r.slug IN ('super_admin', 'admin')
    )
  );
