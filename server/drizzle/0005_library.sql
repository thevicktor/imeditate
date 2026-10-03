-- Full library catalog (plan §4.5). Sound Mind alone is free; every other
-- theme needs the entitlement in min_entitlement. Products rows are
-- placeholders until store SKUs are configured (payments phase).
INSERT INTO themes (id, title, is_free, min_entitlement) VALUES
  ('courage', 'Courage', false, 'full-library'),
  ('trusting-god', 'Trusting God', false, 'full-library'),
  ('peace', 'Peace', false, 'full-library')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_free = EXCLUDED.is_free, min_entitlement = EXCLUDED.min_entitlement;
INSERT INTO products (sku, platform, type, entitlement) VALUES
  ('full-library', 'all', 'sub', 'full-library')
ON CONFLICT (sku) DO NOTHING;
