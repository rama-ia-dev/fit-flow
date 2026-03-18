import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Exercise, PlannedSet } from '@/types/database'

export function useExercises(routineDayId: string | undefined) {
  return useQuery<Exercise[]>({
    queryKey: ['exercises', routineDayId],
    queryFn: async () => {
      if (!routineDayId) return []
      const { data, error } = await supabase
        .from('exercises')
        .select('*, exercise_library(*)')
        .eq('routine_day_id', routineDayId)
        .order('order_index')
      if (error) throw error
      return data
    },
    enabled: !!routineDayId,
  })
}

interface CreateExerciseInput {
  routine_day_id: string
  exercise_library_id: string
  is_main_lift?: boolean
  sets: PlannedSet[]
  rest_seconds?: number
  notes?: string
  order_index: number
  video_url?: string
}

export function useCreateExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateExerciseInput) => {
      const { data, error } = await supabase
        .from('exercises')
        .insert(input)
        .select('*, exercise_library(*)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exercises', data.routine_day_id] })
    },
  })
}

export function useUpdateExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateExerciseInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('exercises')
        .update(input)
        .eq('id', id)
        .select('*, exercise_library(*)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exercises', data.routine_day_id] })
    },
  })
}

export function useDeleteExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, routineDayId }: { id: string; routineDayId: string }) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id)
      if (error) throw error
      return routineDayId
    },
    onSuccess: (routineDayId) => {
      queryClient.invalidateQueries({ queryKey: ['exercises', routineDayId] })
    },
  })
}
