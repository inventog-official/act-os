-- ACT OS — Image & File Buckets (avatars, project-files)

-- ============================================================================
-- avatars: private per-user folder under users/{user_id}
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Owners may upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Owners may view their own avatar
CREATE POLICY "Users can view own avatar" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Owners may replace (upsert) their own avatar
CREATE POLICY "Users can replace own avatar" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Owners may delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ============================================================================
-- project-files: scoped to project_id as first folder segment
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  TRUE,
  104857600,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'text/plain', 'application/json', 'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- Project members may upload files into their project
CREATE POLICY "Project members can upload files" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files'
    AND public.is_project_member(
      (storage.foldername(name))[1]::uuid
    )
  );

-- Project members may view files in their project
CREATE POLICY "Project members can view files" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-files'
    AND (
      public.is_project_member((storage.foldername(name))[1]::uuid)
      OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid()
          AND om.organization_id = (
            SELECT p.organization_id FROM projects p
            WHERE p.id = (storage.foldername(name))[1]::uuid
          )
      )
    )
  );

-- Project members may replace (upsert) files in their project
CREATE POLICY "Project members can replace files" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-files'
    AND public.is_project_member((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'project-files'
    AND public.is_project_member((storage.foldername(name))[1]::uuid)
  );

-- Project members may delete files in their project
CREATE POLICY "Project members can delete files" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-files'
    AND public.is_project_member((storage.foldername(name))[1]::uuid)
  );