import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Routine } from '@/types/database'

export function useRoutines() {
  return useQuery<Routine[]>({
    queryKey: ['routines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useRoutine(routineId: string | undefined) {
  return useQuery<Routine | null>({
    queryKey: ['routine', routineId],
    queryFn: async () => {
      if (!routineId) return null
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!routineId,
  })
}

interface CreateRoutineInput {
  name: string
  goal?: string
  weeks_duration?: number
  is_template?: boolean
  student_id?: string
}

export function useCreateRoutine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRoutineInput) => {
      // Get trainer_id from current user's trainer record
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (!trainer) throw new Error('Trainer not found')

      const { data, error } = await supabase
        .from('routines')
        .insert({
          trainer_id: trainer.id,
          name: input.name,
          goal: input.goal || null,
          weeks_duration: input.weeks_duration || null,
          is_template: input.is_template ?? false,
          student_id: input.student_id || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
    },
  })
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateRoutineInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('routines')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      queryClient.invalidateQueries({ queryKey: ['routine', data.id] })
    },
  })
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routines').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
    },
  })
}

export function useAssignRoutine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ routineId, studentId }: { routineId: string; studentId: string }) => {
      // Deactivate all other active routines for this student
      await supabase
        .from('routines')
        .update({ is_active: false })
        .eq('student_id', studentId)
        .eq('is_active', true)

      // Assign and activate this routine
      const { data, error } = await supabase
        .from('routines')
        .update({ student_id: studentId, is_active: true })
        .eq('id', routineId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
    },
  })
}
