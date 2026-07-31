-- ACT OS Phase 4 — Finance Storage Buckets & Receipts Policies

-- Bucket for expense receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  TRUE,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Org members may upload receipts into their org folder
CREATE POLICY "Members can upload receipts" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Org members may view receipts in their org folder
CREATE POLICY "Members can view receipts" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Org members may update receipts in their org folder
CREATE POLICY "Members can update receipts" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Org members may delete receipts in their org folder
CREATE POLICY "Members can delete receipts" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
    )
  );
