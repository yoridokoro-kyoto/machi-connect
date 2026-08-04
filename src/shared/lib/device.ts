// iOS Safari固有のstandaloneプロパティ（標準のlib.dom.d.tsには含まれない）
type NavigatorWithStandalone = Navigator & { standalone?: boolean }

// ホーム画面に追加済み（standalone表示）かどうかを判定
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as NavigatorWithStandalone
  const iosStandalone = nav.standalone === true
  const mediaStandalone = window.matchMedia('(display-mode: standalone)').matches
  return iosStandalone || mediaStandalone
}

// iOS Safari（Chrome/Firefox/Edge/Opera for iOSは除外）かどうかを判定
// 既知の限界：iPadOSはUser-AgentがMacと偽装される場合があり、その場合は
// この判定でiPadを検出できない。iPhone中心の運用を前提に、今回は対応しない
export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  return isIOS && !isOtherIOSBrowser
}
