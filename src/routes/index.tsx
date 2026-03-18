import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { TrainerLayout } from '@/components/layout/trainer-layout'
import { StudentLayout } from '@/components/layout/student-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/login'))
const AuthCallbackPage = lazy(() => import('@/pages/auth/callback'))
const OnboardingPage = lazy(() => import('@/pages/auth/onboarding'))
const StudentInvitePage = lazy(() => import('@/pages/auth/student-invite'))

// Trainer pages
const TrainerDashboardPage = lazy(() => import('@/pages/trainer/dashboard'))
const TrainerStudentsPage = lazy(() => import('@/pages/trainer/students'))
const StudentDetailPage = lazy(() => import('@/pages/trainer/student-detail'))
const TrainerRoutinesPage = lazy(() => import('@/pages/trainer/routines'))
const RoutineBuilderPage = lazy(() => import('@/pages/trainer/routine-builder'))
const TrainerApprovalsPage = lazy(() => import('@/pages/trainer/approvals'))

// Student pages
const StudentHomePage = lazy(() => import('@/pages/student/home'))
const StudentRoutinePage = lazy(() => import('@/pages/student/routine'))
const RoutineDayPage = lazy(() => import('@/pages/student/routine-day'))
const LogTrainingPage = lazy(() => import('@/pages/student/log-training'))
const StudentProgressPage = lazy(() => import('@/pages/student/progress'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
  },
  {
    path: '/auth/callback',
    element: <SuspenseWrapper><AuthCallbackPage /></SuspenseWrapper>,
  },
  {
    path: '/onboarding',
    element: <SuspenseWrapper><OnboardingPage /></SuspenseWrapper>,
  },
  {
    path: '/invite/:token',
    element: <SuspenseWrapper><StudentInvitePage /></SuspenseWrapper>,
  },
  {
    path: '/trainer',
    element: <ProtectedRoute allowedRole="trainer" />,
    children: [
      {
        element: <TrainerLayout />,
        children: [
          { index: true, element: <Navigate to="/trainer/dashboard" replace /> },
          {
            path: 'dashboard',
            element: <SuspenseWrapper><TrainerDashboardPage /></SuspenseWrapper>,
          },
          {
            path: 'students',
            element: <SuspenseWrapper><TrainerStudentsPage /></SuspenseWrapper>,
          },
          {
            path: 'students/:studentId',
            element: <SuspenseWrapper><StudentDetailPage /></SuspenseWrapper>,
          },
          {
            path: 'routines',
            element: <SuspenseWrapper><TrainerRoutinesPage /></SuspenseWrapper>,
          },
          {
            path: 'routines/new',
            element: <SuspenseWrapper><RoutineBuilderPage /></SuspenseWrapper>,
          },
          {
            path: 'routines/:routineId',
            element: <SuspenseWrapper><RoutineBuilderPage /></SuspenseWrapper>,
          },
          {
            path: 'approvals',
            element: <SuspenseWrapper><TrainerApprovalsPage /></SuspenseWrapper>,
          },
        ],
      },
    ],
  },
  {
    path: '/student',
    element: <ProtectedRoute allowedRole="student" />,
    children: [
      {
        element: <StudentLayout />,
        children: [
          { index: true, element: <Navigate to="/student/home" replace /> },
          {
            path: 'home',
            element: <SuspenseWrapper><StudentHomePage /></SuspenseWrapper>,
          },
          {
            path: 'routine',
            element: <SuspenseWrapper><StudentRoutinePage /></SuspenseWrapper>,
          },
          {
            path: 'routine/:dayId',
            element: <SuspenseWrapper><RoutineDayPage /></SuspenseWrapper>,
          },
          {
            path: 'log/:dayId',
            element: <SuspenseWrapper><LogTrainingPage /></SuspenseWrapper>,
          },
          {
            path: 'progress',
            element: <SuspenseWrapper><StudentProgressPage /></SuspenseWrapper>,
          },
        ],
      },
    ],
  },
])
