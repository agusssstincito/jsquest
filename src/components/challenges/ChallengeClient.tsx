'use client'

import { useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { CodeEditor } from './CodeEditor'
import { TestCaseResultRow } from './TestCaseResult'
import { HintPanel } from './HintPanel'
import { Button } from '@/components/ui/Button'
import { runCode } from '@/lib/runner/codeRunner'
import { Play, ArrowRight, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import type { Challenge, TestCase, TestCaseResult } from '@/types'

interface ChallengeClientProps {
  challenge: Challenge & { test_cases: TestCase[] }
  courseSlug: string
  sectionSlug: string
  nextChallengeSlug: string | null
}

export function ChallengeClient({ challenge, courseSlug, sectionSlug, nextChallengeSlug }: ChallengeClientProps) {
  const { isSignedIn } = useUser()
  const [code, setCode] = useState(challenge.starter_code)
  const [results, setResults] = useState<TestCaseResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const [saved, setSaved] = useState(false)

  const allPassed = results !== null && results.every((r) => r.passed)

  async function handleRun() {
    setRunning(true)
    // Delay to simulate execution and show loading state
    await new Promise((r) => setTimeout(r, 300))
    const testResults = runCode(code, challenge.test_cases)
    setResults(testResults)
    setRunning(false)

    // Save progress if all tests pass and user is signed in
    if (testResults.every((r) => r.passed) && isSignedIn && !saved) {
      setSaved(true)
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'challenge', id: challenge.id }),
      }).catch(console.error)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Editor area */}
      <div className="flex-1 overflow-hidden p-4 min-h-[300px]">
        <CodeEditor
          initialCode={code}
          onChange={setCode}
          height="100%"
        />
      </div>

      {/* Control Bar */}
      <div className="px-4 pb-4 flex flex-col gap-3">
        <HintPanel hints={challenge.hints ?? []} />
        
        <Button
          onClick={handleRun}
          loading={running}
          size="lg"
          className="w-full gap-2 cursor-pointer py-3 h-12"
        >
          <Play size={16} />
          Run Code
        </Button>
      </div>

      {/* Results area */}
      {results !== null && (
        <div className="border-t border-surface-border px-4 py-4 overflow-y-auto max-h-[350px] bg-surface/50">
          {/* Success Banner */}
          {allPassed && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-green-300 text-sm font-medium">
                <PartyPopper size={16} className="text-green-400" />
                All tests passed!
              </div>
              <div className="flex items-center gap-2">
                {!isSignedIn && (
                  <SignInButton mode="modal">
                    <button className="text-xs text-brand-500 hover:text-brand-400 font-medium cursor-pointer">
                      Sign in to save progress
                    </button>
                  </SignInButton>
                )}
                {nextChallengeSlug ? (
                  <Link href={`/${sectionSlug}/${courseSlug}/${nextChallengeSlug}`}>
                    <Button size="sm" className="gap-1 cursor-pointer">
                      Next <ArrowRight size={12} />
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/${sectionSlug}/${courseSlug}`}>
                    <Button size="sm" variant="secondary" className="cursor-pointer">
                      Back to course
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Individual Test Results */}
          <div className="flex flex-col gap-2">
            {results.map((result, i) => (
              <TestCaseResultRow key={result.testCase.id} result={result} index={i} />
            ))}
          </div>

          {/* Summary status */}
          <p className="text-[10px] text-surface-muted uppercase tracking-widest mt-3 font-semibold">
            Status: {results.filter((r) => r.passed).length}/{results.length} tests passed
          </p>
        </div>
      )}

      {results === null && (
        <div className="border-t border-surface-border px-4 py-6 text-center text-surface-muted text-xs uppercase tracking-widest font-semibold opacity-50 bg-black/10">
          Run your code to see the results
        </div>
      )}
    </div>
  )
}
