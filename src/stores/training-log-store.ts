import { create } from 'zustand'
import type { PerformedSet } from '@/types/database'

interface ExerciseEntry {
  exercise_library_id: string
  exercise_name: string
  planned_sets: { set_number: number; reps: number; weight_kg: number; rpe?: number }[]
  sets_performed: PerformedSet[]
}

interface TrainingLogFormState {
  exercises: ExerciseEntry[]
  startTime: number | null
  phase: 'logging' | 'summary'

  initExercises: (entries: ExerciseEntry[]) => void
  updateSet: (exerciseIndex: number, setIndex: number, field: keyof PerformedSet, value: number | boolean) => void
  setPhase: (phase: 'logging' | 'summary') => void
  reset: () => void
}

export const useTrainingLogStore = create<TrainingLogFormState>((set) => ({
  exercises: [],
  startTime: null,
  phase: 'logging',

  initExercises: (entries) => set({
    exercises: entries,
    startTime: Date.now(),
    phase: 'logging',
  }),

  updateSet: (exerciseIndex, setIndex, field, value) =>
    set((state) => {
      const exercises = [...state.exercises]
      const exercise = exercises[exerciseIndex]
      if (!exercise) return state
      const sets = [...exercise.sets_performed]
      sets[setIndex] = { ...sets[setIndex]!, [field]: value }
      exercises[exerciseIndex] = { ...exercise, sets_performed: sets }
      return { exercises }
    }),

  setPhase: (phase) => set({ phase }),
  reset: () => set({ exercises: [], startTime: null, phase: 'logging' }),
}))
