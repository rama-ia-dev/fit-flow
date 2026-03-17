import { Link } from 'react-router-dom'
import { Dumbbell, ClipboardEdit, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useActiveRoutine, useStudentRoutineDays } from '@/services/student-routines'
import { useTrainingLogs } from '@/services/training-logs'
import { useStudentProfile } from '@/services/auth'

const GOAL_LABELS: Record<string, string> = {
  muscle_gain: 'Masa muscular',
  fat_loss: 'Pérdida de grasa',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  maintenance: 'Mantenimiento',
}

export default function StudentHomePage() {
  const { data: student } = useStudentProfile()
  const { data: routine } = useActiveRoutine()
  const { data: days = [] } = useStudentRoutineDays(routine?.id)
  const { data: logs = [] } = useTrainingLogs()

  // Determine next day to train
  const lastLog = logs[0]
  let nextDayIndex = 0
  if (lastLog && days.length > 0) {
    const lastDayIndex = days.findIndex((d) => d.id === lastLog.routine_day_id)
    if (lastDayIndex >= 0) {
      nextDayIndex = (lastDayIndex + 1) % days.length
    }
  }
  const nextDay = days[nextDayIndex]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          ¡Hola{student?.full_name ? `, ${student.full_name.split(' ')[0]}` : ''}!
        </h1>
        {student?.current_goal && (
          <p className="text-sm text-muted-foreground">
            Objetivo: {GOAL_LABELS[student.current_goal] ?? student.current_goal}
          </p>
        )}
      </div>

      {!routine ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Sin rutina asignada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu entrenador aún no te asignó una rutina.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Hoy toca</CardTitle>
                <Badge variant="secondary">{routine.name}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {nextDay ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{nextDay.name}</p>
                      {nextDay.muscle_groups.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {nextDay.muscle_groups.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1 gap-2">
                      <Link to={`/student/log/${nextDay.id}`}>
                        <ClipboardEdit className="h-4 w-4" />
                        Empezar entrenamiento
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to={`/student/routine/${nextDay.id}`}>Ver detalle</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No hay días configurados en tu rutina.</p>
              )}
            </CardContent>
          </Card>

          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Últimos entrenamientos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {logs.slice(0, 5).map((log) => {
                  const day = days.find((d) => d.id === log.routine_day_id)
                  return (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{day?.name ?? 'Día de rutina'}</p>
                          <p className="text-xs text-muted-foreground">{log.logged_date}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {log.duration_minutes && <p>{log.duration_minutes} min</p>}
                        {log.perceived_effort && <p>RPE {log.perceived_effort}/10</p>}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
