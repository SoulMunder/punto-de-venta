-- Create user_branches junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.user_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, branch_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_branches_user_id ON public.user_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_branch_id ON public.user_branches(branch_id);

-- Migrate existing data from profiles.branch_id to user_branches
INSERT INTO public.user_branches (user_id, branch_id)
SELECT id, branch_id 
FROM public.profiles 
WHERE branch_id IS NOT NULL
ON CONFLICT (user_id, branch_id) DO NOTHING;

-- Note: We keep the branch_id column in profiles for backward compatibility
-- It can represent the "primary" or "default" branch for the user
