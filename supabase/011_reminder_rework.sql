-- ============================================
-- Migration: reminder rework (Phase B1)
--
-- Reminders move from a static interval on the ingredient to a concrete
-- next-due date driven by the buying flow. This migration is ADDITIVE and
-- idempotent: it adds + backfills the new column and leaves the legacy
-- columns (restock_reminder_days, last_reminder_checked) untouched so the
-- current live Ingredients "My Reminders" UI keeps working until B4
-- removes it. A later migration can drop the legacy columns once B4 ships.
-- ============================================

-- 1. New column: the date a reminder is next due.
--    DATE (not TIMESTAMPTZ) — reminders are day-grained and B3 surfaces
--    them with `reminder_next_due <= current_date`.
ALTER TABLE food_department_ingredients
  ADD COLUMN IF NOT EXISTS reminder_next_due DATE;

-- 2. Backfill existing reminders.
--    next_due = COALESCE(last_checked, now()) + interval_days
--    (per the Phase B1 spec). Only rows that actually have a reminder,
--    and only if not already backfilled (idempotent re-run safe).
--    restock_reminder_days defaults to 7 to mirror the app's
--    DEFAULT_REMINDER_DAYS fallback when the column is null.
UPDATE food_department_ingredients
SET reminder_next_due =
      (COALESCE(last_reminder_checked, now())::date
        + COALESCE(restock_reminder_days, 7))
WHERE has_reminder = true
  AND reminder_next_due IS NULL;

-- 3. Partial index for the B3 "due reminders" Shop query
--    (WHERE has_reminder AND reminder_next_due <= current_date).
CREATE INDEX IF NOT EXISTS idx_fd_ingredients_reminder_due
  ON food_department_ingredients (reminder_next_due)
  WHERE has_reminder = true;
