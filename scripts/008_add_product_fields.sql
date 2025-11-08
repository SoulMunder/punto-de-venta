-- Add new fields to products table for characteristics and fiscal information
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS characteristics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fiscal_product_key TEXT,
ADD COLUMN IF NOT EXISTS fiscal_tax_type TEXT;

-- Create index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_products_characteristics ON public.products USING gin(characteristics);

COMMENT ON COLUMN public.products.characteristics IS 'Key-value pairs for product characteristics';
COMMENT ON COLUMN public.products.fiscal_product_key IS 'SAT product/service key for fiscal purposes';
COMMENT ON COLUMN public.products.fiscal_tax_type IS 'Tax type for fiscal purposes';
