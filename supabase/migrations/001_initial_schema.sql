-- ============================================================
-- FitFlow: Initial Schema Migration
-- Creates all tables, indexes, helper functions, and RLS policies
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- HELPER FUNCTIONS for RLS
-- ============================================================

-- Returns the trainer's internal ID for the currently authenticated user
CREATE OR REPLACE FUNCTION get_trainer_id()
RETURNS UUID AS $$
  SELECT id FROM trainers WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns the student's internal ID for the currently authenticated user
CREATE OR REPLACE FUNCTION get_student_id()
RETURNS UUID AS $$
  SELECT id FROM students WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns the trainer_id that owns a given student
CREATE OR REPLACE FUNCTION get_trainer_id_for_student(p_student_id UUID)
RETURNS UUID AS $$
  SELECT trainer_id FROM students WHERE id = p_student_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- TABLE: subscription_plans (reference table, no tenant FK)
-- ============================================================
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_students INTEGER NOT NULL,
  price_monthly_usd NUMERIC(10, 2) NOT NULL,
  paddle_price_id TEXT,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO subscription_plans (id, name, max_students, price_monthly_usd, features) VALUES
  ('starter', 'Starter', 5, 29.00, ARRAY['Motor IA de progresión', 'Hasta 5 alumnos', 'Hasta 10 plantillas', 'Soporte por email']),
  ('pro', 'Pro', 15, 59.00, ARRAY['Motor IA de progresión', 'Hasta 15 alumnos', 'Plantillas ilimitadas', 'Crear recetas', 'Soporte prioritario']),
  ('elite', 'Elite', 999999, 99.00, ARRAY['Motor IA de progresión', 'Alumnos ilimitados', 'Plantillas ilimitadas', 'Banco privado de recetas', 'Chat directo']);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_plans_read" ON subscription_plans FOR SELECT TO authenticated USING (true);

-- ============================================================
-- TABLE: trainers
-- ============================================================
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  paddle_customer_id TEXT,
  paddle_subscription_id TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'starter' REFERENCES subscription_plans(id),
  max_students INTEGER NOT NULL DEFAULT 2, -- trial default
  ai_training_prompt TEXT,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trainers_auth_user_id ON trainers(auth_user_id);

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainers_select_own" ON trainers
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "trainers_insert_own" ON trainers
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "trainers_update_own" ON trainers
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ============================================================
-- TABLE: students
-- ============================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  birth_date DATE,
  weight_kg NUMERIC(5, 1),
  height_cm NUMERIC(5, 1),
  current_goal TEXT DEFAULT 'maintenance'
    CHECK (current_goal IN ('muscle_gain', 'fat_loss', 'strength', 'endurance', 'maintenance')),
  is_active BOOLEAN DEFAULT true,
  invite_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_students_trainer_id ON students(trainer_id);
CREATE INDEX idx_students_auth_user_id ON students(auth_user_id);
CREATE INDEX idx_students_invite_token ON students(invite_token);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Trainers can see their own students
CREATE POLICY "students_trainer_select" ON students
  FOR SELECT TO authenticated
  USING (trainer_id = get_trainer_id());

-- Students can see their own record
CREATE POLICY "students_self_select" ON students
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Trainers can insert students
CREATE POLICY "students_trainer_insert" ON students
  FOR INSERT TO authenticated
  WITH CHECK (trainer_id = get_trainer_id());

-- Trainers can update their students
CREATE POLICY "students_trainer_update" ON students
  FOR UPDATE TO authenticated
  USING (trainer_id = get_trainer_id());

-- Students can update their own record (fcm_token, etc.)
CREATE POLICY "students_self_update" ON students
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Trainers can delete their students
CREATE POLICY "students_trainer_delete" ON students
  FOR DELETE TO authenticated
  USING (trainer_id = get_trainer_id());

-- Allow reading by invite_token (for unauthenticated invite flow)
-- This is handled by a separate function with service_role

-- ============================================================
-- TABLE: exercise_library (global catalog)
-- ============================================================
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL
    CHECK (muscle_group IN ('chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'full_body', 'cardio')),
  exercise_type TEXT NOT NULL
    CHECK (exercise_type IN ('compound', 'isolation', 'cardio')),
  default_video_url TEXT,
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exercise_library_muscle_group ON exercise_library(muscle_group);
CREATE INDEX idx_exercise_library_name ON exercise_library USING gin (to_tsvector('spanish', name));

ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_library_read" ON exercise_library
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- TABLE: routines
-- ============================================================
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  goal TEXT,
  weeks_duration INTEGER,
  is_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_routines_trainer_id ON routines(trainer_id);
CREATE INDEX idx_routines_student_id ON routines(student_id);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Trainers see their own routines
CREATE POLICY "routines_trainer_select" ON routines
  FOR SELECT TO authenticated
  USING (trainer_id = get_trainer_id());

-- Students see routines assigned to them
CREATE POLICY "routines_student_select" ON routines
  FOR SELECT TO authenticated
  USING (student_id = get_student_id());

CREATE POLICY "routines_trainer_insert" ON routines
  FOR INSERT TO authenticated
  WITH CHECK (trainer_id = get_trainer_id());

CREATE POLICY "routines_trainer_update" ON routines
  FOR UPDATE TO authenticated
  USING (trainer_id = get_trainer_id());

CREATE POLICY "routines_trainer_delete" ON routines
  FOR DELETE TO authenticated
  USING (trainer_id = get_trainer_id());

-- ============================================================
-- TABLE: routine_days
-- ============================================================
CREATE TABLE routine_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  muscle_groups TEXT[] DEFAULT '{}',
  includes_cardio BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_routine_days_routine_id ON routine_days(routine_id);

ALTER TABLE routine_days ENABLE ROW LEVEL SECURITY;

-- Trainers: access via routine ownership
CREATE POLICY "routine_days_trainer_select" ON routine_days
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routines WHERE routines.id = routine_days.routine_id AND routines.trainer_id = get_trainer_id()
  ));

