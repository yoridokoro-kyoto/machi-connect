const STORAGE_PREFIX = 'mc_onboarding_'

// オンボーディングを完了/スキップ済みかどうか（端末＋アカウント単位）
export function hasSeenOnboarding(userId: string): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(STORAGE_PREFIX + userId) === 'done'
}

export function markOnboardingSeen(userId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_PREFIX + userId, 'done')
}
