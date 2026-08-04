'use client'

import { useEffect, useState } from 'react'
import { isPushSupported, fetchMyPushSubscription } from '@/features/notifications'

// 通知が「オン」の場合のみ状態表示を行う。
// 未購読時の案内・購読操作はOnboardingWizard/InstallPromptBannerが担う。
export function NotificationToggle() {
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!isPushSupported()) return
      const existing = await fetchMyPushSubscription()
      setSubscribed(!!existing && Notification.permission === 'granted')
    }
    init()
  }, [])

  if (!subscribed) return null

  return (
    <span style={{ fontSize: '13px', color: '#B5D4F4' }}>
      🔔 通知はオンです
    </span>
  )
}
