-- Add line field to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS line TEXT;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_products_line ON public.products(line);
