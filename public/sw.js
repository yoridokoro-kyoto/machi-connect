// 軽量Service Worker
// Web Push通知の受信と、通知クリック時のページ遷移のみを扱う。
// オフラインキャッシュ等は行わない（next-pwa等のライブラリは使用しない）。
// プッシュ購読処理（VAPID等）は別フェーズで実装する。

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
