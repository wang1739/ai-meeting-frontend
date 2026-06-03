import React from 'react'
import { cn } from '@/lib/utils'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  name: string
  size?: AvatarSize
}

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'h-7 w-7', text: 'text-[10px]' },
  md: { container: 'h-9 w-9', text: 'text-xs' },
  lg: { container: 'h-11 w-11', text: 'text-sm' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const avatarColors = [
  'bg-primary/20 text-primary',
  'bg-[#EC4899]/20 text-[#EC4899]',
  'bg-[#F59E0B]/20 text-[#F59E0B]',
  'bg-[#10B981]/20 text-[#10B981]',
  'bg-[#3B82F6]/20 text-[#3B82F6]',
  'bg-[#8B5CF6]/20 text-[#8B5CF6]',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, name, size = 'md', className, ...props }, ref) => {
    const dimensions = sizeStyles[size]

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-dark-card',
          dimensions.container,
          !src && getAvatarColor(name),
          className,
        )}
        title={name}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full rounded-full object-cover"
            onError={(e) => {
              // Hide image on error, initials will show via CSS
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <span className={cn('font-semibold leading-none', dimensions.text)}>
            {getInitials(name)}
          </span>
        )}
      </div>
    )
  },
)

Avatar.displayName = 'Avatar'

export default Avatar