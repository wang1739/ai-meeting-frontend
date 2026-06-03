import React from 'react'
import { cn } from '@/lib/utils'

export type CardVariant = 'default' | 'hover' | 'glow'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[var(--bg-card)] shadow-custom-sm',
  hover:
    'bg-[var(--bg-card)] shadow-custom-sm hover:shadow-custom-md transition-shadow duration-200',
  glow:
    'bg-[var(--bg-card)] shadow-custom-glow border border-primary/10',
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md border border-[var(--border-color)] p-5',
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

export default Card