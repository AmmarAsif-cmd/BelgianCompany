-- ============================================================
-- Belgian Waffle Co. — Migration 002
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Allow authenticated users to manage items and suppliers (admin)
CREATE POLICY "items_insert" ON items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "items_update" ON items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "items_delete" ON items FOR DELETE TO authenticated USING (true);

CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE TO authenticated USING (true);

-- Saved orders table — persists order lists per store per supplier per week
CREATE TABLE IF NOT EXISTS saved_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  supplier_id   uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name text NOT NULL,
  week_start    date NOT NULL,
  items         jsonb NOT NULL DEFAULT '[]',
  status        text NOT NULL DEFAULT 'pending',  -- pending | sent
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (store_id, supplier_id, week_start)
);

ALTER TABLE saved_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_orders_select" ON saved_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "saved_orders_insert" ON saved_orders FOR INSERT TO authenticated
  WITH CHECK (store_id = (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid);
CREATE POLICY "saved_orders_update" ON saved_orders FOR UPDATE TO authenticated
  USING  (store_id = (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid)
  WITH CHECK (store_id = (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid);
CREATE POLICY "saved_orders_delete" ON saved_orders FOR DELETE TO authenticated
  USING  (store_id = (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid);
