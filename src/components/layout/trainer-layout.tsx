import { Outlet } from 'react-router-dom'
import { TrainerSidebar } from '@/components/trainer/sidebar'

export function TrainerLayout() {
  return (
    <div className="flex min-h-screen">
      <TrainerSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
