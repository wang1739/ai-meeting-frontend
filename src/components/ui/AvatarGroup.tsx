import React from 'react'
import { cn } from '@/lib/utils'
import Avatar, { type AvatarSize } from './Avatar'

export interface AvatarGroupUser {
  name: string
  src?: string
}

export interface AvatarGroupProps {
  users: AvatarGroupUser[]
  max?: number
  size?: AvatarSize
  className?: string
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ users, max = 3, size = 'md', className }, ref) => {
    const visibleUsers = users.slice(0, max)
    const overflowCount = users.length - max

    return (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
      >
        <div className="flex -space-x-2">
          {visibleUsers.map((user, index) => (
            <div
              key={`${user.name}-${index}`}
              className="relative"
              style={{ zIndex: visibleUsers.length - index }}
            >
              <Avatar
                name={user.name}
                src={user.src}
                size={size}
              />
            </div>
          ))}
          {overflowCount > 0 && (
            <div
              className="relative z-0"
              style={{ zIndex: 0 }}
            >
              <div
                className={cn(
                  'inline-flex items-center justify-center rounded-full border-2 border-white dark:border-dark-card bg-[var(--text-muted)] text-white font-semibold leading-none',
                  size === 'sm' && 'h-7 w-7 text-[10px]',
                  size === 'md' && 'h-9 w-9 text-xs',
                  size === 'lg' && 'h-11 w-11 text-sm',
                )}
              >
                +{overflowCount}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },
)

AvatarGroup.displayName = 'AvatarGroup'

export default AvatarGroup