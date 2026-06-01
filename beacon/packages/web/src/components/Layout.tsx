import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, List, TrendingUp, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { to: '/', label: '概览', icon: BarChart3, end: true },
  { to: '/events', label: '事件列表', icon: List },
  { to: '/trend', label: '趋势分析', icon: TrendingUp },
]

export default function Layout() {
  const [dark, setDark] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div className="flex min-h-screen">
      <aside className={cn('border-r bg-card fixed inset-y-0 left-0 flex flex-col transition-all duration-200 z-10', collapsed ? 'w-16' : 'w-56')}>
        <div className="flex items-center justify-between px-4 py-5 border-b">
          {!collapsed && <h1 className="text-lg font-semibold">Analytics</h1>}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className={cn(collapsed && 'mx-auto')}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="flex-1 py-2 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) =>
              cn('flex items-center gap-3 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                collapsed ? 'justify-center px-2' : 'px-5',
                isActive && 'bg-accent text-accent-foreground font-medium')
            } title={collapsed ? label : undefined}>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
        <div className={cn('p-3 border-t', collapsed && 'flex justify-center')}>
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="h-4 w-4 hidden dark:block" />
          </Button>
        </div>
      </aside>
      <main className={cn('flex-1 p-6 transition-all duration-200 overflow-x-auto', collapsed ? 'ml-16' : 'ml-56')}>
        <Outlet />
      </main>
    </div>
  )
}
