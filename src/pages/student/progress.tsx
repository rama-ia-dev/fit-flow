import { Calendar, TrendingUp, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTrainingLogsWithDays } from '@/services/training-logs'

function getRpeColor(rpe: number) {
  if (rpe <= 5) return 'bg-green-100 text-green-700'
  if (rpe <= 7) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

export default function StudentProgressPage() {
  const { data: logs = [], isLoading } = useTrainingLogsWithDays()

  const totalSessions = logs.length
  const avgRpe = logs.length > 0
    ? Math.round(logs.filter((l) => l.perceived_effort).reduce((acc, l) => acc + (l.perceived_effort ?? 0), 0) / logs.filter((l) => l.perceived_effort).length * 10) / 10
    : null
  const totalMinutes = logs.reduce((acc, l) => acc + (l.duration_minutes ?? 0), 0)

  // Group logs by month
  const byMonth: Record<string, typeof logs> = {}
  for (const log of logs) {
    const date = new Date(log.logged_date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(log)
  }

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi progreso</h1>
        <p className="text-sm text-muted-foreground">Historial de entrenamientos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <TrendingUp className="mb-1 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-center text-xs text-muted-foreground">Sesiones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <Zap className="mb-1 h-5 w-5 text-amber-500" />
            <p className="text-2xl font-bold">{avgRpe ?? '—'}</p>
            <p className="text-center text-xs text-muted-foreground">RPE prom.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <Clock className="mb-1 h-5 w-5 text-blue-500" />
            <p className="text-2xl font-bold">{totalMinutes > 0 ? Math.round(totalMinutes / 60) : '—'}</p>
            <p className="text-center text-xs text-muted-foreground">Horas totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Log list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Calendar className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Sin entrenamientos registrados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Empezá a entrenar para ver tu historial aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(byMonth).map(([monthKey, monthLogs]) => {
            const [year, month] = monthKey.split('-')
            const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`
            return (
              <div key={monthKey}>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {monthLabel} · {monthLogs.length} sesiones
                </h2>
                <div className="space-y-2">
                  {monthLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <span className="text-sm font-bold text-primary">
                            {new Date(log.logged_date).getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {log.routine_days?.name ?? 'Entrenamiento'}
                          </p>
                          {log.routine_days?.muscle_groups && log.routine_days.muscle_groups.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {log.routine_days.muscle_groups.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {log.duration_minutes && (
                          <span>{log.duration_minutes} min</span>
                        )}
                        {log.perceived_effort && (
                          <Badge className={`text-xs font-medium ${getRpeColor(log.perceived_effort)}`}>
                            RPE {log.perceived_effort}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
