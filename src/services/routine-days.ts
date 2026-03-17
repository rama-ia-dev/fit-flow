import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RoutineDay } from '@/types/database'

export function useRoutineDays(routineId: string | undefined) {
  return useQuery<RoutineDay[]>({
    queryKey: ['routine-days', routineId],
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

interface CreateRoutineDayInput {
  routine_id: string
  day_number: number
  name: string
  muscle_groups?: string[]
  includes_cardio?: boolean
  order_index: number
}

export function useCreateRoutineDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRoutineDayInput) => {
      const { data, error } = await supabase
        .from('routine_days')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['routine-days', data.routine_id] })
    },
  })
}

export function useUpdateRoutineDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateRoutineDayInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('routine_days')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['routine-days', data.routine_id] })
    },
  })
}

export function useDeleteRoutineDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, routineId }: { id: string; routineId: string }) => {
      const { error } = await supabase.from('routine_days').delete().eq('id', id)
      if (error) throw error
      return routineId
    },
    onSuccess: (routineId) => {
      queryClient.invalidateQueries({ queryKey: ['routine-days', routineId] })
    },
  })
}
