import { supabase } from '@/shared/lib/supabase'
import type { PushSubscriptionRow } from './types'

// ログイン中ユーザーのorg_idを取得
async function getCurrentOrgId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', session.user.id)
    .single()
  return data?.org_id ?? null
}

// VAPID公開鍵（Base64URL）をpushManager.subscribeが要求するUint8Arrayに変換
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// このブラウザがWeb Pushに対応しているか
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// ログイン中ユーザーの購読レコードを取得（このブラウザの購読とは限らない）
export async function fetchMyPushSubscription(): Promise<PushSubscriptionRow | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle()
  return data ?? null
}

// 通知許可を求め、購読情報をpush_subscriptionsに保存する
export async function subscribeToPush(): Promise<{ error: string | null }> {
  if (!isPushSupported()) {
    return { error: 'このブラウザはプッシュ通知に対応していません' }
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    return { error: '通知機能が設定されていません' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { error: '通知が許可されませんでした' }
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: 'ログインしてください' }
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    const subJson = subscription.toJSON()
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return { error: '購読情報の取得に失敗しました' }
    }

    const org_id = await getCurrentOrgId()

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: session.user.id,
        org_id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth_key: subJson.keys.auth,
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      return { error: '購読情報の保存に失敗しました' }
    }
    return { error: null }
  } catch {
    return { error: '通知の購読処理に失敗しました' }
  }
}
