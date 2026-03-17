import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import type { Student, StudentGoal } from '@/types/database'

interface CreateStudentInput {
  email: string
  full_name: string
  birth_date?: string
  weight_kg?: number
  height_cm?: number
  current_goal?: StudentGoal
}

export function useStudents() {
  return useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useStudent(studentId: string | undefined) {
  return useQuery<Student | null>({
    queryKey: ['student', studentId],
    queryFn: async () => {
      if (!studentId) return null
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!studentId,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  const trainerId = useAuthStore((s) => s.trainerId)

  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      if (!trainerId) throw new Error('No trainer ID')
      const { data, error } = await supabase
        .from('students')
        .insert({
          trainer_id: trainerId,
          email: input.email,
          full_name: input.full_name,
          birth_date: input.birth_date || null,
          weight_kg: input.weight_kg || null,
          height_cm: input.height_cm || null,
          current_goal: input.current_goal || 'maintenance',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateStudentInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student', data.id] })
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useToggleStudentActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('students')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
