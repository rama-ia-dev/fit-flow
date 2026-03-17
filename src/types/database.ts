// ============================================================
// FitFlow Database Types
// ============================================================

export interface Trainer {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  avatar_url: string | null
  paddle_customer_id: string | null
  paddle_subscription_id: string | null
  plan_tier: string
  max_students: number
  ai_training_prompt: string | null
  fcm_token: string | null
  created_at: string
}

export interface Student {
  id: string
  trainer_id: string
  auth_user_id: string | null
  email: string
  full_name: string
  avatar_url: string | null
  birth_date: string | null
  weight_kg: number | null
  height_cm: number | null
  current_goal: StudentGoal
  is_active: boolean
  invite_token: string | null
  fcm_token: string | null
  created_at: string
}

export type StudentGoal = 'muscle_gain' | 'fat_loss' | 'strength' | 'endurance' | 'maintenance'

export interface ExerciseLibrary {
  id: string
  name: string
  muscle_group: MuscleGroup
  exercise_type: ExerciseType
  default_video_url: string | null
  aliases: string[]
  created_at: string
}

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'full_body' | 'cardio'
export type ExerciseType = 'compound' | 'isolation' | 'cardio'

export interface Routine {
  id: string
  trainer_id: string
  student_id: string | null
  name: string
  goal: string | null
  weeks_duration: number | null
  is_template: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoutineDay {
  id: string
  routine_id: string
  day_number: number
  name: string
  muscle_groups: string[]
  includes_cardio: boolean
  order_index: number
}

export interface Exercise {
  id: string
  routine_day_id: string
  exercise_library_id: string
  is_main_lift: boolean
  sets: PlannedSet[]
  rest_seconds: number
  notes: string | null
  order_index: number
  video_url: string | null
  updated_at: string
  // Joined data
  exercise_library?: ExerciseLibrary
}

export interface PlannedSet {
  set_number: number
  reps: number
  weight_kg: number
  rpe?: number
}

export interface TrainingLog {
  id: string
  student_id: string
  routine_day_id: string
  logged_date: string
  duration_minutes: number | null
  perceived_effort: number | null
  notes: string | null
  ai_analysis_triggered: boolean
  created_at: string
}

export interface ExerciseLog {
  id: string
  training_log_id: string
  exercise_library_id: string
  sets_performed: PerformedSet[]
  order_index: number
  created_at: string
  // Joined data
  exercise_library?: ExerciseLibrary
}

export interface PerformedSet {
  set_number: number
  reps_done: number
  weight_kg: number
  rpe?: number
  completed: boolean
}

export interface AiProgressionSuggestion {
  id: string
  student_id: string
  routine_day_id: string
  training_log_id: string
  exercise_id: string
  current_sets: PlannedSet[]
  suggested_sets: PlannedSet[]
  ai_reasoning: string | null
  status: 'pending' | 'approved' | 'rejected'
  trainer_comment: string | null
  student_message: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  user_role: 'trainer' | 'student'
  type: NotificationType
  title: string
  body: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export type NotificationType =
  | 'ai_suggestion_pending'
  | 'routine_updated'
  | 'new_student'
  | 'subscription_alert'
  | 'training_logged'

export interface Recipe {
  id: string
  name: string
  description: string | null
  image_url: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  calories_per_serving: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  protein_level: 'low' | 'medium' | 'high' | null
  meal_type: string[]
  training_goals: string[]
  diet_type: string[]
  ingredients: RecipeIngredient[]
  ingredient_tags: string[]
  steps: RecipeStep[]
  difficulty: 'easy' | 'medium' | 'hard'
  created_by: string | null
  is_public: boolean
  created_at: string
}

export interface RecipeIngredient {
  name: string
  quantity: number
  unit: string
}

export interface RecipeStep {
  step_number: number
  instruction: string
}

export interface FavoriteRecipe {
  id: string
  student_id: string
  recipe_id: string
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  max_students: number
  price_monthly_usd: number
  paddle_price_id: string | null
  features: string[]
}
