-- Run in Supabase SQL Editor if your project was created from an older schema.sql
-- without anon read on stores (PIN login then fails with "Store not found.").

DROP POLICY IF EXISTS "stores_select_anon" ON stores;
CREATE POLICY "stores_select_anon" ON stores FOR SELECT TO anon USING (true);
