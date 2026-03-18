import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AiProgressionSuggestion } from '@/types/database'

export type SuggestionWithContext = AiProgressionSuggestion & {
  students: { full_name: string; email: string } | null
  exercises: { exercise_library: { name: string } | null } | null
  routine_days: { name: string } | null
}

export function usePendingSuggestions() {
  return useQuery<SuggestionWithContext[]>({
    queryKey: ['ai-suggestions', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_progression_suggestions')
        .select('*, students(full_name, email), exercises(exercise_library(name)), routine_days(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as SuggestionWithContext[]
    },
  })
}

export function usePendingSuggestionsCount() {
  return useQuery<number>({
    queryKey: ['ai-suggestions-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ai_progression_suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useApprovedSuggestionsForDay(routineDayId: string | undefined) {
  return useQuery<AiProgressionSuggestion[]>({
    queryKey: ['ai-suggestions-approved', routineDayId],
    queryFn: async () => {
      if (!routineDayId) return []
      const { data, error } = await supabase
        .from('ai_progression_suggestions')
        .select('*')
        .eq('routine_day_id', routineDayId)
        .eq('status', 'approved')
      if (error) throw error
      return data
    },
    enabled: !!routineDayId,
  })
}

export function useReviewSuggestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      message,
    }: {
      id: string
      status: 'approved' | 'rejected'
      message?: string
    }) => {
      const { data, error } = await supabase
        .from('ai_progression_suggestions')
        .update({
          status,
          student_message: status === 'approved' ? (message || null) : null,
          trainer_comment: status === 'rejected' ? (message || null) : null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions-count'] })
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions-approved'] })
    },
  })
}
