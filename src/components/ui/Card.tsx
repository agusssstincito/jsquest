import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
}

export function Card({ children, className, hoverable = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-card border border-surface-border rounded-lg p-6',
        hoverable && 'transition-all duration-200 hover:border-brand-500 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
