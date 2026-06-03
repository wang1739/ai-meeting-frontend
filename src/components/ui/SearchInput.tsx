import React from 'react'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, placeholder = 'Search...', className, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'h-10 w-full rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-card)] py-2 pl-10 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'transition-all duration-150',
            'focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            'dark:focus:border-primary/40',
            className,
          )}
          {...props}
        />
        {value && (
          <button
            onClick={() => {
              onChange({
                target: { value: '' },
              } as React.ChangeEvent<HTMLInputElement>)
              onClear?.()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  },
)

SearchInput.displayName = 'SearchInput'

export default SearchInput