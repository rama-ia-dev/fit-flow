import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  BrainCircuit,
  Settings,
  UtensilsCrossed,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/trainer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trainer/students', icon: Users, label: 'Alumnos' },
  { to: '/trainer/routines', icon: Dumbbell, label: 'Rutinas' },
  { to: '/trainer/approvals', icon: BrainCircuit, label: 'Aprobaciones IA', disabled: true },
  { to: '/trainer/ai-config', icon: Settings, label: 'Configuración IA', disabled: true },
  { to: '/trainer/recipes', icon: UtensilsCrossed, label: 'Recetas', disabled: true },
  { to: '/trainer/subscription', icon: CreditCard, label: 'Suscripción', disabled: true },
]

export function TrainerSidebar() {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar-background">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Dumbbell className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold text-primary">FitFlow</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.disabled ? '#' : item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive && !item.disabled
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent',
                item.disabled && 'pointer-events-none opacity-40'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}
