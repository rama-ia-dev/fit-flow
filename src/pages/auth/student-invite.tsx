import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Dumbbell, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useStudentByInviteToken, useAcceptInvite } from '@/services/auth'

export default function StudentInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { data: studentInfo, isLoading, isError } = useStudentByInviteToken(token)
  const acceptInvite = useAcceptInvite()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentInfo || !token) return

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Create auth account with the student's registered email
      const { error: signUpError } = await supabase.auth.signUp({
        email: studentInfo.email,
        password,
      })
      if (signUpError) throw signUpError

      // 2. Link the auth account to the student record
      await acceptInvite.mutateAsync(token)

      setDone(true)
      setTimeout(() => navigate('/student/home', { replace: true }), 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      if (message.includes('already registered')) {
        toast.error('Este email ya tiene una cuenta. Intentá iniciar sesión.')
      } else {
        toast.error(`Error: ${message}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Invitación FitFlow</CardTitle>
          <CardDescription>
            Tu entrenador te invitó a unirte a su plataforma
          </CardDescription>
        </CardHeader>

        <CardContent>
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center font-medium">¡Cuenta creada!</p>
              <p className="text-center text-sm text-muted-foreground">
                Redirigiendo a tu portal...
              </p>
            </div>
          ) : isError || !studentInfo ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center font-medium">Invitación inválida</p>
              <p className="text-center text-sm text-muted-foreground">
                Este link de invitación es inválido o ya fue utilizado.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Hola, <span className="font-medium text-foreground">{studentInfo.full_name}</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">Vas a activar tu cuenta con este email:</p>
                <p className="mt-1 font-medium">{studentInfo.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Creá tu contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmá tu contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetí la contraseña"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creando cuenta...' : 'Activar mi cuenta'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
