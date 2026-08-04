export type PushSubscriptionRow = {
  id: string
  user_id: string
  org_id: string | null
  endpoint: string
  p256dh: string
  auth_key: string
  created_at: string
}
