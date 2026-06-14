import type { TestCase, TestCaseResult } from '@/types'

export function runCode(userCode: string, testCases: TestCase[]): TestCaseResult[] {
  return testCases.map((tc) => {
    try {
      // Extraer la función "solution" del código del usuario
      const wrappedCode = `${userCode}\nreturn solution;`
      // eslint-disable-next-line no-new-func
      const fn = new Function(wrappedCode)
      const solutionFn = fn()

      if (typeof solutionFn !== 'function') {
        return {
          testCase: tc,
          passed: false,
          actualOutput: 'undefined',
          error: 'Your code must define a function named "solution".',
        }
      }

      // Parsear argumentos del function_call: "solution(arg1, arg2)"
      const argsMatch = tc.function_call.match(/^solution\((.*)\)$/)
      const argsString = argsMatch?.[1]?.trim() ?? ''

      // eslint-disable-next-line no-new-func
      const args: unknown[] = argsString.length > 0
        ? (new Function(`return [${argsString}]`))()
        : []

      const result = solutionFn(...args)
      const actualOutput = JSON.stringify(result)
      const passed = actualOutput === tc.expected_output

      return { testCase: tc, passed, actualOutput, error: null }
    } catch (err) {
      return {
        testCase: tc,
        passed: false,
        actualOutput: '',
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  })
}
