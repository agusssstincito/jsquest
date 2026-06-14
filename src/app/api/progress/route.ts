import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { type: 'lesson' | 'challenge'; id: string }
  const { type, id } = body

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
  }

  const supabase = createServerClient()

  if (type === 'lesson') {
    const { error } = await supabase.from('user_progress').upsert(
      { user_id: userId, lesson_id: id, challenge_id: null, type: 'lesson' },
      { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (type === 'challenge') {
    const { error } = await supabase.from('user_progress').upsert(
      { user_id: userId, challenge_id: id, lesson_id: null, type: 'challenge' },
      { onConflict: 'user_id,challenge_id', ignoreDuplicates: true }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
