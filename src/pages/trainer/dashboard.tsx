import { Link } from 'react-router-dom'
import { Users, Dumbbell, BrainCircuit, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const activeRoutines = routines.filter((r) => r.is_active && r.student_id && !r.is_template)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          ¡Hola{trainer?.full_name ? `, ${trainer.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Plan {trainer?.plan_tier ?? 'starter'} · {activeStudents.length}/{trainer?.max_students ?? 2} alumnos
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alumnos activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeStudents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rutinas activas</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeRoutines.length}</div>
          </CardContent>
        </Card>
        <Link to="/trainer/approvals">
          <Card className={`transition-shadow hover:shadow-md ${pendingCount > 0 ? 'border-amber-300' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprobaciones pendientes</CardTitle>
              <BrainCircuit className={`h-4 w-4 ${pendingCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${pendingCount > 0 ? 'text-amber-600' : ''}`}>
                {pendingCount}
              </div>
              {pendingCount > 0 && (
                <p className="text-xs text-amber-600">Requieren tu revisión</p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start gap-2" variant="outline">
              <Link to="/trainer/students">
                <Users className="h-4 w-4" />
                Ver alumnos
              </Link>
            </Button>
            <Button asChild className="w-full justify-start gap-2" variant="outline">
              <Link to="/trainer/routines/new">
                <Plus className="h-4 w-4" />
                Crear rutina
              </Link>
            </Button>
            <Button asChild className="w-full justify-start gap-2" variant="outline">
              <Link to="/trainer/routines">
                <Dumbbell className="h-4 w-4" />
                Ver rutinas
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos alumnos</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no tenés alumnos. <Link to="/trainer/students" className="text-primary underline">Agregá uno.</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {students.slice(0, 5).map((student) => (
                  <Link
                    key={student.id}
                    to={`/trainer/students/${student.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
