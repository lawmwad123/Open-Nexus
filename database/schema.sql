-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    like_count INTEGER DEFAULT 0 NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view comments"
ON public.comments FOR SELECT
USING (true);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_likes_post_user 
ON public.likes(post_id, user_id);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for likes
CREATE POLICY "Users can create likes"
ON public.likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view likes"
ON public.likes
FOR SELECT
TO authenticated
USING (true);

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_post_like_count ON public.likes;
DROP FUNCTION IF EXISTS public.update_post_like_count();

-- Create a more robust trigger function
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS TRIGGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    -- Calculate the new count
    SELECT COUNT(*)
    INTO new_count
    FROM public.likes
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id);

    -- Update the posts table
    UPDATE public.posts
    SET like_count = new_count,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);

    -- Log the update for debugging
    RAISE NOTICE 'Updated like_count for post % to %', COALESCE(NEW.post_id, OLD.post_id), new_count;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_post_like_count
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_like_count();

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON public.likes(post_id, user_id);

-- Make sure we have an index on post_id for better performance
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(comment_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can create their own likes"
ON public.comment_likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.comment_likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view likes"
ON public.comment_likes FOR SELECT
USING (true);

-- Add trigger to update comment like count
CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.comments
        SET like_count = like_count + 1
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.comments
        SET like_count = like_count - 1
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_like_count
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_comment_like_count();

-- Add share_count column to posts table if it doesn't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0 NOT NULL;

-- Create shares table to track share analytics (optional)
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    platform TEXT, -- e.g., 'twitter', 'whatsapp', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_shares_post_id ON public.shares(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON public.shares(user_id);

-- Enable RLS
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can create shares"
ON public.shares FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view shares"
ON public.shares FOR SELECT
USING (true);

-- Add updated_at column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Update existing rows to have updated_at value
UPDATE public.posts 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Make updated_at NOT NULL after setting default values
ALTER TABLE public.posts 
ALTER COLUMN updated_at SET NOT NULL;

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 