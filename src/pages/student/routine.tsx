import { Link } from 'react-router-dom'
import { Dumbbell, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useActiveRoutine, useStudentRoutineDays } from '@/services/student-routines'

export default function StudentRoutinePage() {
  const { data: routine } = useActiveRoutine()
  const { data: days = [] } = useStudentRoutineDays(routine?.id)

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="font-medium">Sin rutina asignada</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{routine.name}</h1>
        {routine.goal && <p className="text-sm text-muted-foreground">{routine.goal}</p>}
        {routine.weeks_duration && (
          <p className="text-sm text-muted-foreground">{routine.weeks_duration} semanas</p>
        )}
      </div>

      <div className="space-y-3">
        {days.map((day) => (
          <Link key={day.id} to={`/student/routine/${day.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {day.day_number}
                  </div>
                  <div>
                    <p className="font-medium">{day.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {day.muscle_groups.map((mg) => (
                        <Badge key={mg} variant="secondary" className="text-xs">{mg}</Badge>
                      ))}
                      {day.includes_cardio && (
                        <Badge variant="outline" className="text-xs">Cardio</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
