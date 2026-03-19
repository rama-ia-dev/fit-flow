import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, ArrowRight, ArrowLeft, Check, UserPlus, SkipForward } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth-store'
import { useAuthListener, useSignOut } from '@/services/auth'
import { useCreateTrainer } from '@/services/trainers'
import { useCreateStudent } from '@/services/students'
import type { StudentGoal } from '@/types/database'

const GOAL_LABELS: Record<StudentGoal, string> = {
  muscle_gain: 'Ganar masa muscular',
  fat_loss: 'Perder grasa',
  strength: 'Fuerza máxima',
  endurance: 'Resistencia',
  maintenance: 'Mantenimiento',
}

export default function OnboardingPage() {
  useAuthListener()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const createTrainer = useCreateTrainer()
  const createStudent = useCreateStudent()
  const signOut = useSignOut()

  const [step, setStep] = useState(1)
  const [trainerName, setTrainerName] = useState(user?.user_metadata?.full_name ?? '')
  const [studentData, setStudentData] = useState({
    full_name: '',
    email: '',
    current_goal: 'maintenance' as StudentGoal,
    weight_kg: '',
    height_cm: '',
  })

  const handleCreateTrainer = async () => {
    if (!trainerName.trim()) {
      toast.error('Ingresá tu nombre completo')
      return
    }
    try {
      await createTrainer.mutateAsync({
        full_name: trainerName.trim(),
        email: user?.email ?? '',
        avatar_url: user?.user_metadata?.avatar_url,
      })
      setStep(2)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? JSON.stringify(err)
      toast.error(`Error al crear el perfil: ${msg}`)
    }
  }

  const handleCreateStudent = async () => {
    if (!studentData.full_name.trim() || !studentData.email.trim()) {
      toast.error('Completá el nombre y email del alumno')
      return
    }
    try {
      await createStudent.mutateAsync({
        full_name: studentData.full_name.trim(),
        email: studentData.email.trim(),
        current_goal: studentData.current_goal,
        weight_kg: studentData.weight_kg ? Number(studentData.weight_kg) : undefined,
        height_cm: studentData.height_cm ? Number(studentData.height_cm) : undefined,
      })
      setStep(3)
    } catch {
      toast.error('Error al crear el alumno')
    }
  }

  const handleFinish = () => {
    navigate('/trainer/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="relative w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <button
            onClick={() => signOut.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })}
            className="absolute right-4 top-4 text-xs text-muted-foreground hover:text-foreground"
          >
            Salir
          </button>
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <CardTitle className="text-xl">Tu perfil de entrenador</CardTitle>
                <CardDescription className="mt-1">
                  Configuremos tu cuenta en FitFlow
                </CardDescription>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trainer-name">Nombre completo</Label>
                  <Input
                    id="trainer-name"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ''} disabled />
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleCreateTrainer}
                disabled={createTrainer.isPending}
              >
                {createTrainer.isPending ? 'Creando perfil...' : 'Continuar'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <CardTitle className="text-xl">Agregá tu primer alumno</CardTitle>
                <CardDescription className="mt-1">
                  Podés saltear este paso y agregar alumnos después
                </CardDescription>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-name">Nombre del alumno</Label>
                  <Input
                    id="student-name"
                    value={studentData.full_name}
                    onChange={(e) => setStudentData((s) => ({ ...s, full_name: e.target.value }))}
                    placeholder="Ej: Martín Palermo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-email">Email del alumno</Label>
                  <Input
                    id="student-email"
                    type="email"
                    value={studentData.email}
                    onChange={(e) => setStudentData((s) => ({ ...s, email: e.target.value }))}
                    placeholder="alumno@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Select
                    value={studentData.current_goal}
                    onValueChange={(v) => setStudentData((s) => ({ ...s, current_goal: v as StudentGoal }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GOAL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={studentData.weight_kg}
                      onChange={(e) => setStudentData((s) => ({ ...s, weight_kg: e.target.value }))}
                      placeholder="75"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={studentData.height_cm}
                      onChange={(e) => setStudentData((s) => ({ ...s, height_cm: e.target.value }))}
                      placeholder="175"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(3)}>
                  <SkipForward className="h-4 w-4" />
                  Saltear
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleCreateStudent}
                  disabled={createStudent.isPending}
                >
                  <UserPlus className="h-4 w-4" />
                  {createStudent.isPending ? 'Agregando...' : 'Agregar alumno'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <CardTitle className="text-xl">¡Todo listo!</CardTitle>
                  <CardDescription className="mt-2">
                    Tu cuenta está configurada. Ya podés empezar a crear rutinas y gestionar alumnos.
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setStudentData({ full_name: '', email: '', current_goal: 'maintenance', weight_kg: '', height_cm: '' })
                  setStep(2)
                }}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Agregar alumno
                </Button>
                <Button className="flex-1" onClick={handleFinish}>
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
