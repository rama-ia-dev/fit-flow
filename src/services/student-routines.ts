import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import type { Routine, RoutineDay, Exercise } from '@/types/database'

export function useActiveRoutine() {
  const studentId = useAuthStore((s) => s.studentId)
  return useQuery<Routine | null>({
    queryKey: ['active-routine', studentId],
    queryFn: async () => {
      if (!studentId) return null
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!studentId,
  })
}

export function useStudentRoutineDays(routineId: string | undefined) {
  return useQuery<RoutineDay[]>({
    queryKey: ['student-routine-days', routineId],
    queryFn: async () => {
      if (!routineId) return []
      const { data, error } = await supabase
        .from('routine_days')
        .select('*')
        .eq('routine_id', routineId)
        .order('order_index')
      if (error) throw error
      return data
    },
    enabled: !!routineId,
  })
}

export function useStudentDayExercises(dayId: string | undefined) {
  return useQuery<Exercise[]>({
    queryKey: ['student-exercises', dayId],
    queryFn: async () => {
      if (!dayId) return []
      const { data, error } = await supabase
        .from('exercises')
        .select('*, exercise_library(*)')
        .eq('routine_day_id', dayId)
        .order('order_index')
      if (error) throw error
      return data
    },
    enabled: !!dayId,
  })
}
