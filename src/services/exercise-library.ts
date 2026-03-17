import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ExerciseLibrary } from '@/types/database'

export function useExerciseLibrary() {
  return useQuery<ExerciseLibrary[]>({
    queryKey: ['exercise-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('muscle_group')
        .order('name')
      if (error) throw error
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 min cache — rarely changes
  })
}

export function useSearchExercises(query: string) {
  return useQuery<ExerciseLibrary[]>({
    queryKey: ['exercise-library-search', query],
    queryFn: async () => {
      if (!query.trim()) {
        const { data, error } = await supabase
          .from('exercise_library')
          .select('*')
          .order('muscle_group')
          .order('name')
          .limit(20)
        if (error) throw error
        return data
      }

      const searchTerm = `%${query.trim()}%`
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .or(`name.ilike.${searchTerm},aliases.cs.{${query.trim().toLowerCase()}}`)
        .order('name')
        .limit(20)
      if (error) throw error
      return data
    },
    enabled: true,
  })
}
