import { supabase } from '@/shared/lib/supabase'
import type { Notice, RsvpStatus, RsvpRecord } from './types'

// お知らせ一覧取得
export async function fetchNotices(): Promise<Notice[]> {
  const { data } = await supabase
    .from('notices')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

// お知らせ詳細取得
export async function fetchNoticeById(id: string): Promise<Notice | null> {
  const { data } = await supabase
    .from('notices')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

// お知らせ投稿
export async function createNotice(params: {
  title: string
  content: string
  type: 'notice' | 'circular'
  imageUrls: string[]
  requiresConfirmation: boolean
  requiresRsvp: boolean
  rsvpDeadline: string | null
}) {
  const { error } = await supabase.from('notices').insert({
    title: params.title,
    content: params.content || '',
    image_url: params.imageUrls[0] || null,
    image_urls: params.imageUrls,
    type: params.type,
    organization_id: null,
    requires_confirmation: params.type === 'circular' ? params.requiresConfirmation : false,
    requires_rsvp: params.type === 'circular' ? params.requiresRsvp : false,
    rsvp_deadline: params.type === 'circular' && params.requiresRsvp ? params.rsvpDeadline : null,
  })
  return { error }
}

// お知らせ更新
export async function updateNotice(id: string, params: {
  title: string
  content: string
  type: 'notice' | 'circular'
  requiresConfirmation: boolean
  requiresRsvp: boolean
  rsvpDeadline: string | null
}) {
  const { error } = await supabase.from('notices').update({
    title: params.title,
    content: params.content,
    type: params.type,
    requires_confirmation: params.type === 'circular' ? params.requiresConfirmation : false,
    requires_rsvp: params.type === 'circular' ? params.requiresRsvp : false,
    rsvp_deadline: params.type === 'circular' && params.requiresRsvp ? params.rsvpDeadline : null,
  }).eq('id', id)
  return { error }
}

// お知らせ削除
export async function deleteNotice(id: string) {
  const { error } = await supabase.from('notices').delete().eq('id', id)
  return { error }
}

// 画像アップロード
export async function uploadImage(file: File): Promise<string | null> {
  const fileName = `${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('notices').upload(fileName, file)
  if (error) return null
  const { data } = supabase.storage.from('notices').getPublicUrl(fileName)
  return data.publicUrl
}

// 確認済みID一覧取得
export async function fetchConfirmedIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('circular_confirmations')
    .select('notice_id')
    .eq('user_id', userId)
  return new Set((data || []).map((c: { notice_id: string }) => c.notice_id))
}

// 自分の確認・RSVP状態取得
export async function fetchMyConfirmation(noticeId: string, userId: string) {
  const { data } = await supabase
    .from('circular_confirmations')
    .select('id, rsvp')
    .eq('notice_id', noticeId)
    .eq('user_id', userId)
    .single()
  return data
}

// 確認ボタンを押す
export async function confirmNotice(noticeId: string, userId: string) {
  const { error } = await supabase
    .from('circular_confirmations')
    .insert({ notice_id: noticeId, user_id: userId })
  return { error }
}

// 出欠回答
export async function answerRsvp(noticeId: string, userId: string, rsvp: RsvpStatus, alreadyConfirmed: boolean) {
  if (alreadyConfirmed) {
    await supabase
      .from('circular_confirmations')
      .update({ rsvp })
      .eq('notice_id', noticeId)
      .eq('user_id', userId)
  } else {
    await supabase
      .from('circular_confirmations')
      .insert({ notice_id: noticeId, user_id: userId, rsvp })
  }
}

// RSVP集計取得
export async function fetchRsvpSummary(noticeId: string): Promise<RsvpRecord[]> {
  const [{ data: rsvpData }, { data: profilesData }] = await Promise.all([
    supabase.from('circular_confirmations').select('user_id, rsvp').eq('notice_id', noticeId),
    supabase.from('profiles').select('id, name'),
  ])
  const profileMap = new Map((profilesData || []).map((p: { id: string; name: string }) => [p.id, p.name]))
  return (rsvpData || []).map((r: { user_id: string; rsvp: RsvpStatus | null }) => ({
    user_id: r.user_id,
    rsvp: r.rsvp,
    name: profileMap.get(r.user_id) || '名前未設定',
  }))
}
