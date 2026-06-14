'use client'

import type { DomAssertion, DomAssertionResult } from '@/types'

export async function runDomCode(
  iframe: HTMLIFrameElement,
  userJs: string,
  assertions: DomAssertion[]
): Promise<DomAssertionResult[]> {
  return new Promise((resolve) => {
    const doc = iframe.contentDocument
    if (!doc) {
      resolve(assertions.map(a => ({
        assertion: a,
        passed: false,
        error: 'Could not access iframe document'
      })))
      return
    }

    // Remove previous user script if any
    const prev = doc.getElementById('__user_script')
    if (prev) prev.remove()

    // Create and inject the script
    const script = doc.createElement('script')
    script.id = '__user_script'
    script.textContent = userJs

    try {
      doc.body.appendChild(script)
    } catch (e) {
      resolve(assertions.map(a => ({
        assertion: a,
        passed: false,
        error: e instanceof Error ? e.message : 'Script error'
      })))
      return
    }

    // Wait for DOM changes to settle
    setTimeout(() => {
      const results: DomAssertionResult[] = assertions.map((a) => {
        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function('document', 'window', `return !!(${a.assertion})`)
          const passed = fn(doc, iframe.contentWindow) === true
          return { assertion: a, passed, error: null }
        } catch (err) {
          return {
            assertion: a,
            passed: false,
            error: err instanceof Error ? err.message : 'Assertion error'
          }
        }
      })
      resolve(results)
    }, 500)
  })
}
