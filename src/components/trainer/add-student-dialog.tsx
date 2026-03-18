import { useState } from 'react'
import { UserPlus, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateStudent } from '@/services/students'
import type { StudentGoal, StudentIdType } from '@/types/database'

const ID_TYPE_LABELS: Record<StudentIdType, string> = {
  dni: 'DNI',
  passport: 'Pasaporte',
  cedula: 'Cédula',
  other: 'Otro',
}

const GOAL_LABELS: Record<StudentGoal, string> = {
  muscle_gain: 'Ganar masa muscular',
  fat_loss: 'Perder grasa',
  strength: 'Fuerza máxima',
  endurance: 'Resistencia',
  maintenance: 'Mantenimiento',
}

export function AddStudentDialog() {
  const [open, setOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const createStudent = useCreateStudent()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    current_goal: 'maintenance' as StudentGoal,
    weight_kg: '',
    height_cm: '',
    birth_date: '',
    id_type: '' as StudentIdType | '',
    id_number: '',
    phone: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Completá nombre y email')
      return
    }

    try {
      const student = await createStudent.mutateAsync({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        current_goal: form.current_goal,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        height_cm: form.height_cm ? Number(form.height_cm) : undefined,
        birth_date: form.birth_date || undefined,
        id_type: form.id_type || undefined,
        id_number: form.id_number.trim() || undefined,
        phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })

      const link = `${window.location.origin}/invite/${student.invite_token}`
      setInviteLink(link)
      toast.success('Alumno creado exitosamente')
    } catch {
      toast.error('Error al crear alumno')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Link copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setOpen(false)
    setInviteLink('')
    setCopied(false)
    setForm({ full_name: '', email: '', current_goal: 'maintenance', weight_kg: '', height_cm: '', birth_date: '', id_type: '', id_number: '', phone: '', notes: '' })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Agregar alumno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{inviteLink ? 'Alumno creado' : 'Nuevo alumno'}</DialogTitle>
          <DialogDescription>
            {inviteLink
              ? 'Compartí este link con tu alumno para que se una a tu plataforma.'
              : 'Completá los datos del alumno. Recibirá un link de invitación.'}
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button className="w-full" onClick={handleClose}>Cerrar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">Nombre completo</Label>
              <Input
                id="s-name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Martín Palermo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email">Email</Label>
              <Input
                id="s-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="alumno@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select
                value={form.current_goal}
                onValueChange={(v) => setForm((f) => ({ ...f, current_goal: v as StudentGoal }))}
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
            <div className="space-y-2">
              <Label htmlFor="s-phone">Teléfono</Label>
              <Input
                id="s-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-birth">Fecha de nacimiento</Label>
              <Input
                id="s-birth"
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de identificación</Label>
                <Select
                  value={form.id_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, id_type: v as StudentIdType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-idnum">Nro. de identificación</Label>
                <Input
                  id="s-idnum"
                  value={form.id_number}
                  onChange={(e) => setForm((f) => ({ ...f, id_number: e.target.value }))}
                  placeholder="12345678"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-weight">Peso (kg)</Label>
                <Input
                  id="s-weight"
                  type="number"
                  value={form.weight_kg}
                  onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                  placeholder="75"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-height">Altura (cm)</Label>
                <Input
                  id="s-height"
                  type="number"
                  value={form.height_cm}
                  onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
                  placeholder="175"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-notes">Notas / Comentarios</Label>
              <Textarea
                id="s-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Lesiones, condiciones médicas, preferencias..."
                rows={2}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createStudent.isPending}>
              {createStudent.isPending ? 'Creando...' : 'Crear alumno'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
