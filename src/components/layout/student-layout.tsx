import { Outlet } from 'react-router-dom'
import { StudentBottomNav } from '@/components/student/bottom-nav'

export function StudentLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 overflow-auto pb-20">
        <div className="mx-auto max-w-lg p-4">
          <Outlet />
        </div>
      </main>
      <StudentBottomNav />
    </div>
  )
}
