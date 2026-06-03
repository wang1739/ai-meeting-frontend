import React from 'react'
import { cn } from '@/lib/utils'

export type SkeletonVariant = 'text' | 'card' | 'circle'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  card: 'h-32 w-full rounded-md',
  circle: 'h-10 w-10 rounded-full',
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-700',
        variantStyles[variant],
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

export default Skeleton