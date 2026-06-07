import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, Plus, Bell, User, ChevronRight, Settings, LogOut, Mail, BellOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'

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
      crumbs.push({ label: segment.charAt(0).toUpperCase() + segment.slice(1) })
    }
  }

  return crumbs
}

/* ─── Popover component ─── */
function Popover({
  isOpen,
  onClose,
  anchorRef,
  children,
  className,
}: {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'absolute right-0 top-full mt-2 w-72 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const authUser = useAuthStore((s) => s.userInfo)
  const logout = useAuthStore((s) => s.logout)

  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname])

  // Popover states
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)

  const handleLogout = () => {
    setShowUserMenu(false)
    logout()
    navigate('/login')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 items-center justify-between border-b px-4',
        'bg-[var(--bg-card)]/80 backdrop-blur-lg border-[var(--border-color)]',
      )}
    >
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)] lg:hidden"
        >
          <Menu size={20} />
        </button>

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
        <div className="relative">
          <button
            ref={bellRef}
            onClick={() => {
              setShowNotifications((p) => !p)
              setShowUserMenu(false)
            }}
            className={cn(
              'relative flex items-center justify-center rounded-lg p-2 transition-colors',
              'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]',
            )}
          >
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
          </button>

          <Popover
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            anchorRef={bellRef}
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">通知</h3>
              <div className="mt-3 flex flex-col items-center gap-2 py-8 text-center">
                <BellOff className="h-8 w-8 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">暂无新通知</p>
              </div>
            </div>
          </Popover>
        </div>

        {/* User avatar */}
        <div className="relative">
          <button
            ref={avatarRef}
            onClick={() => {
              setShowUserMenu((p) => !p)
              setShowNotifications(false)
            }}
            className={cn(
              'flex items-center justify-center rounded-lg p-1 transition-colors',
              'hover:bg-[var(--border-color)]/40',
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] text-xs font-medium text-white">
              {authUser?.name?.charAt(0)?.toUpperCase() || <User size={14} />}
            </div>
          </button>

          <Popover
            isOpen={showUserMenu}
            onClose={() => setShowUserMenu(false)}
            anchorRef={avatarRef}
            className="w-64"
          >
            <div className="p-4">
              {/* User info */}
              <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] text-sm font-medium text-white">
                  {authUser?.name?.charAt(0)?.toUpperCase() || <User size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {authUser?.name || '用户'}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-[var(--text-muted)] truncate">
                    <Mail size={10} />
                    {authUser?.email || ''}
                  </p>
                </div>
              </div>

              {/* Menu items */}
              <div className="mt-2 space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/settings')
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]"
                >
                  <Settings size={15} />
                  <span>个人设置</span>
                  <span className="ml-auto text-[11px] text-[var(--text-muted)]">功能开发中</span>
                </button>

                <hr className="border-[var(--border-color)]" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut size={15} />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </Popover>
        </div>
      </div>
    </header>
  )
}
