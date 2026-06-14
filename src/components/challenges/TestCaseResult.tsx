import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TestCaseResult } from '@/types'

interface TestCaseResultProps {
  result: TestCaseResult
  index: number
}

export function TestCaseResultRow({ result, index }: TestCaseResultProps) {
  return (
    <div
      className={cn(
        'border rounded-lg px-4 py-3 text-sm transition-colors',
        result.passed
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-red-500/30 bg-red-500/5'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {result.passed
          ? <CheckCircle size={14} className="text-green-400 shrink-0" />
          : <XCircle size={14} className="text-red-400 shrink-0" />}
        <span className={result.passed ? 'text-green-300 font-medium' : 'text-red-300 font-medium'}>
          Test {index + 1}: {result.testCase.description}
        </span>
      </div>

      {!result.passed && (
        <div className="mt-2 pl-5 flex flex-col gap-1 font-mono text-xs">
          {result.error ? (
            <span className="text-red-400">Error: {result.error}</span>
          ) : (
            <>
              <span className="text-surface-muted">
                Expected: <span className="text-white bg-surface-border px-1 rounded">{result.testCase.expected_output}</span>
              </span>
              <span className="text-surface-muted">
                Got: <span className="text-red-300 bg-red-500/10 px-1 rounded">{result.actualOutput || 'undefined'}</span>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
