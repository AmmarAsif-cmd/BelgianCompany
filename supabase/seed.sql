-- ============================================================
-- Belgian Waffle Co. — Seed Data
-- Run this AFTER schema.sql.
-- Uses CTEs so no UUIDs need to be hard-coded.
-- ============================================================

-- ── Stores ───────────────────────────────────────────────────
INSERT INTO stores (name, slug, brand_color, pin) VALUES
  ('Stockport Road', 'stockport-road', '#5D4037', '1234'),
  ('Sale',           'sale',           '#8B5A3C', '5678')
ON CONFLICT (slug) DO NOTHING;

-- ── Suppliers ────────────────────────────────────────────────
INSERT INTO suppliers (name, display_order) VALUES
  ('Zahid Bhai',                       1),
  ('Wington',                          2),
  ('JM Posner',                        3),
  ('Tayyab Bhai',                      4),
  ('Ice Cream - Breaks Pendel Froz',   5),
  ('Frozen Brothers',                  6)
ON CONFLICT DO NOTHING;

-- ── Items ────────────────────────────────────────────────────
-- Uses a CTE to resolve supplier names to IDs inline.
WITH sup AS (
  SELECT id, name FROM suppliers
)
INSERT INTO items (name, category, supplier_id, min_stock)
SELECT i.name, i.category, sup.id, i.min_stock
FROM (VALUES
  -- Zahid Bhai
  ('Nutella',               'Food',      'Zahid Bhai', 2),
  ('Ferrero Chocolate',     'Chocolate', 'Zahid Bhai', 2),
  ('Kinder Bueno',          'Chocolate', 'Zahid Bhai', 2),
  ('White Kinder',          'Chocolate', 'Zahid Bhai', 2),
  ('Aero Mint',             'Chocolate', 'Zahid Bhai', 2),
  ('Terry''s Chocolate',    'Chocolate', 'Zahid Bhai', 2),
  ('Reese''s Chocolate',    'Chocolate', 'Zahid Bhai', 2),
  ('Milky Bar 90g',         'Chocolate', 'Zahid Bhai', 2),
  ('Milky Bar 25g',         'Chocolate', 'Zahid Bhai', 2),
  ('Oreo biscuits',         'Biscuits',  'Zahid Bhai', 2),
  ('Lotus biscuits',        'Biscuits',  'Zahid Bhai', 2),
  ('Jammie Dodgers',        'Biscuits',  'Zahid Bhai', 2),
  ('Maryland Cookies',      'Biscuits',  'Zahid Bhai', 2),
  ('Lotus spread',          'Food',      'Zahid Bhai', 2),
  ('Skittles',              'Sweets',    'Zahid Bhai', 2),
  ('Coffee',                'Drinks',    'Zahid Bhai', 2),
  -- Wington
  ('Voss water',                'Drinks', 'Wington', 2),
  ('Irn Bru bottle',            'Drinks', 'Wington', 2),
  ('Irn Bru cans',              'Drinks', 'Wington', 2),
  ('J2O apple/mango',           'Drinks', 'Wington', 2),
  ('J2O apple/raspberry',       'Drinks', 'Wington', 2),
  ('Red Bull',                  'Drinks', 'Wington', 2),
  ('Red Bull Sugar Free',       'Drinks', 'Wington', 2),
  ('San Pellegrino Limonata',   'Drinks', 'Wington', 2),
  ('San Pellegrino Aranciata',  'Drinks', 'Wington', 2),
  ('Tango apple',               'Drinks', 'Wington', 2),
  ('Chocomel',                  'Drinks', 'Wington', 2),
  ('Rubicon mango',             'Drinks', 'Wington', 2),
  -- Tayyab Bhai
  ('Fudge cake',    'Food',     'Tayyab Bhai', 2),
  ('Mop solution',  'Cleaning', 'Tayyab Bhai', 2),
  ('Dettol spray',  'Cleaning', 'Tayyab Bhai', 2),
  ('Glass cleaner', 'Cleaning', 'Tayyab Bhai', 2),
  ('Tissues',       'Cleaning', 'Tayyab Bhai', 2),
  ('Hand soap',     'Cleaning', 'Tayyab Bhai', 2),
  ('Cling film',    'Cleaning', 'Tayyab Bhai', 2),
  ('Gloves',        'Cleaning', 'Tayyab Bhai', 2),
  -- Ice Cream - Breaks Pendel Froz
  ('Ice cream Mix',   'Food', 'Ice Cream - Breaks Pendel Froz', 2),
  ('Whipped Cream',   'Food', 'Ice Cream - Breaks Pendel Froz', 2)
) AS i(name, category, supplier_name, min_stock)
JOIN sup ON sup.name = i.supplier_name
ON CONFLICT DO NOTHING;
