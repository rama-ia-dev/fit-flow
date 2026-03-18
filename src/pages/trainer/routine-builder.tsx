import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Star, UserCheck, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ExerciseSearch } from '@/components/trainer/exercise-search'
import { SetsEditor } from '@/components/trainer/sets-editor'
import { useRoutine, useRoutines, useCreateRoutine, useAssignRoutine } from '@/services/routines'
import { useRoutineDays, useCreateRoutineDay, useUpdateRoutineDay, useDeleteRoutineDay } from '@/services/routine-days'
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise } from '@/services/exercises'
import { useStudents } from '@/services/students'
import type { ExerciseLibrary, PlannedSet, Exercise } from '@/types/database'

export default function RoutineBuilderPage() {
  const { routineId } = useParams<{ routineId: string }>()
  const navigate = useNavigate()
  const { data: routine } = useRoutine(routineId)

  // New routine form state
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [weeksDuration, setWeeksDuration] = useState('')
  const [isTemplate, setIsTemplate] = useState(false)
  const [createdRoutineId, setCreatedRoutineId] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  const activeRoutineId = routineId ?? createdRoutineId
  const { data: days = [] } = useRoutineDays(activeRoutineId)
  const { data: students = [] } = useStudents()
  const createRoutine = useCreateRoutine()
  const createDay = useCreateRoutineDay()
  const deleteDay = useDeleteRoutineDay()
  const assignRoutine = useAssignRoutine()

  const handleCreateRoutine = async () => {
    if (!name.trim()) {
      toast.error('Ingresá un nombre para la rutina')
      return
    }
    try {
      const result = await createRoutine.mutateAsync({
        name: name.trim(),
        goal: goal.trim() || undefined,
        weeks_duration: weeksDuration ? Number(weeksDuration) : undefined,
        is_template: isTemplate,
      })
      setCreatedRoutineId(result.id)
      toast.success('Rutina creada. Ahora agregá los días.')
    } catch {
      toast.error('Error al crear rutina')
    }
  }

  const handleAddDay = async () => {
    if (!activeRoutineId) return
    try {
      await createDay.mutateAsync({
        routine_id: activeRoutineId,
        day_number: days.length + 1,
        name: `Día ${days.length + 1}`,
        order_index: days.length,
      })
    } catch {
      toast.error('Error al agregar día')
    }
  }

  const handleDeleteDay = async (dayId: string) => {
    if (!activeRoutineId) return
    if (!confirm('¿Eliminar este día y todos sus ejercicios?')) return
    try {
      await deleteDay.mutateAsync({ id: dayId, routineId: activeRoutineId })
      toast.success('Día eliminado')
    } catch {
      toast.error('Error al eliminar día')
    }
  }

  const { data: allRoutines = [] } = useRoutines()

  const getStudentActiveRoutine = (studentId: string) =>
    allRoutines.find((r) => r.student_id === studentId && r.is_active && r.id !== activeRoutineId)

  const handleAssign = async (studentId: string) => {
    if (!activeRoutineId) return
    const existingRoutine = getStudentActiveRoutine(studentId)
    if (existingRoutine) {
      if (!confirm(`Este alumno ya tiene la rutina "${existingRoutine.name}" asignada. ¿Querés reemplazarla?`)) return
    }
    try {
      await assignRoutine.mutateAsync({ routineId: activeRoutineId, studentId })
      setAssignDialogOpen(false)
      toast.success('Rutina asignada al alumno')
    } catch {
      toast.error('Error al asignar rutina')
    }
  }

  // Phase 1: Create the routine
  if (!activeRoutineId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/trainer/routines')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Nueva Rutina</h1>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="r-name">Nombre de la rutina</Label>
              <Input
                id="r-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Rutina Volumen 4 días"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-goal">Objetivo (opcional)</Label>
              <Input
                id="r-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ej: Hipertrofia con énfasis en tren superior"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-weeks">Duración en semanas (opcional)</Label>
              <Input
                id="r-weeks"
                type="number"
                value={weeksDuration}
                onChange={(e) => setWeeksDuration(e.target.value)}
                placeholder="Ej: 8"
              />
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                id="r-template"
                checked={isTemplate}
                onCheckedChange={(v) => setIsTemplate(v === true)}
              />
              <div>
                <Label htmlFor="r-template" className="cursor-pointer font-medium">
                  Guardar como plantilla
                </Label>
                <p className="text-xs text-muted-foreground">
                  Las plantillas se pueden duplicar para crear rutinas de alumnos
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleCreateRoutine}
              disabled={createRoutine.isPending}
            >
              {createRoutine.isPending ? 'Creando...' : 'Crear rutina'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Phase 2: Add days and exercises
  const displayName = routine?.name ?? name

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/trainer/routines')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {routine?.goal && <p className="text-sm text-muted-foreground">{routine.goal}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserCheck className="h-4 w-4" />
                Asignar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar rutina a un alumno</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {students.filter((s) => s.is_active).map((student) => {
                  const activeRoutine = getStudentActiveRoutine(student.id)
                  return (
                    <Button
                      key={student.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleAssign(student.id)}
                    >
                      <div className="flex flex-col items-start">
                        <span>{student.full_name}</span>
                        {activeRoutine && (
                          <span className="text-xs text-amber-600">Rutina asignada: {activeRoutine.name}</span>
                        )}
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">{student.email}</span>
                    </Button>
                  )
                })}
                {students.filter((s) => s.is_active).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No tenés alumnos activos. Agregá uno primero.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button className="gap-2" onClick={handleAddDay}>
            <Plus className="h-4 w-4" />
            Agregar día
          </Button>
        </div>
      </div>

      {days.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground">Esta rutina no tiene días aún</p>
          <Button className="mt-4 gap-2" onClick={handleAddDay}>
            <Plus className="h-4 w-4" />
            Agregar primer día
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <RoutineDayCard
              key={day.id}
              dayId={day.id}
              dayName={day.name}
              routineId={activeRoutineId}
              onDelete={() => handleDeleteDay(day.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ================================
// Sub-component: RoutineDayCard
// ================================
interface RoutineDayCardProps {
  dayId: string
  dayName: string
  routineId: string
  onDelete: () => void
}

function RoutineDayCard({ dayId, dayName, routineId, onDelete }: RoutineDayCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(dayName)
  const { data: exercises = [] } = useExercises(dayId)
  const updateDay = useUpdateRoutineDay()
  const createExercise = useCreateExercise()
  const updateExercise = useUpdateExercise()
  const deleteExercise = useDeleteExercise()

  const handleAddExercise = async (libraryExercise: ExerciseLibrary) => {
    try {
      await createExercise.mutateAsync({
        routine_day_id: dayId,
        exercise_library_id: libraryExercise.id,
        is_main_lift: libraryExercise.exercise_type === 'compound',
        sets: [{ set_number: 1, reps: 8, weight_kg: 0 }],
        rest_seconds: 90,
        order_index: exercises.length,
      })
    } catch {
      toast.error('Error al agregar ejercicio')
    }
  }

  const handleUpdateSets = async (exerciseId: string, sets: PlannedSet[]) => {
    try {
      await updateExercise.mutateAsync({ id: exerciseId, sets })
    } catch {
      toast.error('Error al actualizar series')
    }
  }

  const handleToggleMainLift = async (exerciseId: string, current: boolean) => {
    try {
      await updateExercise.mutateAsync({ id: exerciseId, is_main_lift: !current })
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleUpdateNotes = async (exerciseId: string, notes: string) => {
    try {
      await updateExercise.mutateAsync({ id: exerciseId, notes: notes || undefined })
    } catch {
      toast.error('Error al actualizar notas')
    }
  }

  const handleUpdateRest = async (exerciseId: string, rest_seconds: number) => {
    try {
      await updateExercise.mutateAsync({ id: exerciseId, rest_seconds })
    } catch {
      toast.error('Error al actualizar descanso')
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      await deleteExercise.mutateAsync({ id: exerciseId, routineDayId: dayId })
    } catch {
      toast.error('Error al eliminar ejercicio')
    }
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer pb-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {editingName ? (
              <Input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={async () => {
                  setEditingName(false)
                  if (nameValue.trim() && nameValue.trim() !== dayName) {
                    try {
                      await updateDay.mutateAsync({ id: dayId, routine_id: routineId, name: nameValue.trim() })
                    } catch { toast.error('Error al renombrar día') }
                  } else {
                    setNameValue(dayName)
                  }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                onClick={(e) => e.stopPropagation()}
                className="h-7 w-40 text-base font-semibold"
              />
            ) : (
              <div className="flex items-center gap-1">
                <CardTitle className="text-base">{dayName}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={(e) => { e.stopPropagation(); setEditingName(true) }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Badge variant="secondary" className="text-xs">{exercises.length} ejercicios</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {exercises.map((exercise, index) => (
            <ExerciseBlock
              key={exercise.id}
              exercise={exercise}
              index={index}
              onUpdateSets={(sets) => handleUpdateSets(exercise.id, sets)}
              onToggleMainLift={() => handleToggleMainLift(exercise.id, exercise.is_main_lift)}
              onUpdateNotes={(notes) => handleUpdateNotes(exercise.id, notes)}
              onUpdateRest={(rest) => handleUpdateRest(exercise.id, rest)}
              onDelete={() => handleDeleteExercise(exercise.id)}
            />
          ))}

          <ExerciseSearch onSelect={handleAddExercise} />
        </CardContent>
      )}
    </Card>
  )
}

// ================================
// Sub-component: ExerciseBlock
// ================================
interface ExerciseBlockProps {
  exercise: Exercise
  index: number
  onUpdateSets: (sets: PlannedSet[]) => void
  onToggleMainLift: () => void
  onUpdateNotes: (notes: string) => void
  onUpdateRest: (rest: number) => void
  onDelete: () => void
}

function ExerciseBlock({
  exercise,
  onUpdateSets,
  onToggleMainLift,
  onUpdateNotes,
  onUpdateRest,
  onDelete,
}: ExerciseBlockProps) {
  const [showDetails, setShowDetails] = useState(false)
  const exerciseName = exercise.exercise_library?.name ?? 'Ejercicio'

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMainLift}
            className={`transition-colors ${exercise.is_main_lift ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-300'}`}
            title={exercise.is_main_lift ? 'Ejercicio principal' : 'Marcar como principal'}
          >
            <Star className="h-4 w-4" fill={exercise.is_main_lift ? 'currentColor' : 'none'} />
          </button>
          <span className="font-medium">{exerciseName}</span>
          {exercise.is_main_lift && (
            <Badge variant="outline" className="text-xs text-amber-600">Principal</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Ocultar' : 'Detalles'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <SetsEditor sets={exercise.sets} onChange={onUpdateSets} />

      {showDetails && (
        <div className="space-y-3 border-t pt-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Descanso (seg)</Label>
              <Input
                type="number"
                min={0}
                step={15}
                defaultValue={exercise.rest_seconds}
                onBlur={(e) => onUpdateRest(Number(e.target.value))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Video URL</Label>
              <Input
                defaultValue={exercise.video_url ?? ''}
                placeholder="https://..."
                className="h-8"
                disabled
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas para el alumno</Label>
            <Textarea
              defaultValue={exercise.notes ?? ''}
              onBlur={(e) => onUpdateNotes(e.target.value)}
              placeholder="Indicaciones técnicas, variantes..."
              rows={2}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
