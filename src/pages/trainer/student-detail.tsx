import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useStudent, useUpdateStudent, useDeleteStudent } from '@/services/students'
import type { StudentGoal } from '@/types/database'

const GOAL_LABELS: Record<StudentGoal, string> = {
  muscle_gain: 'Ganar masa muscular',
  fat_loss: 'Perder grasa',
  strength: 'Fuerza máxima',
  endurance: 'Resistencia',
  maintenance: 'Mantenimiento',
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const { data: student, isLoading } = useStudent(studentId)
  const updateStudent = useUpdateStudent()
  const deleteStudent = useDeleteStudent()
  const [copied, setCopied] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!student) {
    return <p className="text-muted-foreground">Alumno no encontrado</p>
  }

  const inviteLink = student.invite_token
    ? `${window.location.origin}/invite/${student.invite_token}`
    : null

  const handleCopy = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Link copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpdate = async (field: string, value: unknown) => {
    try {
      await updateStudent.mutateAsync({ id: student.id, [field]: value })
      toast.success('Alumno actualizado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este alumno? Esta acción no se puede deshacer.')) return
    try {
      await deleteStudent.mutateAsync(student.id)
      toast.success('Alumno eliminado')
      navigate('/trainer/students')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/trainer/students')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{student.full_name}</h1>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
        <Badge variant={student.is_active ? 'default' : 'destructive'}>
          {student.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {inviteLink && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link de invitación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              El alumno aún no aceptó la invitación. Compartí este link.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del alumno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Objetivo actual</Label>
            <Select
              value={student.current_goal}
              onValueChange={(v) => handleUpdate('current_goal', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GOAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                defaultValue={student.weight_kg ?? ''}
                onBlur={(e) => handleUpdate('weight_kg', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Altura (cm)</Label>
              <Input
                type="number"
                defaultValue={student.height_cm ?? ''}
                onBlur={(e) => handleUpdate('height_cm', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Estado activo</p>
              <p className="text-xs text-muted-foreground">Desactivar al alumno oculta su acceso</p>
            </div>
            <Switch
              checked={student.is_active}
              onCheckedChange={(checked) => handleUpdate('is_active', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="font-medium text-destructive">Eliminar alumno</p>
            <p className="text-xs text-muted-foreground">
              Se eliminarán todos sus datos, rutinas y registros.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
