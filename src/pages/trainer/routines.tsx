import { Link } from 'react-router-dom'
import { Plus, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRoutines } from '@/services/routines'
import { useStudents } from '@/services/students'

export default function TrainerRoutinesPage() {
  const { data: routines = [], isLoading } = useRoutines()
  const { data: students = [] } = useStudents()

  const getStudentName = (studentId: string | null) => {
    if (!studentId) return null
    return students.find((s) => s.id === studentId)?.full_name ?? 'Alumno desconocido'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rutinas</h1>
          <p className="text-sm text-muted-foreground">{routines.length} rutina(s)</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/trainer/routines/new">
            <Plus className="h-4 w-4" />
            Nueva rutina
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Sin rutinas</h3>
          <p className="mt-1 text-sm text-muted-foreground">Creá tu primera rutina para asignarla a un alumno</p>
          <Button asChild className="mt-4 gap-2">
            <Link to="/trainer/routines/new">
              <Plus className="h-4 w-4" />
              Crear rutina
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routines.map((routine) => {
            const studentName = getStudentName(routine.student_id)
            return (
              <Link key={routine.id} to={`/trainer/routines/${routine.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{routine.name}</CardTitle>
                      {routine.is_active && <Badge className="text-xs">Activa</Badge>}
                      {routine.is_template && <Badge variant="secondary" className="text-xs">Plantilla</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {routine.goal && <p>Objetivo: {routine.goal}</p>}
                    {routine.weeks_duration && <p>Duración: {routine.weeks_duration} semanas</p>}
                    {studentName ? (
                      <p>Asignada a: <span className="font-medium text-foreground">{studentName}</span></p>
                    ) : (
                      <p className="italic">Sin asignar</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
