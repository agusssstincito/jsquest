import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: { type: string; data: { id: string; email_addresses: { email_address: string }[]; username: string | null; image_url: string } }

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as typeof evt
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const supabase = createServerClient()
  const { type, data } = evt

  if (type === 'user.created') {
    const { error } = await supabase.from('users').insert({
      id: data.id,
      email: data.email_addresses[0]?.email_address ?? '',
      username: data.username ?? null,
      avatar_url: data.image_url ?? null,
    })
    if (error) console.error('Error inserting user:', error)
  }

  if (type === 'user.updated') {
    const { error } = await supabase
      .from('users')
      .update({
        email: data.email_addresses[0]?.email_address ?? '',
        username: data.username ?? null,
        avatar_url: data.image_url ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
    if (error) console.error('Error updating user:', error)
  }

  return new Response('OK', { status: 200 })
}
