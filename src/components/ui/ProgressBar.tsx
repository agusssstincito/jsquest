interface ProgressBarProps {
  value: number  // 0-100
  className?: string
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`w-full bg-surface-border rounded-full h-1.5 ${className ?? ''}`}>
      <div
        className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
