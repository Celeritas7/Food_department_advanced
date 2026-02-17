-- Migration: Update dish status CHECK constraint
-- Adds 'Not planned' and 'In Progress' (with space), keeps backward compat

-- 1. Drop the old constraint
ALTER TABLE food_department_dishes DROP CONSTRAINT IF EXISTS food_department_dishes_status_check;

-- 2. Migrate any existing 'InProgress' to 'In Progress'
UPDATE food_department_dishes SET status = 'In Progress' WHERE status = 'InProgress';

-- 3. Add new constraint with all 4 statuses
ALTER TABLE food_department_dishes ADD CONSTRAINT food_department_dishes_status_check 
  CHECK (status IN ('Not planned', 'Planned', 'In Progress', 'Cooked'));

-- 4. Update default
ALTER TABLE food_department_dishes ALTER COLUMN status SET DEFAULT 'Not planned';
