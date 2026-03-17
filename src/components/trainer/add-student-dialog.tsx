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
import { useCreateStudent } from '@/services/students'
import type { StudentGoal } from '@/types/database'

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
    setForm({ full_name: '', email: '', current_goal: 'maintenance', weight_kg: '', height_cm: '' })
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
            <Button type="submit" className="w-full" disabled={createStudent.isPending}>
              {createStudent.isPending ? 'Creando...' : 'Crear alumno'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
