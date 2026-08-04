'use client'

import { useEffect, useState } from 'react'
import { isPushSupported, fetchMyPushSubscription, subscribeToPush } from '@/features/notifications'

export function NotificationToggle() {
  const [ready, setReady] = useState(false)
  const [supported, setSupported] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      if (!isPushSupported()) {
        setSupported(false)
        setReady(true)
        return
      }
      const existing = await fetchMyPushSubscription()
      setSubscribed(!!existing && Notification.permission === 'granted')
      setReady(true)
    }
    init()
  }, [])

  const handleClick = async () => {
    setLoading(true)
    setError('')
    const { error } = await subscribeToPush()
    if (error) setError(error)
    else setSubscribed(true)
    setLoading(false)
  }

  if (!ready) return null

  if (!supported) {
    return (
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
        通知はこのブラウザで利用できません
      </span>
    )
  }

  if (subscribed) {
    return (
      <span style={{ fontSize: '13px', color: '#B5D4F4' }}>
        🔔 通知はオンです
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          color: '#fff',
          fontSize: '13px',
          padding: '8px 14px',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '設定中...' : '🔔 通知を受け取る'}
      </button>
      {error && <span style={{ fontSize: '11px', color: '#FFD6D6' }}>{error}</span>}
    </div>
  )
}
