'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import {
  fetchNoticeById, fetchMyConfirmation, confirmNotice,
  answerRsvp, deleteNotice,
} from '@/features/notices'
import type { Notice, RsvpStatus } from '@/features/notices'
import './print.css'

export default function NoticeDetailPage() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [rsvp, setRsvp] = useState<RsvpStatus | null>(null)
  const [rsvping, setRsvping] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role === 'admin' || profile?.role === 'super_admin') setIsAdmin(true)

      const data = await fetchNoticeById(params.id as string)
      setNotice(data)

      if (data?.type === 'circular') {
        const conf = await fetchMyConfirmation(params.id as string, session.user.id)
        if (conf) { setConfirmed(true); setRsvp(conf.rsvp || null) }
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleConfirm = async () => {
    if (!userId || !notice) return
    setConfirming(true)
    await confirmNotice(notice.id, userId)
    setConfirmed(true)
    setConfirming(false)
  }

  const handleRsvp = async (answer: RsvpStatus) => {
    if (!userId || !notice) return
    setRsvping(true)
    await answerRsvp(notice.id, userId, answer, confirmed)
    if (!confirmed) setConfirmed(true)
    setRsvp(answer)
    setRsvping(false)
  }

  const handleDelete = async () => {
    if (!notice) return
    const ok = window.confirm('この投稿を削除しますか？\nこの操作は取り消せません。')
    if (!ok) return
    setDeleting(true)
    await deleteNotice(notice.id)
    router.push(`/dashboard?tab=${notice.type}`)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const getImages = (n: Notice) => {
    if (n.image_urls?.length > 0) return n.image_urls
    if (n.image_url) return [n.image_url]
    return []
  }

  const rsvpLabel = (r: RsvpStatus | null) => {
    if (r === 'attending') return '出席'
    if (r === 'absent') return '欠席'
    if (r === 'undecided') return '未定'
    return ''
  }

  const isDeadlinePassed = (deadline: string | null) =>
    deadline ? new Date(deadline) < new Date(new Date().toDateString()) : false

  if (loading) return <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>読み込み中...</div>
  if (!notice) return <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>見つかりません</div>

  const images = getImages(notice)
  const deadlinePassed = isDeadlinePassed(notice.rsvp_deadline)
  const backBtn = { background: '#f5f5f5', border: '1px solid #ddd', color: '#555', fontSize: '14px', fontWeight: '500' as const, padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' as const }

  return (
    <div style={{ minHeight: '100%' }}>

      {/* サブヘッダー */}
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '0.5px solid #e0e0e0' }}>
        <button onClick={() => router.push(`/dashboard?tab=${notice.type}`)} style={backBtn}>
          ← {notice.type === 'circular' ? '回覧板' : 'お知らせ'}一覧
        </button>
        <div style={{ flex: 1 }} />
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {notice.requires_rsvp && (
              <button onClick={() => router.push(`/dashboard/notices/${notice.id}/rsvp`)} style={{ background: '#E6F1FB', border: 'none', color: '#185FA5', fontSize: '13px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                📊 集計
              </button>
            )}
            <button onClick={() => router.push(`/dashboard/notices/${notice.id}/edit`)} style={{ background: '#f5f5f5', border: 'none', color: '#555', fontSize: '13px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              ✏️ 編集
            </button>
            <button onClick={handleDelete} disabled={deleting} style={{ background: '#FCEBEB', border: 'none', color: '#A32D2D', fontSize: '13px', padding: '6px 12px', borderRadius: '6px', cursor: deleting ? 'not-allowed' : 'pointer' }}>
              🗑️ 削除
            </button>
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto', background: '#fff', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ display: 'inline-block', background: notice.type === 'circular' ? '#EAF3DE' : '#E6F1FB', color: notice.type === 'circular' ? '#3B6D11' : '#0C447C', fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px', marginBottom: '12px' }}>
          {notice.type === 'circular' ? '回覧板' : 'お知らせ'}
        </div>
        <div style={{ fontSize: '20px', fontWeight: '500', marginBottom: '8px' }}>{notice.title}</div>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px', paddingBottom: '16px', borderBottom: '0.5px solid #e0e0e0' }}>
          {formatDate(notice.created_at)}　町内会事務局
        </div>

        {images.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '8px' }}>
                <img src={url} alt="" style={{ width: '100%', borderRadius: '8px', border: '0.5px solid #ddd' }} />
                {images.length > 1 && <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>{i + 1}/{images.length}枚</div>}
              </div>
            ))}
          </div>
        )}

        {notice.content && <div style={{ fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '32px' }}>{notice.content}</div>}

        {/* 出欠回答 */}
        {notice.type === 'circular' && notice.requires_rsvp && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: '500' }}>🙋 出欠を回答してください</div>
              {notice.rsvp_deadline && (
                <div style={{ fontSize: '12px', color: deadlinePassed ? '#A32D2D' : '#888' }}>
                  {deadlinePassed ? '⚠️ 期限終了' : `期限：${formatDate(notice.rsvp_deadline)}`}
                </div>
              )}
            </div>
            {deadlinePassed ? (
              <div style={{ background: '#f5f5f5', color: '#888', padding: '14px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>
                回答期限が終了しました{rsvp && `（あなたの回答：${rsvpLabel(rsvp)}）`}
              </div>
            ) : (
              <>
                {rsvp && <div style={{ background: '#E6F1FB', color: '#0C447C', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '10px' }}>現在の回答：<strong>{rsvpLabel(rsvp)}</strong>（変更可能）</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['attending', 'absent', 'undecided'] as const).map((answer) => (
                    <button key={answer} onClick={() => handleRsvp(answer)} disabled={rsvping}
                      style={{ flex: 1, padding: '12px 4px', fontSize: '14px', fontWeight: '500', background: rsvp === answer ? (answer === 'attending' ? '#3B6D11' : answer === 'absent' ? '#A32D2D' : '#185FA5') : '#f5f5f5', color: rsvp === answer ? '#fff' : '#555', border: '1.5px solid', borderColor: rsvp === answer ? 'transparent' : '#ddd', borderRadius: '8px', cursor: rsvping ? 'not-allowed' : 'pointer' }}>
                      {answer === 'attending' ? '✅ 出席' : answer === 'absent' ? '❌ 欠席' : '🤔 未定'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 確認ボタン */}
        {notice.type === 'circular' && notice.requires_confirmation && !notice.requires_rsvp && (
          <div style={{ marginBottom: '16px' }}>
            {confirmed ? (
              <div style={{ background: '#EAF3DE', color: '#3B6D11', padding: '16px', borderRadius: '8px', fontSize: '16px', fontWeight: '500', textAlign: 'center' }}>✅ 確認済みです</div>
            ) : (
              <button onClick={handleConfirm} disabled={confirming} style={{ width: '100%', padding: '16px', fontSize: '17px', fontWeight: '500', background: confirming ? '#888' : '#3B6D11', color: '#fff', border: 'none', borderRadius: '8px', cursor: confirming ? 'not-allowed' : 'pointer' }}>
                {confirming ? '送信中...' : '✅ 確認しました'}
              </button>
            )}
          </div>
        )}

        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', fontSize: '16px', fontWeight: '500', background: '#E6F1FB', color: '#0C447C', border: '1px solid #B5D4F4', borderRadius: '8px', cursor: 'pointer' }}>
          🖨️ 印刷用PDFをダウンロード
        </button>
      </div>
    </div>
  )
}
