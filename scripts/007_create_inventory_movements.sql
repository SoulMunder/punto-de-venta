-- Create inventory_movements table to track transfers between branches
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_branch_id UUID NOT NULL REFERENCES branches(id),
  to_branch_id UUID NOT NULL REFERENCES branches(id),
  movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_branches CHECK (from_branch_id != to_branch_id)
);

-- Create inventory_movement_items table for products in each movement
CREATE TABLE IF NOT EXISTS inventory_movement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id UUID NOT NULL REFERENCES inventory_movements(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2), -- For reference only
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_movements_from_branch ON inventory_movements(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_to_branch ON inventory_movements(to_branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_by ON inventory_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_items_movement ON inventory_movement_items(movement_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_items_product ON inventory_movement_items(product_id);

COMMENT ON TABLE inventory_movements IS 'Tracks inventory transfers between branches';
COMMENT ON TABLE inventory_movement_items IS 'Individual products in each inventory movement';
