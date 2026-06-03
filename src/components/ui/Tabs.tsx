import React from 'react'
import { cn } from '@/lib/utils'

export interface Tab {
  id: string
  label: string
  count?: number
}

export interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex border-b border-[var(--border-color)]', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 text-[var(--text-muted)] dark:bg-slate-800',
                )}
              >
                {tab.count}
              </span>
            )}
            {/* Active indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs