'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import { runDomCode } from '@/lib/runner/domRunner'
import { Button } from '@/components/ui/Button'
import { Play, PartyPopper, RotateCcw } from 'lucide-react'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DomChallenge, DomAssertion, DomAssertionResult } from '@/types'

interface Props {
  challenge: DomChallenge & { assertions: DomAssertion[] }
  courseSlug: string
}

export function DomChallengeClient({ challenge, courseSlug }: Props) {
  const { isSignedIn } = useUser()
  const [jsCode, setJsCode] = useState(challenge.starter_js)
  const [results, setResults] = useState<DomAssertionResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const [saved, setSaved] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const allPassed = results !== null && results.every(r => r.passed)

  // Reset iframe to original HTML
  function resetIframe() {
    if (!iframeRef.current) return
    iframeRef.current.srcdoc = challenge.html_template
  }

  useEffect(() => {
    resetIframe()
  }, [challenge.html_template])

  async function handleRun() {
    setRunning(true)
    setResults(null)

    // Reset the iframe first, then wait for it to load
    resetIframe()

    await new Promise(resolve => {
      if (!iframeRef.current) return resolve(null)
      iframeRef.current.onload = () => resolve(null)
      setTimeout(resolve, 600) // fallback timeout
    })

    if (!iframeRef.current) { setRunning(false); return }

    const res = await runDomCode(iframeRef.current, jsCode, challenge.assertions)
    setResults(res)
    setRunning(false)

    if (res.every(r => r.passed) && isSignedIn && !saved) {
      setSaved(true)
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'challenge', id: challenge.id }),
      }).catch(console.error)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top row: Preview + HTML */}
      <div className="flex border-b border-surface-border" style={{ height: '45%' }}>
        {/* Preview */}
        <div className="w-1/2 border-r border-surface-border flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 bg-surface-card border-b border-surface-border">
            <span className="text-xs text-surface-muted">View</span>
            <button onClick={() => { resetIframe(); setResults(null); setJsCode(challenge.starter_js) }}
              className="text-xs text-surface-muted hover:text-white flex items-center gap-1 transition-colors">
              <RotateCcw size={11} /> reset
            </button>
          </div>
          <iframe
            ref={iframeRef}
            srcDoc={challenge.html_template}
            className="flex-1 w-full bg-white"
            sandbox="allow-scripts allow-same-origin"
            title="DOM Preview"
          />
        </div>

        {/* HTML viewer (readonly) */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 bg-surface-card border-b border-surface-border">
            <span className="text-xs text-surface-muted">HTML</span>
          </div>
          <div className="flex-1 overflow-auto">
            <CodeMirror
              value={challenge.html_template}
              theme={oneDark}
              extensions={[html()]}
              editable={false}
              basicSetup={{ lineNumbers: true }}
            />
          </div>
        </div>
      </div>

      {/* Bottom: JS Editor */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-3 py-1.5 bg-surface-card border-b border-surface-border flex items-center justify-between">
          <span className="text-xs text-surface-muted">JavaScript</span>
          <Button onClick={handleRun} loading={running} size="sm" className="gap-1 h-6 text-xs px-3">
            <Play size={11} /> Run Code
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={jsCode}
            theme={oneDark}
            extensions={[javascript()]}
            onChange={setJsCode}
            basicSetup={{ lineNumbers: true, tabSize: 2 }}
          />
        </div>

        {/* Results */}
        {results !== null && (
          <div className="border-t border-surface-border px-4 py-3 max-h-[200px] overflow-y-auto flex flex-col gap-2">
            {allPassed && (
              <div className="flex items-center gap-2 text-green-300 text-sm font-medium bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                <PartyPopper size={14} /> All checks passed! Great work.
              </div>
            )}
            {results.map((r, i) => (
              <div key={i} className={cn(
                'flex items-start gap-2 text-sm px-3 py-2 rounded-lg border',
                r.passed ? 'border-green-500/20 bg-green-500/5 text-green-300' : 'border-red-500/20 bg-red-500/5 text-red-300'
              )}>
                {r.passed ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : <XCircle size={14} className="mt-0.5 shrink-0" />}
                <span>{r.assertion.description}{r.error ? ` — ${r.error}` : ''}</span>
              </div>
            ))}
          </div>
        )}

        {results === null && (
          <div className="border-t border-surface-border px-4 py-3 text-center text-surface-muted text-xs">
            Run your code to see the results
          </div>
        )}
      </div>
    </div>
  )
}
