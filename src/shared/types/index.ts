// ロール定義
export type UserRole = 'super_admin' | 'admin' | 'officer' | 'member'

// ユーザープロフィール
export type Profile = {
  id: string
  org_id: string | null
  role: UserRole
  name: string
  household_id: string | null
  created_at: string
}

// 町内会
export type Organization = {
  id: string
  name: string
  address: string | null
  created_at: string
}

// 機能キー
export type FeatureKey =
  | 'notices'
  | 'households'
  | 'safety'
  | 'survey'
  | 'messaging'
  | 'events'
  | 'line_notify'
  | 'emergency'

// 機能設定
export type OrganizationFeature = {
  id: string
  org_id: string
  feature_key: FeatureKey
  enabled: boolean
}
