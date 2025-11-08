-- Insert two branches
INSERT INTO public.branches (id, name, address) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sucursal Centro', 'Av. Principal #123, Centro'),
  ('00000000-0000-0000-0000-000000000002', 'Sucursal Norte', 'Calle Secundaria #456, Zona Norte')
ON CONFLICT (id) DO NOTHING;
