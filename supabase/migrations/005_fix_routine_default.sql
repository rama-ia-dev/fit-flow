-- Fix: routines should be inactive by default (active = assigned to student)
ALTER TABLE routines ALTER COLUMN is_active SET DEFAULT false;

-- Fix existing unassigned routines
UPDATE routines SET is_active = false WHERE student_id IS NULL;
