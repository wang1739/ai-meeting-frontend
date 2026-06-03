import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  path: string
  label: string
  icon: React.ElementType
}

const tabs: TabItem[] = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/meetings', label: '会议', icon: CalendarCheck },
  { path: '/search', label: '搜索', icon: Search },
  { path: '/settings', label: '设置', icon: Settings },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string): boolean => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t',
        'bg-[var(--bg-card)] border-[var(--border-color)] lg:hidden',
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = isActive(tab.path)

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}