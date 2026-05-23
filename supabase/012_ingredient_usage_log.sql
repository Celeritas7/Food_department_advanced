-- ============================================
-- Migration: ingredient usage log (Phase C2)
--
-- Records every "Used Up" action taken from the Expiry / Use It Up surfaces
-- so we can answer "how much did we use vs waste?" later. The frontend zeroes
-- the ingredient's stock_qty regardless of reason; this table preserves the
-- distinction (and the qty cleared) for analytics.
--
-- ON DELETE CASCADE: if an ingredient is fully deleted from the app, its
-- usage history goes with it. (No orphaned rows pointing at vanished ids.)
-- ============================================

CREATE TABLE IF NOT EXISTS food_department_ingredient_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid REFERENCES food_department_ingredients(id) ON DELETE CASCADE,
  qty_cleared numeric NOT NULL,
  unit text,
  reason text NOT NULL CHECK (reason IN ('used', 'wasted')),
  logged_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_usage_log_ingredient
  ON food_department_ingredient_usage_log(ingredient_id);

CREATE INDEX IF NOT EXISTS idx_ingredient_usage_log_logged_at
  ON food_department_ingredient_usage_log(logged_at);

-- RLS: match the project's existing "personal app, no auth" convention
-- (see 003_rls_policies.sql). Without this, the anon-key client is blocked.
ALTER TABLE food_department_ingredient_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on ingredient_usage_log"
  ON food_department_ingredient_usage_log
  FOR ALL USING (true) WITH CHECK (true);
