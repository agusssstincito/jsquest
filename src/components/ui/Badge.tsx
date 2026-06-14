import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'difficulty'
  difficulty?: Difficulty
  className?: string
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-green-500/10 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  hard: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function Badge({ children, variant = 'default', difficulty, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        variant === 'difficulty' && difficulty
          ? difficultyColors[difficulty]
          : 'bg-surface-card border-surface-border text-surface-muted',
        className
      )}
    >
      {children}
    </span>
  )
}
