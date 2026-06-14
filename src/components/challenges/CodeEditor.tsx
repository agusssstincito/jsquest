'use client'

import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

interface CodeEditorProps {
  initialCode: string
  onChange: (code: string) => void
  height?: string
}

export function CodeEditor({ initialCode, onChange, height = '380px' }: CodeEditorProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-surface-border">
      <div className="bg-[#1e1e1e] px-4 py-2 border-b border-surface-border flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-3 text-xs text-surface-muted font-mono">solution.js</span>
      </div>
      <CodeMirror
        value={initialCode}
        height={height}
        theme={oneDark}
        extensions={[javascript()]}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          bracketMatching: true,
          autocompletion: true,
          indentOnInput: true,
          tabSize: 2,
        }}
      />
    </div>
  )
}