-- Students: access via routine assignment
CREATE POLICY "routine_days_student_select" ON routine_days
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routines WHERE routines.id = routine_days.routine_id AND routines.student_id = get_student_id()
  ));

CREATE POLICY "routine_days_trainer_insert" ON routine_days
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM routines WHERE routines.id = routine_days.routine_id AND routines.trainer_id = get_trainer_id()
  ));

CREATE POLICY "routine_days_trainer_update" ON routine_days
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routines WHERE routines.id = routine_days.routine_id AND routines.trainer_id = get_trainer_id()
  ));

CREATE POLICY "routine_days_trainer_delete" ON routine_days
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routines WHERE routines.id = routine_days.routine_id AND routines.trainer_id = get_trainer_id()
  ));

-- ============================================================
-- TABLE: exercises (exercises within a routine day)
-- ============================================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_day_id UUID NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
  exercise_library_id UUID NOT NULL REFERENCES exercise_library(id),
  is_main_lift BOOLEAN DEFAULT false,
  sets JSONB NOT NULL DEFAULT '[]',
  rest_seconds INTEGER DEFAULT 90,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exercises_routine_day_id ON exercises(routine_day_id);
CREATE INDEX idx_exercises_exercise_library_id ON exercises(exercise_library_id);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Trainers: access via routine_day -> routine ownership
CREATE POLICY "exercises_trainer_select" ON exercises
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routine_days rd
    JOIN routines r ON r.id = rd.routine_id
    WHERE rd.id = exercises.routine_day_id AND r.trainer_id = get_trainer_id()
  ));

-- Students: access via routine assignment
CREATE POLICY "exercises_student_select" ON exercises
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routine_days rd
    JOIN routines r ON r.id = rd.routine_id
    WHERE rd.id = exercises.routine_day_id AND r.student_id = get_student_id()
  ));

CREATE POLICY "exercises_trainer_insert" ON exercises
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM routine_days rd
    JOIN routines r ON r.id = rd.routine_id
    WHERE rd.id = exercises.routine_day_id AND r.trainer_id = get_trainer_id()
  ));

CREATE POLICY "exercises_trainer_update" ON exercises
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routine_days rd
    JOIN routines r ON r.id = rd.routine_id
    WHERE rd.id = exercises.routine_day_id AND r.trainer_id = get_trainer_id()
  ));

CREATE POLICY "exercises_trainer_delete" ON exercises
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routine_days rd
    JOIN routines r ON r.id = rd.routine_id
    WHERE rd.id = exercises.routine_day_id AND r.trainer_id = get_trainer_id()
  ));

-- ============================================================
-- TABLE: training_logs
-- ============================================================
CREATE TABLE training_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  routine_day_id UUID NOT NULL REFERENCES routine_days(id),
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  perceived_effort INTEGER CHECK (perceived_effort BETWEEN 1 AND 10),
  notes TEXT,
  ai_analysis_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_training_logs_student_id ON training_logs(student_id);
CREATE INDEX idx_training_logs_routine_day_id ON training_logs(routine_day_id);
CREATE INDEX idx_training_logs_logged_date ON training_logs(logged_date);

ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;

-- Students can insert their own logs
CREATE POLICY "training_logs_student_insert" ON training_logs
  FOR INSERT TO authenticated
  WITH CHECK (student_id = get_student_id());

-- Students can read their own logs
CREATE POLICY "training_logs_student_select" ON training_logs
  FOR SELECT TO authenticated
  USING (student_id = get_student_id());

-- Trainers can read their students' logs
CREATE POLICY "training_logs_trainer_select" ON training_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM students s WHERE s.id = training_logs.student_id AND s.trainer_id = get_trainer_id()
  ));

-- ============================================================
-- TABLE: exercise_logs (exercises performed per training session)
-- ============================================================
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_log_id UUID NOT NULL REFERENCES training_logs(id) ON DELETE CASCADE,
  exercise_library_id UUID NOT NULL REFERENCES exercise_library(id),
  sets_performed JSONB NOT NULL DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exercise_logs_training_log_id ON exercise_logs(training_log_id);
CREATE INDEX idx_exercise_logs_exercise_library_id ON exercise_logs(exercise_library_id);

ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Students can insert exercise logs for their own training logs
CREATE POLICY "exercise_logs_student_insert" ON exercise_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_logs tl WHERE tl.id = exercise_logs.training_log_id AND tl.student_id = get_student_id()
  ));

