import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import type { TrainingLog, ExerciseLog, PerformedSet } from '@/types/database'

export function useTrainingLogs() {
  const studentId = useAuthStore((s) => s.studentId)
  return useQuery<TrainingLog[]>({
    queryKey: ['training-logs', studentId],
    queryFn: async () => {
      if (!studentId) return []
      const { data, error } = await supabase
        .from('training_logs')
        .select('*')
        .eq('student_id', studentId)
        .order('logged_date', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
    enabled: !!studentId,
  })
}

export function useTrainingLog(logId: string | undefined) {
  return useQuery<(TrainingLog & { exercise_logs: ExerciseLog[] }) | null>({
    queryKey: ['training-log', logId],
    queryFn: async () => {
      if (!logId) return null
      const { data, error } = await supabase
        .from('training_logs')
        .select('*, exercise_logs(*, exercise_library(*))')
        .eq('id', logId)
        .single()
      if (error) throw error
      return data as TrainingLog & { exercise_logs: ExerciseLog[] }
    },
    enabled: !!logId,
  })
}

interface ExerciseLogInput {
  exercise_library_id: string
  sets_performed: PerformedSet[]
  order_index: number
}

interface CreateTrainingLogInput {
  routine_day_id: string
  duration_minutes?: number
  perceived_effort?: number
  notes?: string
  exercise_logs: ExerciseLogInput[]
}

export function useCreateTrainingLog() {
  const queryClient = useQueryClient()
  const studentId = useAuthStore((s) => s.studentId)

  return useMutation({
    mutationFn: async (input: CreateTrainingLogInput) => {
      if (!studentId) throw new Error('No student ID')

      // 1. Create the training log
      const { data: log, error: logError } = await supabase
        .from('training_logs')
        .insert({
          student_id: studentId,
          routine_day_id: input.routine_day_id,
          duration_minutes: input.duration_minutes || null,
          perceived_effort: input.perceived_effort || null,
          notes: input.notes || null,
        })
        .select()
        .single()

      if (logError) throw logError

      // 2. Create exercise logs
      if (input.exercise_logs.length > 0) {
        const exerciseLogs = input.exercise_logs.map((el) => ({
          training_log_id: log.id,
          exercise_library_id: el.exercise_library_id,
          sets_performed: JSON.stringify(el.sets_performed),
          order_index: el.order_index,
        }))

        const { error: elError } = await supabase.from('exercise_logs').insert(exerciseLogs)
        if (elError) throw elError
      }

      return log
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-logs', studentId] })
    },
  })
}

// Trainer: fetch training logs for a specific student (with routine day info)
export function useStudentTrainingLogsForTrainer(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-training-logs-trainer', studentId],
    queryFn: async () => {
      if (!studentId) return []
      const { data, error } = await supabase
        .from('training_logs')
        .select('*, routine_days(id, name, muscle_groups)')
        .eq('student_id', studentId)
        .order('logged_date', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as (TrainingLog & { routine_days: { id: string; name: string; muscle_groups: string[] } | null })[]
    },
    enabled: !!studentId,
  })
}

// Student: fetch own logs with routine day info (for progress page)
export function useTrainingLogsWithDays() {
  const studentId = useAuthStore((s) => s.studentId)
  return useQuery({
    queryKey: ['training-logs-with-days', studentId],
    queryFn: async () => {
      if (!studentId) return []
      const { data, error } = await supabase
        .from('training_logs')
        .select('*, routine_days(id, name, muscle_groups)')
        .eq('student_id', studentId)
        .order('logged_date', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as (TrainingLog & { routine_days: { id: string; name: string; muscle_groups: string[] } | null })[]
    },
    enabled: !!studentId,
  })
}

// Get last training log for a routine day (to determine "today's" day)
export function useLastLogForRoutineDay(routineDayId: string | undefined) {
  const studentId = useAuthStore((s) => s.studentId)
  return useQuery<TrainingLog | null>({
    queryKey: ['last-log', routineDayId, studentId],
    queryFn: async () => {
      if (!routineDayId || !studentId) return null
      const { data, error } = await supabase
        .from('training_logs')
        .select('*')
        .eq('student_id', studentId)
        .eq('routine_day_id', routineDayId)
        .order('logged_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!routineDayId && !!studentId,
  })
}
