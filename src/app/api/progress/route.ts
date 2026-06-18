import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    const supabase = createServerClient()

    const body = await req.json() as { type: 'lesson' | 'challenge'; id: string }
    const { type, id } = body

    console.log('Progress API called:', { userId, type, id })

    // Auto-create user if not exists (fallback for missing webhook)
    const { error: upsertError } = await supabase.from('users').upsert({
      id: userId,
      email: user?.emailAddresses?.[0]?.emailAddress ?? '',
      username: user?.username ?? null,
      avatar_url: user?.imageUrl ?? null,
    }, { onConflict: 'id', ignoreDuplicates: true })

    console.log('User upsert:', upsertError)

    if (!type || !id) {
      console.error('Validation failed: missing type or id')
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
    }

    if (type === 'lesson') {
      const { error: progressError } = await supabase.from('user_progress').upsert(
        { user_id: userId, lesson_id: id, challenge_id: null, type: 'lesson' },
        { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
      )
      console.log('Progress upsert result (lesson):', { error: progressError })
      if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    if (type === 'challenge') {
      const { error: progressError } = await supabase.from('user_progress').upsert(
        { user_id: userId, challenge_id: id, lesson_id: null, type: 'challenge' },
        { onConflict: 'user_id,challenge_id', ignoreDuplicates: true }
      )
      console.log('Progress upsert result (challenge):', { error: progressError })
      if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unhandled error in progress API:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
