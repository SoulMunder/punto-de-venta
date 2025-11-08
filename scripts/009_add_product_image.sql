-- Add image_url field to products table
ALTER TABLE products ADD COLUMN image_url TEXT;

COMMENT ON COLUMN products.image_url IS 'URL of the product image stored in Vercel Blob';
