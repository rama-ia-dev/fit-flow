import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AddStudentDialog } from '@/components/trainer/add-student-dialog'
import { useStudents } from '@/services/students'

const GOAL_LABELS: Record<string, string> = {
  muscle_gain: 'Masa muscular',
  fat_loss: 'Pérdida de grasa',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  maintenance: 'Mantenimiento',
}

export default function TrainerStudentsPage() {
  const { data: students = [], isLoading } = useStudents()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alumnos</h1>
          <p className="text-sm text-muted-foreground">{students.length} alumno(s) en total</p>
        </div>
        <AddStudentDialog />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Sin alumnos</h3>
          <p className="mt-1 text-sm text-muted-foreground">Agregá tu primer alumno para empezar</p>
          <div className="mt-4">
            <AddStudentDialog />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Vinculado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Link
                      to={`/trainer/students/${student.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {student.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {GOAL_LABELS[student.current_goal] ?? student.current_goal}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.is_active ? 'default' : 'destructive'}>
                      {student.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {student.auth_user_id ? (
                      <Badge variant="outline" className="text-green-600">Sí</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">Pendiente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
