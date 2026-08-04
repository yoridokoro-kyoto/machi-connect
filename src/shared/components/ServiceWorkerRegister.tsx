'use client'

import { useEffect } from 'react'

// Service Workerを登録するだけのコンポーネント。
// プッシュ購読（VAPID等）は別フェーズで実装する。
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
    }
  }, [])

  return null
}
