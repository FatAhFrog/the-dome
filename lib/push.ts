import { createClient } from '@/lib/supabase/client'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export async function subscribeToPush(): Promise<boolean> {
  console.log('1. Starting subscribeToPush')

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('2. Push not supported in this browser')
    return false
  }

  const permission = await Notification.requestPermission()
  console.log('3. Permission result:', permission)
  if (permission !== 'granted') return false

  const registration = await navigator.serviceWorker.register('/sw.js')
  console.log('4. Service worker registered:', registration)
  await navigator.serviceWorker.ready
  console.log('5. Service worker ready')

  let subscription
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
    console.log('6. Push subscription created:', subscription)
  } catch (err) {
    console.error('6-ERROR. pushManager.subscribe failed:', err)
    return false
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  console.log('7. Current user:', user?.id)
  if (!user) return false

  const subJson = subscription.toJSON()
  console.log('8. Subscription JSON:', subJson)

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: subJson.endpoint!,
      p256dh: subJson.keys!.p256dh,
      auth: subJson.keys!.auth,
    },
    { onConflict: 'endpoint' }
  )

  console.log('9. Supabase upsert error:', error)

  return !error
}

export async function getPushPermissionState(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}