'use client'

import { useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

interface MarkCompleteButtonProps {
  lessonId: string
}

export function MarkCompleteButton({ lessonId }: MarkCompleteButtonProps) {
  const { isSignedIn } = useUser()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleComplete() {
    setLoading(true)
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lesson', id: lessonId }),
      })
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="secondary" className="cursor-pointer">Sign in to track progress</Button>
      </SignInButton>
    )
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <CheckCircle size={16} /> Lesson marked as complete
      </div>
    )
  }

  return (
    <Button onClick={handleComplete} loading={loading} variant="success" className="cursor-pointer">
      Mark as complete
    </Button>
  )
}
