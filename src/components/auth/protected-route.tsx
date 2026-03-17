import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, type UserRole } from '@/stores/auth-store'
import { useAuthListener } from '@/services/auth'

function AuthLoader({ children }: { children: React.ReactNode }) {
  useAuthListener()
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

interface ProtectedRouteProps {
  allowedRole: UserRole
}

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, role } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // User authenticated but no role -> needs onboarding
  if (role === null) {
    return <Navigate to="/onboarding" replace />
  }

  // Wrong role -> redirect to correct portal
  if (role !== allowedRole) {
    if (role === 'trainer') return <Navigate to="/trainer/dashboard" replace />
    if (role === 'student') return <Navigate to="/student/home" replace />
  }

  return <Outlet />
}

export { AuthLoader }
