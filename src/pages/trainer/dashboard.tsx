import { Link } from 'react-router-dom'
import { Users, Dumbbell, BrainCircuit, Plus, AlertCircle, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStudents } from '@/services/students'
import { useRoutines } from '@/services/routines'
import { useTrainerProfile } from '@/services/auth'
import { usePendingSuggestionsCount } from '@/services/ai-suggestions'

export default function TrainerDashboardPage() {
  const { data: trainer } = useTrainerProfile()
  const { data: students = [] } = useStudents()
  const { data: routines = [] } = useRoutines()
  const { data: pendingCount = 0 } = usePendingSuggestionsCount()

  const activeStudents = students.filter((s) => s.is_active)
  const assignedRoutines = routines.filter((r) => r.is_active && r.student_id && !r.is_template)

  // Map student_id → routine name
  const routineByStudent = Object.fromEntries(
    assignedRoutines.map((r) => [r.student_id, r.name])
  )

  const studentsWithoutRoutine = activeStudents.filter((s) => !routineByStudent[s.id])
  const coveragePercent = activeStudents.length > 0
    ? Math.round((activeStudents.length - studentsWithoutRoutine.length) / activeStudents.length * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          ¡Hola{trainer?.full_name ? `, ${trainer.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-muted-foreground text-sm">
          Plan {trainer?.plan_tier ?? 'starter'} · {activeStudents.length}/{trainer?.max_students ?? 2} alumnos
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alumnos activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeStudents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {coveragePercent}% con rutina asignada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rutinas activas</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignedRoutines.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {routines.filter((r) => r.is_template).length} plantillas disponibles
            </p>
          </CardContent>
        </Card>

        <Link to="/trainer/approvals">
          <Card className={`transition-shadow hover:shadow-md cursor-pointer ${pendingCount > 0 ? 'border-amber-300' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprobaciones IA</CardTitle>
              <BrainCircuit className={`h-4 w-4 ${pendingCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${pendingCount > 0 ? 'text-amber-600' : ''}`}>
                {pendingCount}
              </div>
              <p className={`text-xs mt-1 ${pendingCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {pendingCount > 0 ? 'Requieren tu revisión' : 'Todo al día'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alerta alumnos sin rutina */}
      {studentsWithoutRoutine.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              {studentsWithoutRoutine.length === 1
                ? '1 alumno sin rutina asignada'
                : `${studentsWithoutRoutine.length} alumnos sin rutina asignada`}
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {studentsWithoutRoutine.map((s) => s.full_name).join(', ')}
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
            <Link to="/trainer/routines">Asignar rutina</Link>
          </Button>
        </div>
      )}

      {/* Mis alumnos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Mis alumnos</CardTitle>
          <Button asChild size="sm" variant="ghost" className="gap-1 text-muted-foreground">
            <Link to="/trainer/students">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">Todavía no tenés alumnos</p>
                <p className="text-xs text-muted-foreground mt-1">Agregá tu primer alumno para empezar</p>
              </div>
              <Button asChild size="sm">
                <Link to="/trainer/students">
                  <Plus className="h-4 w-4 mr-1" /> Agregar alumno
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {students.map((student) => {
                const routineName = routineByStudent[student.id]
                return (
                  <Link
                    key={student.id}
                    to={`/trainer/students/${student.id}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-accent/50 -mx-2 px-2 rounded-lg"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {student.full_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.full_name}</p>
                      <p className={`text-xs truncate ${routineName ? 'text-muted-foreground' : 'text-orange-500'}`}>
                        {routineName ?? 'Sin rutina asignada'}
                      </p>
                    </div>

                    {/* Badge */}
                    <Badge
                      variant={student.is_active ? 'default' : 'secondary'}
                      className={student.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                    >
                      {student.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>

                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/trainer/students">
            <Users className="h-4 w-4" /> Gestionar alumnos
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/trainer/routines/new">
            <Plus className="h-4 w-4" /> Nueva rutina
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/trainer/routines">
            <Dumbbell className="h-4 w-4" /> Ver rutinas
          </Link>
        </Button>
      </div>

    </div>
  )
}
