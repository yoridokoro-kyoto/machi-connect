'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function EditNoticePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'notice' | 'circular'>('notice')
  const [requiresConfirmation, setRequiresConfirmation] = useState(true)
  const [requiresRsvp, setRequiresRsvp] = useState(false)
  const [rsvpDeadline, setRsvpDeadline] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (profile?.role !== 'admin') { router.push('/dashboard'); return }

      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) {
        setTitle(data.title)
        setContent(data.content)
        setType(data.type)
        setRequiresConfirmation(data.requires_confirmation ?? true)
        setRequiresRsvp(data.requires_rsvp ?? false)
        setRsvpDeadline(data.rsvp_deadline ?? '')
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleSave = async () => {
    if (!title.trim()) return
    if (requiresRsvp && !rsvpDeadline) {
      setError('出欠回答の期限を設定してください')
      return
    }
    setSaving(true)
    setError('')
    await supabase
      .from('notices')
      .update({
        title,
        content,
        type,
        requires_confirmation: type === 'circular' ? requiresConfirmation : false,
        requires_rsvp: type === 'circular' ? requiresRsvp : false,
        rsvp_deadline: type === 'circular' && requiresRsvp ? rsvpDeadline : null,
      })
      .eq('id', params.id)
    router.push(`/dashboard/notices/${params.id}`)
  }

  const toggleStyle = (active: boolean) => ({
    flex: 1, padding: '10px', fontSize: '14px', fontWeight: '500' as const,
    background: active ? '#185FA5' : '#f5f5f5',
    color: active ? '#fff' : '#555',
    border: '1.5px solid' as const,
    borderColor: active ? '#185FA5' : '#ddd',
    borderRadius: '8px', cursor: 'pointer' as const
  })

  const backButtonStyle = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500' as const,
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer' as const,
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
          style={backButtonStyle}
        >
          ← 詳細に戻る
        </button>
        <span style={{ color: '#fff', fontSize: '18px', fontWeight: '500' }}>✏️ 投稿を編集</span>
      </div>

      {/* フォーム */}
      <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>

        {error && (
          <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '14px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '15px' }}>
            {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e0e0e0' }}>

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

          {/* 回覧板オプション */}
          {type === 'circular' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e0e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#555', marginBottom: '12px' }}>回覧板オプション</div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>既読確認</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setRequiresConfirmation(true)} style={toggleStyle(requiresConfirmation)}>✅ 確認ボタンあり</button>
                  <button onClick={() => setRequiresConfirmation(false)} style={toggleStyle(!requiresConfirmation)}>📖 読むだけ</button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>出欠回答</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: requiresRsvp ? '12px' : '0' }}>
                  <button onClick={() => setRequiresRsvp(true)} style={toggleStyle(requiresRsvp)}>🙋 出欠を募る</button>
                  <button onClick={() => { setRequiresRsvp(false); setRsvpDeadline('') }} style={toggleStyle(!requiresRsvp)}>不要</button>
                </div>

                {requiresRsvp && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>回答期限 <span style={{ color: '#A32D2D' }}>*必須</span></div>
                    <input
                      type="date"
                      value={rsvpDeadline}
                      onChange={(e) => setRsvpDeadline(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const, color: '#1a1a1a', background: '#fff' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* タイトル */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: '500' }}>タイトル</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力"
              style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' as const, color: '#1a1a1a' }}
            />
          </div>

          {/* 本文 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: '500' }}>本文</div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="本文を入力"
              rows={10}
              style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' as const, resize: 'vertical', lineHeight: '1.8', color: '#1a1a1a' }}
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
    </div>
  )
}