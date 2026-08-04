import { supabase } from '@/shared/lib/supabase'
import type { Household, HouseholdFormData } from './types'

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

// 世帯一覧取得
export async function fetchHouseholds(): Promise<Household[]> {
  const { data } = await supabase
    .from('households')
    .select('*')
    .order('household_no', { ascending: true })
  return data || []
}

// 世帯追加
export async function createHousehold(form: HouseholdFormData) {
  const org_id = await getCurrentOrgId()
  const { error } = await supabase.from('households').insert({
    household_no: form.household_no,
    name: form.name,
    address: form.address,
    email: form.email || null,
    phone: form.phone || null,
    org_id,
  })
  return { error }
}

// 世帯更新
export async function updateHousehold(id: string, form: HouseholdFormData) {
  const { error } = await supabase.from('households').update({
    household_no: form.household_no,
    name: form.name,
    address: form.address,
    email: form.email || null,
    phone: form.phone || null,
  }).eq('id', id)
  return { error }
}

// 世帯削除
export async function deleteHousehold(id: string) {
  const { error } = await supabase.from('households').delete().eq('id', id)
  return { error }
}

// 招待メール送信
export async function inviteHousehold(email: string) {
  const { error } = await supabase.auth.admin.inviteUserByEmail(email)
  return { error }
}