-- Students can read their own exercise logs
CREATE POLICY "exercise_logs_student_select" ON exercise_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_logs tl WHERE tl.id = exercise_logs.training_log_id AND tl.student_id = get_student_id()
  ));

-- Trainers can read their students' exercise logs
CREATE POLICY "exercise_logs_trainer_select" ON exercise_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_logs tl
    JOIN students s ON s.id = tl.student_id
    WHERE tl.id = exercise_logs.training_log_id AND s.trainer_id = get_trainer_id()
  ));

-- ============================================================
-- TABLE: ai_progression_suggestions
-- ============================================================
CREATE TABLE ai_progression_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  routine_day_id UUID NOT NULL REFERENCES routine_days(id),
  training_log_id UUID NOT NULL REFERENCES training_logs(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  current_sets JSONB,
  suggested_sets JSONB,
  ai_reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  trainer_comment TEXT,
  student_message TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_suggestions_student_id ON ai_progression_suggestions(student_id);
CREATE INDEX idx_ai_suggestions_status ON ai_progression_suggestions(status);
CREATE INDEX idx_ai_suggestions_routine_day ON ai_progression_suggestions(routine_day_id);

ALTER TABLE ai_progression_suggestions ENABLE ROW LEVEL SECURITY;

-- Trainers can read/update suggestions for their students
CREATE POLICY "ai_suggestions_trainer_select" ON ai_progression_suggestions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM students s WHERE s.id = ai_progression_suggestions.student_id AND s.trainer_id = get_trainer_id()
  ));

CREATE POLICY "ai_suggestions_trainer_update" ON ai_progression_suggestions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM students s WHERE s.id = ai_progression_suggestions.student_id AND s.trainer_id = get_trainer_id()
  ));

-- Students can see approved suggestions for themselves
CREATE POLICY "ai_suggestions_student_select" ON ai_progression_suggestions
  FOR SELECT TO authenticated
  USING (student_id = get_student_id() AND status = 'approved');

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('trainer', 'student')),
  type TEXT NOT NULL CHECK (type IN (
    'ai_suggestion_pending', 'routine_updated', 'new_student',
    'subscription_alert', 'training_logged'
  )),
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- TABLE: recipes
-- ============================================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  calories_per_serving INTEGER,
  protein_g NUMERIC(6, 1),
  carbs_g NUMERIC(6, 1),
  fat_g NUMERIC(6, 1),
  protein_level TEXT CHECK (protein_level IN ('low', 'medium', 'high')),
  meal_type TEXT[] DEFAULT '{}',
  training_goals TEXT[] DEFAULT '{}',
  diet_type TEXT[] DEFAULT '{}',
  ingredients JSONB DEFAULT '[]',
  ingredient_tags TEXT[] DEFAULT '{}',
  steps JSONB DEFAULT '[]',
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_by UUID REFERENCES trainers(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see public recipes
CREATE POLICY "recipes_public_select" ON recipes
  FOR SELECT TO authenticated
  USING (is_public = true);

-- Trainers can see their own private recipes
CREATE POLICY "recipes_trainer_own_select" ON recipes
  FOR SELECT TO authenticated
  USING (created_by = get_trainer_id());

-- Trainers can create recipes
CREATE POLICY "recipes_trainer_insert" ON recipes
  FOR INSERT TO authenticated
  WITH CHECK (created_by = get_trainer_id());

-- Trainers can update their own recipes
CREATE POLICY "recipes_trainer_update" ON recipes
  FOR UPDATE TO authenticated
  USING (created_by = get_trainer_id());

-- Trainers can delete their own recipes
CREATE POLICY "recipes_trainer_delete" ON recipes
  FOR DELETE TO authenticated
  USING (created_by = get_trainer_id());

-- ============================================================
-- TABLE: favorite_recipes
-- ============================================================
CREATE TABLE favorite_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, recipe_id)
);

ALTER TABLE favorite_recipes ENABLE ROW LEVEL SECURITY;

-- Students manage their own favorites
CREATE POLICY "favorite_recipes_student_select" ON favorite_recipes
  FOR SELECT TO authenticated
  USING (student_id = get_student_id());

CREATE POLICY "favorite_recipes_student_insert" ON favorite_recipes
  FOR INSERT TO authenticated
  WITH CHECK (student_id = get_student_id());

CREATE POLICY "favorite_recipes_student_delete" ON favorite_recipes
  FOR DELETE TO authenticated
  USING (student_id = get_student_id());

-- ============================================================
-- TRIGGER: auto-update updated_at on routines
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER routines_updated_at
  BEFORE UPDATE ON routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: accept student invite
-- Links auth.uid() to student record via invite_token
-- ============================================================
CREATE OR REPLACE FUNCTION accept_student_invite(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_student_id UUID;
BEGIN
  UPDATE students
  SET auth_user_id = auth.uid(), invite_token = NULL
  WHERE invite_token = p_token AND auth_user_id IS NULL
  RETURNING id INTO v_student_id;

  RETURN v_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
