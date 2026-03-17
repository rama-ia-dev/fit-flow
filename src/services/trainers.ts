import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

interface CreateTrainerInput {
  full_name: string
  email: string
  avatar_url?: string
}

export function useCreateTrainer() {
  const queryClient = useQueryClient()
  const { setRole, setTrainerId } = useAuthStore()

  return useMutation({
    mutationFn: async (input: CreateTrainerInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('trainers')
        .insert({
          auth_user_id: user.id,
          email: input.email,
          full_name: input.full_name,
          avatar_url: input.avatar_url || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setRole('trainer')
      setTrainerId(data.id)
      queryClient.invalidateQueries({ queryKey: ['trainer'] })
    },
  })
}

export function useUpdateTrainer() {
  const queryClient = useQueryClient()
  const trainerId = useAuthStore((s) => s.trainerId)

  return useMutation({
    mutationFn: async (input: Partial<CreateTrainerInput>) => {
      if (!trainerId) throw new Error('No trainer ID')
      const { data, error } = await supabase
        .from('trainers')
        .update(input)
        .eq('id', trainerId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer', trainerId] })
    },
  })
}
