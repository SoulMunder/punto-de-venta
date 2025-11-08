-- Enable Row Level Security on user_branches table
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_branches
CREATE POLICY "Users can view their own branch assignments"
  ON public.user_branches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all branch assignments"
  ON public.user_branches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage branch assignments"
  ON public.user_branches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
