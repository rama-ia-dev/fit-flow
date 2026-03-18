-- ============================================================
-- Add extra profile fields to students table
-- ============================================================

ALTER TABLE students
  ADD COLUMN id_type TEXT CHECK (id_type IN ('dni', 'passport', 'cedula', 'other')),
  ADD COLUMN id_number TEXT,
  ADD COLUMN phone TEXT,
  ADD COLUMN notes TEXT;
