import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarCheck,
  Search,
  User,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/meetings', label: '所有会议', icon: CalendarCheck },
]

const isActiveRoute = (pathname: string, itemPath: string): boolean => {
  if (itemPath === '/') return pathname === '/'
  return pathname.startsWith(itemPath)
}

// Simplified — in real app this would come from a store/context
const hasActiveMeeting = false

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  const [isTablet, setIsTablet] = useState(false)
  const [tabletHovered, setTabletHovered] = useState(false)
  const [teamMenuOpen, setTeamMenuOpen] = useState(false)

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    checkTablet()
    window.addEventListener('resize', checkTablet)
    return () => window.removeEventListener('resize', checkTablet)
  }, [])

  // On tablet, the sidebar is always collapsed visually; hover temporarily expands
  const effectivelyCollapsed = isTablet ? !tabletHovered : sidebarCollapsed
  const sidebarWidth = effectivelyCollapsed ? 64 : 240

  const handleSearchClick = () => {
    navigate('/search')
  }

  return (
    <>
      {/* Tablet overlay */}
      <AnimatePresence>
        {isTablet && tabletHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black"
            onClick={() => setTabletHovered(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onMouseEnter={() => isTablet && setTabletHovered(true)}
        onMouseLeave={() => isTablet && setTabletHovered(false)}
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col border-r bg-[var(--bg-card)]',
          'overflow-hidden border-[var(--border-color)]',
        )}
      >
        {/* Logo area */}
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--border-color)] px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] text-sm font-bold text-white">
              AI
            </div>
            <motion.span
              animate={{ opacity: effectivelyCollapsed ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              className="whitespace-nowrap text-base font-semibold text-[var(--text-primary)]"
            >
              AI 会议助手
            </motion.span>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-3 pt-3">
          <button
            onClick={handleSearchClick}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
              'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--text-secondary)]',
            )}
          >
            <Search size={16} className="shrink-0" />
            <motion.span
              animate={{ opacity: effectivelyCollapsed ? 0 : 1, width: effectivelyCollapsed ? 0 : 'auto' }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between overflow-hidden whitespace-nowrap"
            >
              <span>搜索会议...</span>
              <kbd className="ml-8 rounded border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                ⌘K
              </kbd>
            </motion.span>
          </button>
        </div>

        {/* Main navigation */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActiveRoute(location.pathname, item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]',
                )}
              >
                <Icon size={18} className="shrink-0" />
                <motion.span
                  animate={{ opacity: effectivelyCollapsed ? 0 : 1 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              </Link>
            )
          })}
        </nav>

        {/* Active meeting indicator */}
        {hasActiveMeeting && (
          <div className="px-3 pb-2">
            <Link
              to="/meeting/active"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'ai-card text-[var(--color-primary)]',
              )}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
              </span>
              <motion.span
                animate={{ opacity: effectivelyCollapsed ? 0 : 1 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                返回会议
              </motion.span>
            </Link>
          </div>
        )}

        {/* Bottom actions */}
        <div className="mt-auto border-t border-[var(--border-color)] p-3">
          {/* Team switch */}
          <button
            onClick={() => setTeamMenuOpen(!teamMenuOpen)}
            className={cn(
              'mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]',
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
              T
            </div>
            <motion.div
              animate={{ opacity: effectivelyCollapsed ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap"
            >
              <span>我的团队</span>
              <ChevronDown size={14} />
            </motion.div>
          </button>

          {/* User avatar + name */}
          <Link
            to="/settings"
            className={cn(
              'mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]',
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-medium text-[var(--color-primary)]">
              <User size={14} />
            </div>
            <motion.span
              animate={{ opacity: effectivelyCollapsed ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              className="whitespace-nowrap"
            >
              用户名
            </motion.span>
          </Link>

          {/* Collapse toggle (desktop only) */}
          <div className="hidden lg:block">
            <button
              onClick={toggleSidebar}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                'text-[var(--text-muted)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-secondary)]',
              )}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={18} className="shrink-0" />
              ) : (
                <PanelLeftClose size={18} className="shrink-0" />
              )}
              <motion.span
                animate={{ opacity: effectivelyCollapsed ? 0 : 1 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                收起侧栏
              </motion.span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}