import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { useAuthListener } from '@/services/auth'

export default function AuthCallbackPage() {
  useAuthListener()
  const navigate = useNavigate()
  const { user, role, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && user) {
      if (role === 'trainer') {
        navigate('/trainer/dashboard', { replace: true })
      } else if (role === 'student') {
        navigate('/student/home', { replace: true })
      } else {
        // Check if coming from an invite link
        const pendingToken = localStorage.getItem('pending_invite_token')
        if (pendingToken) {
          navigate(`/invite/${pendingToken}`, { replace: true })
        } else {
          navigate('/onboarding', { replace: true })
        }
      }
    } else if (!isLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, role, isLoading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Procesando autenticación...</p>
      </div>
    </div>
  )
}
