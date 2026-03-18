import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, Clock, ClipboardEdit, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStudentDayExercises } from '@/services/student-routines'
import { useApprovedSuggestionsForDay } from '@/services/ai-suggestions'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import type { RoutineDay } from '@/types/database'

export default function RoutineDayPage() {
  const { dayId } = useParams<{ dayId: string }>()

  const { data: day } = useQuery<RoutineDay | null>({
    queryKey: ['routine-day', dayId],
    queryFn: async () => {
      if (!dayId) return null
      const { data, error } = await supabase
        .from('routine_days')
        .select('*')
        .eq('id', dayId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!dayId,
  })

  const { data: exercises = [] } = useStudentDayExercises(dayId)
  const { data: suggestions = [] } = useApprovedSuggestionsForDay(dayId)

  if (!day) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/student/routine">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{day.name}</h1>
          {day.muscle_groups.length > 0 && (
            <p className="text-sm text-muted-foreground">{day.muscle_groups.join(', ')}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {exercises.map((exercise) => {
          const name = exercise.exercise_library?.name ?? 'Ejercicio'
          const suggestion = suggestions.find((s) => s.exercise_id === exercise.id)
          return (
            <Card key={exercise.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-2">
                  {exercise.is_main_lift && (
                    <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                  )}
                  <span className="font-medium">{name}</span>
                  {exercise.is_main_lift && (
                    <Badge variant="outline" className="text-xs text-amber-600">Principal</Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {exercise.sets.map((set) => (
                    <div key={set.set_number} className="flex items-center gap-4 text-sm">
                      <span className="w-16 text-muted-foreground">Serie {set.set_number}</span>
                      <span className="font-medium">{set.reps} reps</span>
                      <span className="font-medium">× {set.weight_kg} kg</span>
                      {set.rpe && <span className="text-muted-foreground">RPE {set.rpe}</span>}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {exercise.rest_seconds}s descanso
                  </span>
                </div>

                {exercise.notes && (
                  <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                    {exercise.notes}
                  </p>
                )}

                {suggestion && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Sugerencia de tu entrenador
                    </div>
                    <div className="space-y-1">
                      {suggestion.suggested_sets.map((set) => (
                        <div key={set.set_number} className="flex items-center gap-4 text-sm">
                          <span className="w-16 text-muted-foreground">Serie {set.set_number}</span>
                          <span className="font-semibold text-primary">{set.reps} reps</span>
                          <span className="font-semibold text-primary">× {set.weight_kg} kg</span>
                          {set.rpe && <span className="text-muted-foreground">RPE {set.rpe}</span>}
                        </div>
                      ))}
                    </div>
                    {suggestion.student_message && (
                      <p className="text-xs text-primary/80 italic border-l-2 border-primary/30 pl-3">
                        {suggestion.student_message}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button asChild className="w-full gap-2" size="lg">
        <Link to={`/student/log/${dayId}`}>
          <ClipboardEdit className="h-5 w-5" />
          Empezar entrenamiento
        </Link>
      </Button>
    </div>
  )
}
