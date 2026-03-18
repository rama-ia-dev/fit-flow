import { useNavigate, Link } from 'react-router-dom'
import { Plus, Dumbbell, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useRoutines, useDuplicateRoutine } from '@/services/routines'
import { useStudents } from '@/services/students'

export default function TrainerRoutinesPage() {
  const navigate = useNavigate()
  const { data: routines = [], isLoading } = useRoutines()
  const { data: students = [] } = useStudents()
  const duplicate = useDuplicateRoutine()

  const getStudentName = (studentId: string | null) => {
    if (!studentId) return null
    return students.find((s) => s.id === studentId)?.full_name ?? 'Alumno desconocido'
  }

  const handleDuplicate = async (e: React.MouseEvent, routineId: string, routineName: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const result = await duplicate.mutateAsync(routineId)
      toast.success(`"${routineName}" duplicada como nueva rutina`)
      navigate(`/trainer/routines/${result.id}`)
    } catch {
      toast.error('Error al duplicar rutina')
    }
  }

  const templates = routines.filter((r) => r.is_template)
  const active = routines.filter((r) => r.is_active && !r.is_template)
  const others = routines.filter((r) => !r.is_template && !r.is_active)

  const RoutineCard = ({ routine }: { routine: typeof routines[0] }) => {
    const studentName = getStudentName(routine.student_id)
    return (
      <Link to={`/trainer/routines/${routine.id}`}>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-tight">{routine.name}</CardTitle>
              <div className="flex shrink-0 gap-1">
                {routine.is_active && <Badge className="text-xs">Activa</Badge>}
                {routine.is_template && <Badge variant="secondary" className="text-xs">Plantilla</Badge>}
              </div>
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
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => handleDuplicate(e, routine.id, routine.name)}
              disabled={duplicate.isPending}
            >
              <Copy className="h-3 w-3" />
              Duplicar
            </Button>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const EmptyState = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
      <Dumbbell className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )

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
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todas ({routines.length})</TabsTrigger>
            <TabsTrigger value="active">Activas ({active.length})</TabsTrigger>
            <TabsTrigger value="templates">Plantillas ({templates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {routines.map((r) => <RoutineCard key={r.id} routine={r} />)}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            {active.length === 0 ? (
              <EmptyState label="No hay rutinas activas asignadas a alumnos" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((r) => <RoutineCard key={r.id} routine={r} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            {templates.length === 0 ? (
              <EmptyState label='Creá una rutina marcándola como "Plantilla" para reutilizarla' />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((r) => <RoutineCard key={r.id} routine={r} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
