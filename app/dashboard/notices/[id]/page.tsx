'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import './print.css'

type Notice = {
  id: string
  title: string
  content: string
  type: 'notice' | 'circular'
  image_url: string | null
  image_urls: string[]
  created_at: string
}

export default function NoticeDetailPage() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)
      fetchNotice(session.user.id)
    }
    checkAuth()
  }, [])

  const fetchNotice = async (uid: string) => {
    const { data } = await supabase
      .from('notices')
      .select('*')
      .eq('id', params.id)
      .single()
    setNotice(data)

    if (data?.type === 'circular') {
      const { data: conf } = await supabase
        .from('circular_confirmations')
        .select('id')
        .eq('notice_id', params.id)
        .eq('user_id', uid)
        .single()
      setConfirmed(!!conf)
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!userId || !notice) return
    setConfirming(true)
    await supabase
      .from('circular_confirmations')
      .insert({ notice_id: notice.id, user_id: userId })
    setConfirmed(true)
    setConfirming(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const getImages = (notice: Notice) => {
    if (notice.image_urls && notice.image_urls.length > 0) return notice.image_urls
    if (notice.image_url) return [notice.image_url]
    return []
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>読み込み中...</div>
  )

  if (!notice) return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>見つかりません</div>
  )

  const images = getImages(notice)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* ヘッダー */}
      <div style={{ background: '#185FA5', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', padding: '0' }}
        >
          ←
        </button>
        <span style={{ color: '#fff', fontSize: '18px', fontWeight: '500' }}>
          {notice.type === 'circular' ? '📋 回覧板' : '📢 お知らせ'}
        </span>
      </div>

      {/* コンテンツ */}
      <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto', background: '#fff', minHeight: 'calc(100vh - 52px)' }}>

        <div style={{ display: 'inline-block', background: notice.type === 'circular' ? '#EAF3DE' : '#E6F1FB', color: notice.type === 'circular' ? '#3B6D11' : '#0C447C', fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px', marginBottom: '12px' }}>
          {notice.type === 'circular' ? '要確認' : '新着'}
        </div>

        <div style={{ fontSize: '20px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>{notice.title}</div>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px', paddingBottom: '16px', borderBottom: '0.5px solid #e0e0e0' }}>
          {formatDate(notice.created_at)}　町内会事務局
        </div>

        {/* 複数画像 */}
        {images.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {images.map((url, index) => (
              <div key={index} style={{ position: 'relative', marginBottom: '8px' }}>
                <img src={url} alt={`画像${index + 1}`} style={{ width: '100%', borderRadius: '8px', border: '0.5px solid #ddd' }} />
                {images.length > 1 && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>
                    {index + 1}/{images.length}枚
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {notice.content && (
          <div style={{ fontSize: '16px', color: '#1a1a1a', lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '32px' }}>
            {notice.content}
          </div>
        )}

        {/* 回覧板の確認ボタン */}
        {notice.type === 'circular' && (
          <div style={{ marginBottom: '16px' }}>
            {confirmed ? (
              <div style={{ background: '#EAF3DE', color: '#3B6D11', padding: '16px', borderRadius: '8px', fontSize: '16px', fontWeight: '500', textAlign: 'center' }}>
                ✅ 確認済みです
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                style={{ width: '100%', padding: '16px', fontSize: '17px', fontWeight: '500', background: confirming ? '#888' : '#3B6D11', color: '#fff', border: 'none', borderRadius: '8px', cursor: confirming ? 'not-allowed' : 'pointer' }}
              >
                {confirming ? '送信中...' : '✅ 確認しました'}
              </button>
            )}
          </div>
        )}

        {/* PDF印刷ボタン */}
        <button
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', fontSize: '16px', fontWeight: '500', background: '#E6F1FB', color: '#0C447C', border: '1px solid #B5D4F4', borderRadius: '8px', cursor: 'pointer' }}
        >
          🖨️ 印刷用PDFをダウンロード
        </button>
      </div>
    </div>
  )
}