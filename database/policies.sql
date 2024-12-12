-- Enable RLS for challenges table
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create challenges
CREATE POLICY "Users can create challenges"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view challenges they have access to
CREATE POLICY "Users can view challenges"
ON public.challenges
FOR SELECT
TO authenticated
USING (
  -- User can see challenges they created
  created_by = auth.uid()
  -- Or challenges in groups they're a member of
  OR (
    group_id IN (
      SELECT group_id 
      FROM public.group_members 
      WHERE user_id = auth.uid()
    )
  )
  -- Or public challenges (when group_id is null)
  OR group_id IS NULL
);

-- Allow challenge creators and group admins to update challenges
CREATE POLICY "Users can update their own challenges"
ON public.challenges
FOR UPDATE
TO authenticated
USING (
  -- Challenge creator can update
  created_by = auth.uid()
  -- Or group admin can update
  OR (
    group_id IN (
      SELECT group_id 
      FROM public.group_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- Allow challenge creators and group admins to delete challenges
CREATE POLICY "Users can delete their own challenges"
ON public.challenges
FOR DELETE
TO authenticated
USING (
  -- Challenge creator can delete
  created_by = auth.uid()
  -- Or group admin can delete
  OR (
    group_id IN (
      SELECT group_id 
      FROM public.group_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- For challenges table
CREATE POLICY "Enable read access for authenticated users"
ON public.challenges
FOR SELECT
TO authenticated
USING (true);

-- For posts table (if not already present)
CREATE POLICY "Enable read access for authenticated users"
ON public.posts
FOR SELECT
TO authenticated
USING (true); 