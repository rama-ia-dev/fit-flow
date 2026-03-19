-- Allow anonymous users to look up a student by invite token
-- (needed so the invite page can show the pre-filled email before login)
CREATE OR REPLACE FUNCTION get_student_by_invite_token(p_token TEXT)
RETURNS TABLE(email TEXT, full_name TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT email, full_name
  FROM public.students
  WHERE invite_token = p_token
    AND auth_user_id IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_student_by_invite_token(TEXT) TO anon;
