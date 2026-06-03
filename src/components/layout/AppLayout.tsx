import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

/**
 * Returns true when the current route is inside a real-time meeting room
 * (e.g. /meeting/123 or /meeting/abc).
 */
function isMeetingRoom(pathname: string): boolean {
  return /^\/meeting\/[^/]+(\/.*)?$/.test(pathname)
}

export default function AppLayout() {
  const location = useLocation()
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const inMeeting = isMeetingRoom(location.pathname)

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar — always rendered, even in meeting room */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-200',
          // Offset for sidebar width
          'ml-[64px] lg:ml-[64px]',
          !inMeeting && !sidebarCollapsed && 'lg:ml-[240px]',
        )}
      >
        {/* TopBar — hidden in meeting rooms */}
        {!inMeeting && <TopBar />}

        {/* Page content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            inMeeting ? '' : 'p-4 md:p-6',
            // Extra bottom padding on mobile for BottomNav
            'pb-20 lg:pb-6',
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* BottomNav — hidden in meeting rooms, only visible on mobile */}
      {!inMeeting && <BottomNav />}
    </div>
  )
}