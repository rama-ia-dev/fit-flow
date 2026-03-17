import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, ClipboardEdit, TrendingUp, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/student/home', icon: Home, label: 'Inicio' },
  { to: '/student/routine', icon: Dumbbell, label: 'Rutina' },
  { to: '/student/log', icon: ClipboardEdit, label: 'Registrar' },
  { to: '/student/progress', icon: TrendingUp, label: 'Progreso', disabled: true },
  { to: '/student/recipes', icon: UtensilsCrossed, label: 'Recetas', disabled: true },
]

export function StudentBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.disabled ? '#' : item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2.5 text-xs font-medium transition-colors',
                isActive && !item.disabled
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
                item.disabled && 'pointer-events-none opacity-40'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
