-- Function to update product prices from purchases
CREATE OR REPLACE FUNCTION update_product_price_from_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET purchase_price = NEW.purchase_price,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product prices when purchase items are created
CREATE TRIGGER trigger_update_product_price
  AFTER INSERT ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_price_from_purchase();

-- Function to update inventory on purchase
CREATE OR REPLACE FUNCTION update_inventory_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  -- Get the branch_id from the purchase
  SELECT branch_id INTO v_branch_id
  FROM public.purchases
  WHERE id = NEW.purchase_id;

  -- Insert or update inventory
  INSERT INTO public.inventory (product_id, branch_id, quantity, updated_at)
  VALUES (NEW.product_id, v_branch_id, NEW.quantity, NOW())
  ON CONFLICT (product_id, branch_id)
  DO UPDATE SET
    quantity = public.inventory.quantity + NEW.quantity,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory when purchase items are created
CREATE TRIGGER trigger_update_inventory_purchase
  AFTER INSERT ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_purchase();

-- Function to update inventory on sale
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  -- Get the branch_id from the sale
  SELECT branch_id INTO v_branch_id
  FROM public.sales
  WHERE id = NEW.sale_id;

  -- Update inventory (decrease quantity)
  UPDATE public.inventory
  SET quantity = quantity - NEW.quantity,
      updated_at = NOW()
  WHERE product_id = NEW.product_id
    AND branch_id = v_branch_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory when sale items are created
CREATE TRIGGER trigger_update_inventory_sale
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cashier')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at columns
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
