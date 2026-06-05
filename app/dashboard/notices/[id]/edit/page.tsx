'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function EditNoticePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'notice' | 'circular'>('notice')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // 管理者チェック
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (profile?.role !== 'admin') { router.push('/dashboard'); return }

      // 既存データ取得
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) {
        setTitle(data.title)
        setContent(data.content)
        setType(data.type)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await supabase
      .from('notices')
      .update({ title, content, type })
      .eq('id', params.id)
    router.push('/dashboard')
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>読み込み中...</div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* ヘッダー */}
      <div style={{ background: '#185FA5', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => router.push(`/dashboard/notices/${params.id}`)}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', padding: '0' }}
        >
          ←
        </button>
        <span style={{ color: '#fff', fontSize: '18px', fontWeight: '500' }}>✏️ 投稿を編集</span>
      </div>

      {/* フォーム */}
      <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto', background: '#fff', minHeight: 'calc(100vh - 52px)' }}>

        {/* 種別 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: '500' }}>種別</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['notice', 'circular'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  flex: 1, padding: '12px', fontSize: '15px', borderRadius: '8px', border: '1.5px solid',
                  borderColor: type === t ? '#185FA5' : '#ddd',
                  background: type === t ? '#E6F1FB' : '#fff',
                  color: type === t ? '#185FA5' : '#888',
                  cursor: 'pointer', fontWeight: type === t ? '600' : '400'
                }}
              >
                {t === 'notice' ? '📢 お知らせ' : '📋 回覧板'}
              </button>
            ))}
          </div>
        </div>

        {/* タイトル */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: '500' }}>タイトル</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力"
            style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {/* 本文 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: '500' }}>本文</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="本文を入力"
            rows={10}
            style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', resize: 'vertical', lineHeight: '1.8' }}
          />
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          style={{
            width: '100%', padding: '16px', fontSize: '17px', fontWeight: '600',
            background: saving || !title.trim() ? '#aaa' : '#185FA5',
            color: '#fff', border: 'none', borderRadius: '8px',
            cursor: saving || !title.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? '保存中...' : '💾 保存する'}
        </button>
      </div>
    </div>
  )
}