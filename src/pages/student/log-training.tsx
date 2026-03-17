import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useStudentDayExercises } from '@/services/student-routines'
import { useCreateTrainingLog } from '@/services/training-logs'
import { useTrainingLogStore } from '@/stores/training-log-store'

export default function LogTrainingPage() {
  const { dayId } = useParams<{ dayId: string }>()
  const navigate = useNavigate()
  const { data: exercises = [], isLoading } = useStudentDayExercises(dayId)
  const createLog = useCreateTrainingLog()
  const { exercises: formExercises, startTime, phase, initExercises, updateSet, setPhase, reset } =
    useTrainingLogStore()

  const [effort, setEffort] = useState(7)
  const [notes, setNotes] = useState('')

  // Init form when exercises load
  useEffect(() => {
    if (exercises.length > 0 && formExercises.length === 0) {
      initExercises(
        exercises.map((ex) => ({
          exercise_library_id: ex.exercise_library_id,
          exercise_name: ex.exercise_library?.name ?? 'Ejercicio',
          planned_sets: ex.sets,
          sets_performed: ex.sets.map((s) => ({
            set_number: s.set_number,
            reps_done: s.reps,
            weight_kg: s.weight_kg,
            rpe: s.rpe ?? 7,
            completed: true,
          })),
        }))
      )
    }
  }, [exercises, formExercises.length, initExercises])

  const handleFinish = () => setPhase('summary')

  const handleSave = async () => {
    if (!dayId) return
    const durationMinutes = startTime ? Math.round((Date.now() - startTime) / 60000) : undefined

    try {
      await createLog.mutateAsync({
        routine_day_id: dayId,
        duration_minutes: durationMinutes,
        perceived_effort: effort,
        notes: notes || undefined,
        exercise_logs: formExercises.map((ex, i) => ({
          exercise_library_id: ex.exercise_library_id,
          sets_performed: ex.sets_performed.filter((s) => s.completed),
          order_index: i,
        })),
      })
      reset()
      toast.success('¡Entrenamiento registrado!')
      navigate('/student/home', { replace: true })
    } catch {
      toast.error('Error al guardar el entrenamiento')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // SUMMARY PHASE
  if (phase === 'summary') {
    const durationMinutes = startTime ? Math.round((Date.now() - startTime) / 60000) : 0
    const totalSets = formExercises.reduce(
      (acc, ex) => acc + ex.sets_performed.filter((s) => s.completed).length,
      0
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setPhase('logging')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Resumen del entrenamiento</h1>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg bg-primary/10 p-4">
                <p className="text-2xl font-bold text-primary">{durationMinutes}</p>
                <p className="text-xs text-muted-foreground">minutos</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-4">
                <p className="text-2xl font-bold text-primary">{totalSets}</p>
                <p className="text-xs text-muted-foreground">series completadas</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Esfuerzo percibido (RPE 1-10)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="range"
                  min={1}
                  max={10}
                  value={effort}
                  onChange={(e) => setEffort(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-lg font-bold">{effort}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="¿Cómo te sentiste? ¿Algo a destacar?"
                rows={3}
              />
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleSave}
              disabled={createLog.isPending}
            >
              <Check className="h-5 w-5" />
              {createLog.isPending ? 'Guardando...' : 'Confirmar y guardar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // LOGGING PHASE
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/student/home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Registrar entrenamiento</h1>
      </div>

      {formExercises.map((exercise, exIndex) => (
        <Card key={exercise.exercise_library_id}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{exercise.exercise_name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-[auto_1fr_1fr_60px_50px] items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="w-6" />
              <span>Reps</span>
              <span>Kg</span>
              <span>RPE</span>
              <span className="text-center">OK</span>
            </div>
            {exercise.sets_performed.map((set, setIndex) => {
              const planned = exercise.planned_sets[setIndex]
              return (
                <div
                  key={set.set_number}
                  className="grid grid-cols-[auto_1fr_1fr_60px_50px] items-center gap-2"
                >
                  <span className="w-6 text-center text-xs text-muted-foreground">
                    {set.set_number}
                  </span>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      value={set.reps_done}
                      onChange={(e) =>
                        updateSet(exIndex, setIndex, 'reps_done', Number(e.target.value))
                      }
                      className="h-9 pr-8"
                    />
                    {planned && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        /{planned.reps}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={2.5}
                      value={set.weight_kg}
                      onChange={(e) =>
                        updateSet(exIndex, setIndex, 'weight_kg', Number(e.target.value))
                      }
                      className="h-9 pr-8"
                    />
                    {planned && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        /{planned.weight_kg}
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={set.rpe ?? ''}
                    onChange={(e) =>
                      updateSet(exIndex, setIndex, 'rpe', Number(e.target.value))
                    }
                    className="h-9"
                    placeholder="—"
                  />
                  <div className="flex justify-center">
                    <Checkbox
                      checked={set.completed}
                      onCheckedChange={(checked) =>
                        updateSet(exIndex, setIndex, 'completed', !!checked)
                      }
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      <Button className="w-full gap-2" size="lg" onClick={handleFinish}>
        <Check className="h-5 w-5" />
        Finalizar entrenamiento
      </Button>
    </div>
  )
}
