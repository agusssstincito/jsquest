'use client'

import { useState } from 'react'
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'

interface HintPanelProps {
  hints: string[]
}

export function HintPanel({ hints: initialHints }: HintPanelProps) {
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(0)

  const hints = Array.isArray(initialHints)
    ? initialHints
    : JSON.parse(initialHints as unknown as string)

  if (!hints || hints.length === 0) return null

  return (
    <div className="border border-surface-border rounded-lg overflow-hidden bg-surface-card/50 mt-4 h-fit">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-surface-muted hover:text-white transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-yellow-400" />
          <span>Hints ({hints.length})</span>
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="border-t border-surface-border px-4 py-3 flex flex-col gap-3 bg-surface">
          {hints.slice(0, revealed + 1).map((hint: string, i: number) => (
            <div key={i} className="text-sm text-surface-muted leading-relaxed">
              <span className="text-yellow-400 font-medium">Hint {i + 1}:</span>{' '}
              {hint}
            </div>
          ))}

          {revealed < hints.length - 1 && (
            <button
              onClick={() => setRevealed(r => r + 1)}
              className="text-xs text-brand-500 hover:text-brand-400 text-left transition-colors pt-1 cursor-pointer font-medium"
            >
              Show next hint →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
