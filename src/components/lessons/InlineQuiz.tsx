'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { LessonQuiz } from '@/types'

interface InlineQuizProps {
  quiz: LessonQuiz
  onAnswer?: (correct: boolean) => void
}

export function InlineQuiz({ quiz, onAnswer }: InlineQuizProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const options = Array.isArray(quiz.options)
    ? quiz.options
    : JSON.parse(quiz.options as string)

  const isCorrect = selected === quiz.correct_option_index

  function handleSubmit() {
    if (selected === null) return
    setSubmitted(true)
    onAnswer?.(isCorrect)
  }

  return (
    <div className="bg-surface border border-surface-border rounded-lg p-5 my-4">
      <p className="text-xs text-brand-500 uppercase tracking-wide font-medium mb-3">Quick check</p>
      <p className="text-white font-medium mb-4">{quiz.question}</p>

      <div className="flex flex-col gap-2">
        {options.map((option: string, i: number) => {
          const isSelected = selected === i
          const isCorrectOption = i === quiz.correct_option_index

          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className={cn(
                'text-left px-4 py-3 rounded-lg border text-sm transition-all cursor-pointer',
                !submitted && !isSelected && 'border-surface-border text-surface-muted hover:border-brand-500 hover:text-white',
                !submitted && isSelected && 'border-brand-500 text-white bg-brand-500/10',
                submitted && isSelected && isCorrect && 'border-green-500 bg-green-500/10 text-green-300',
                submitted && isSelected && !isCorrect && 'border-red-500 bg-red-500/10 text-red-300',
                submitted && !isSelected && isCorrectOption && 'border-green-500/50 text-green-400',
                submitted && !isSelected && !isCorrectOption && 'border-surface-border text-surface-muted opacity-50'
              )}
            >
              {option}
            </button>
          )
        })}
      </div>

      {!submitted && (
        <Button
          className="mt-4"
          onClick={handleSubmit}
          disabled={selected === null}
          size="sm"
        >
          Check answer
        </Button>
      )}

      {submitted && (
        <div className={cn(
          'mt-4 flex items-start gap-2 text-sm p-3 rounded-lg',
          isCorrect ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
        )}>
          {isCorrect
            ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
            : <XCircle size={16} className="mt-0.5 shrink-0" />}
          <span>
            {isCorrect ? 'Correct! ' : 'Not quite. '}
            {quiz.explanation}
          </span>
        </div>
      )}
    </div>
  )
}
