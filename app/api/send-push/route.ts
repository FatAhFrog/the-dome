import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Service-role client — bypasses RLS, only used server-side, never exposed to browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.json()
  const newMessage = body.record

  if (!newMessage) {
    return NextResponse.json({ error: 'No record in payload' }, { status: 400 })
  }

  const senderId = newMessage.user_id
  const content = newMessage.content as string

  const { data: sender } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('id', senderId)
    .single()

  const senderName = sender?.username || 'Someone'

  const { data: subscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .neq('user_id', senderId) // don't notify the sender about their own message

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const payload = JSON.stringify({
    title: `${senderName} in #general`,
    body: content,
    url: '/apps/chat',
  })

  let sent = 0
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
      sent++
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode
      // 410 = subscription expired/invalid, clean it up
      if (statusCode === 410 || statusCode === 404) {
        await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }

  return NextResponse.json({ sent })
}