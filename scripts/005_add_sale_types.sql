-- Add sale type fields to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS sale_type TEXT DEFAULT 'remision' CHECK (sale_type IN ('remision', 'credito', 'cotizacion')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'confirmed', 'paid')),
ADD COLUMN IF NOT EXISTS parent_sale_id UUID REFERENCES sales(id);

-- Add index for parent_sale_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sales_parent_sale_id ON sales(parent_sale_id);

-- Add index for sale_type for filtering
CREATE INDEX IF NOT EXISTS idx_sales_sale_type ON sales(sale_type);

-- Add index for payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);

-- Update existing sales to have proper payment_status
UPDATE sales SET payment_status = 'paid' WHERE payment_status IS NULL;

COMMENT ON COLUMN sales.sale_type IS 'Type of sale: remision (invoice), credito (credit sale), cotizacion (quote)';
COMMENT ON COLUMN sales.payment_status IS 'Payment status: pending, confirmed, paid';
COMMENT ON COLUMN sales.parent_sale_id IS 'Reference to parent sale if this sale was converted from a quote';
