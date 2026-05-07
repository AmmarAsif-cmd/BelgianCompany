-- ============================================================
-- Belgian Waffle Co. — Stock Tracker Schema
-- Paste this into the Supabase SQL editor and run it.
-- ============================================================

-- Enable UUID generation (already on in Supabase, but safe to include)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── stores ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  brand_color  text NOT NULL,
  pin          text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- ── suppliers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  display_order int  NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- ── items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text    NOT NULL,
  category    text    NOT NULL,
  supplier_id uuid    NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  min_stock   int     NOT NULL DEFAULT 2,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- ── counts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS counts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid NOT NULL REFERENCES stores(id)  ON DELETE CASCADE,
  item_id     uuid NOT NULL REFERENCES items(id)   ON DELETE CASCADE,
  week_start  date NOT NULL,
  quantity    int  NOT NULL,
  counted_by  text,
  counted_at  timestamptz DEFAULT now(),
  UNIQUE (store_id, item_id, week_start)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE stores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE counts    ENABLE ROW LEVEL SECURITY;

-- Reference data is readable by any authenticated session
CREATE POLICY "stores_select"    ON stores    FOR SELECT TO authenticated USING (true);
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_select"     ON items     FOR SELECT TO authenticated USING (true);

-- Counts: any authenticated user can read (for cross-store dashboard view)
CREATE POLICY "counts_select"
  ON counts FOR SELECT TO authenticated
  USING (true);

-- Counts: INSERT/UPDATE only allowed for own store (matched via JWT user_metadata)
CREATE POLICY "counts_insert"
  ON counts FOR INSERT TO authenticated
  WITH CHECK (
    store_id = (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid
  );

CREATE POLICY "counts_update"
  ON counts FOR UPDATE TO authenticated
  USING (
    store_id = (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid
  )
  WITH CHECK (
    store_id = (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid
  );

-- ============================================================
-- Anonymous auth must be enabled in Supabase Dashboard:
--   Authentication → Providers → Anonymous Sign-ins → Enable
-- ============================================================
