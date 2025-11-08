-- Fix foreign key constraints to allow user deletion
-- This allows deleting users even if they have created purchases or sales
-- The created_by field will be set to NULL to preserve the records for audit purposes

-- First, make created_by nullable in purchases and sales tables
ALTER TABLE public.purchases 
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.sales 
  ALTER COLUMN created_by DROP NOT NULL;

-- Drop existing foreign key constraints
ALTER TABLE public.purchases 
  DROP CONSTRAINT IF EXISTS purchases_created_by_fkey;

ALTER TABLE public.sales 
  DROP CONSTRAINT IF EXISTS sales_created_by_fkey;

-- Recreate foreign key constraints with ON DELETE SET NULL
ALTER TABLE public.purchases 
  ADD CONSTRAINT purchases_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE public.sales 
  ADD CONSTRAINT sales_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Also check user_branches table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_branches') THEN
    -- Drop existing constraint
    ALTER TABLE public.user_branches 
      DROP CONSTRAINT IF EXISTS user_branches_user_id_fkey;
    
    -- Recreate with CASCADE to delete user_branches when user is deleted
    ALTER TABLE public.user_branches 
      ADD CONSTRAINT user_branches_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
  END IF;
END $$;
