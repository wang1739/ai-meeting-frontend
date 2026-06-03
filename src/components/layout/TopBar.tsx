import { useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, Plus, Bell, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

interface BreadcrumbItem {
  label: string
  href?: string
}

const routeLabelMap: Record<string, string> = {
  '/': '仪表盘',
  '/meetings': '所有会议',
  '/meetings/new': '创建会议',
  '/search': '搜索',
  '/settings': '设置',
}

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Meeting room pages show no TopBar — this function won't be called for them
  if (pathname === '/') {
    return [{ label: '仪表盘' }]
  }

  const segments = pathname.split('/').filter(Boolean)
  const crumbs: BreadcrumbItem[] = [{ label: '仪表盘', href: '/' }]

  let accumulated = ''
  for (const segment of segments) {
    accumulated += `/${segment}`
    const label = routeLabelMap[accumulated]
    if (label) {
      crumbs.push({ label })
    } else {
      // Unknown route segment — try to make a readable label
      crumbs.push({ label: segment.charAt(0).toUpperCase() + segment.slice(1) })
    }
  }

  return crumbs
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 items-center justify-between border-b px-4',
        'bg-[var(--bg-card)]/80 backdrop-blur-lg border-[var(--border-color)]',
      )}
    >
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Hamburger — visible on mobile/tablet */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)] lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1

            if (index > 0) {
              return (
                <span key={index} className="flex items-center gap-1.5">
                  <ChevronRight size={14} className="text-[var(--text-muted)]" />
                  {isLast || !crumb.href ? (
                    <span className="font-medium text-[var(--text-primary)]">{crumb.label}</span>
                  ) : (
                    <Link
                      to={crumb.href}
                      className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              )
            }

            // First item (仪表盘)
            if (isLast) {
              return (
                <span key={index} className="font-medium text-[var(--text-primary)]">
                  {crumb.label}
                </span>
              )
            }
            return (
              <Link
                key={index}
                to={crumb.href!}
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {crumb.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* New meeting button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/meetings/new')}
          className="gradient-btn flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">新建会议</span>
        </motion.button>

        {/* Notification bell */}
        <button
          className={cn(
            'relative flex items-center justify-center rounded-lg p-2 transition-colors',
            'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]',
          )}
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
        </button>

        {/* User avatar */}
        <button
          className={cn(
            'flex items-center justify-center rounded-lg p-1 transition-colors',
            'hover:bg-[var(--border-color)]/40',
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] text-xs font-medium text-white">
            <User size={14} />
          </div>
        </button>
      </div>
    </header>
  )
}