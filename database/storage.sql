-- First, let's check if the posts bucket exists and is public
SELECT id, name, public, owner FROM storage.buckets WHERE id = 'posts';

-- If it exists but isn't public, update it:
UPDATE storage.buckets 
SET public = true 
WHERE id = 'posts';

-- If it doesn't exist, create it:
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE 
SET public = true;

-- Make sure we have the right policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('posts', 'avatars', 'groups') );

-- Update the upload policy to be more permissive
DROP POLICY IF EXISTS "Authenticated users can upload posts" ON storage.objects;
CREATE POLICY "Authenticated users can upload posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'posts'
    -- Removed the user ID check to make it more permissive for testing
);

-- Enable RLS but make sure public access works
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 