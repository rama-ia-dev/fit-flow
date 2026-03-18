-- ============================================================
-- Fix Security Advisor warnings: set search_path on all functions
-- ============================================================

CREATE OR REPLACE FUNCTION get_trainer_id()
RETURNS UUID AS $$
  SELECT id FROM public.trainers WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_student_id()
RETURNS UUID AS $$
  SELECT id FROM public.students WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_trainer_id_for_student(p_student_id UUID)
RETURNS UUID AS $$
  SELECT trainer_id FROM public.students WHERE id = p_student_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION accept_student_invite(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_student_id UUID;
BEGIN
  UPDATE public.students
  SET auth_user_id = auth.uid(), invite_token = NULL
  WHERE invite_token = p_token AND auth_user_id IS NULL
  RETURNING id INTO v_student_id;

  RETURN v_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
