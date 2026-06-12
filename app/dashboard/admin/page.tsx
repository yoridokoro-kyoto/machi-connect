'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNotice, uploadImage } from '@/features/notices'

type Step = 'input' | 'confirm'

export default function AdminPage() {
  const [step, setStep] = useState<Step>('input')
  const [type, setType] = useState<'notice' | 'circular'>('notice')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [requiresConfirmation, setRequiresConfirmation] = useState(true)
  const [requiresRsvp, setRequiresRsvp] = useState(false)
  const [rsvpDeadline, setRsvpDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) { setError('画像は最大5枚までです'); return }
    setError('')
    setImages((prev) => [...prev, ...files])
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    if (requiresRsvp && !rsvpDeadline) { setError('出欠回答の期限を設定してください'); return }
    setError('')
    setStep('confirm')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const imageUrls: string[] = []
    for (const image of images) {
      const url = await uploadImage(image)
      if (!url) { setError('画像のアップロードに失敗しました'); setLoading(false); return }
      imageUrls.push(url)
    }

    const { error } = await createNotice({
      title, content, type, imageUrls,
      requiresConfirmation, requiresRsvp,
      rsvpDeadline: rsvpDeadline || null,
    })

    if (error) { setError('投稿に失敗しました'); setLoading(false); return }
    router.push('/dashboard')
  }

  const toggleStyle = (active: boolean) => ({
    flex: 1, padding: '10px', fontSize: '14px', fontWeight: '500' as const,
    background: active ? '#185FA5' : '#f5f5f5',
    color: active ? '#fff' : '#555',
    border: '1.5px solid' as const,
    borderColor: active ? '#185FA5' : '#ddd',
    borderRadius: '8px', cursor: 'pointer' as const,
  })

  const backBtn = {
    background: '#f5f5f5', border: '1px solid #ddd', color: '#555',
    fontSize: '14px', fontWeight: '500' as const,
    padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' as const,
  }

  // 確認画面
  if (step === 'confirm') {
    return (
      <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setStep('input')} style={backBtn}>← 修正する</button>
          <span style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a' }}>内容を確認</span>
        </div>

        {error && <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e0e0e0', marginBottom: '16px' }}>
          <div style={{ display: 'inline-block', background: type === 'circular' ? '#EAF3DE' : '#E6F1FB', color: type === 'circular' ? '#3B6D11' : '#0C447C', fontSize: '12px', padding: '3px 10px', borderRadius: '6px', marginBottom: '12px' }}>
            {type === 'circular' ? '📋 回覧板' : '📢 お知らせ'}
          </div>
          {type === 'circular' && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#555' }}>
              {requiresConfirmation ? '確認ボタンあり' : '読むだけ'}　／　
              {requiresRsvp ? `出欠あり（期限：${rsvpDeadline}）` : '出欠なし'}
            </div>
          )}
          <div style={{ fontSize: '20px', fontWeight: '500', marginBottom: '8px' }}>{title}</div>
          {content && <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>{content}</div>}
          {imagePreviews.map((p, i) => (
            <img key={i} src={p} alt="" style={{ width: '100%', borderRadius: '8px', border: '0.5px solid #ddd', marginBottom: '8px' }} />
          ))}
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '16px', fontSize: '17px', fontWeight: '500', background: loading ? '#888' : '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '12px' }}>
          {loading ? '投稿中...' : '📨 この内容で投稿する'}
        </button>
        <button onClick={() => setStep('input')} style={{ width: '100%', padding: '14px', fontSize: '15px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
          ← 修正する
        </button>
      </div>
    )
  }

  // 入力画面
  return (
    <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => router.push('/dashboard')} style={backBtn}>← 一覧へ</button>
        <span style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a' }}>投稿する</span>
      </div>

      {error && <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e0e0e0' }}>

        {/* 種別 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '8px' }}>種別</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setType('notice')} style={toggleStyle(type === 'notice')}>📢 お知らせ</button>
            <button onClick={() => setType('circular')} style={toggleStyle(type === 'circular')}>📋 回覧板</button>
          </div>
        </div>

        {/* 回覧板オプション */}
        {type === 'circular' && (
          <div style={{ background: '#f8fafc', border: '1px solid #e0e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#555', marginBottom: '12px' }}>回覧板オプション</div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>既読確認</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setRequiresConfirmation(true)} style={toggleStyle(requiresConfirmation)}>確認ボタンあり</button>
                <button onClick={() => setRequiresConfirmation(false)} style={toggleStyle(!requiresConfirmation)}>読むだけ</button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>出欠回答</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: requiresRsvp ? '12px' : '0' }}>
                <button onClick={() => setRequiresRsvp(true)} style={toggleStyle(requiresRsvp)}>出欠を募る</button>
                <button onClick={() => { setRequiresRsvp(false); setRsvpDeadline('') }} style={toggleStyle(!requiresRsvp)}>不要</button>
              </div>
              {requiresRsvp && (
                <input type="date" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' as const, color: '#1a1a1a', background: '#fff', marginTop: '12px' }}
                />
              )}
            </div>
          </div>
        )}

        {/* タイトル */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>タイトル</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：6月の回覧板"
            style={{ width: '100%', padding: '14px 16px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const, color: '#1a1a1a' }}
          />
        </div>

        {/* 内容 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>内容 <span style={{ fontSize: '13px', color: '#888', fontWeight: '400' }}>（任意）</span></label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="補足説明" rows={4}
            style={{ width: '100%', padding: '14px 16px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, lineHeight: '1.8', color: '#1a1a1a' }}
          />
        </div>

        {/* 画像 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>画像 <span style={{ fontSize: '13px', color: '#888', fontWeight: '400' }}>（最大5枚・任意）</span></label>
          {images.length < 5 && (
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', background: '#f5f5f5', color: '#555', border: '1.5px dashed #ddd', borderRadius: '8px', cursor: 'pointer', boxSizing: 'border-box' as const, marginBottom: '12px' }}>
              📷 写真を追加（{images.length}/5枚）
              <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          )}
          {imagePreviews.map((p, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: '8px' }}>
              <img src={p} alt="" style={{ width: '100%', borderRadius: '8px', border: '0.5px solid #ddd' }} />
              <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', fontSize: '16px', cursor: 'pointer' }}>×</button>
            </div>
          ))}
        </div>

        <button onClick={handleNext} style={{ width: '100%', padding: '16px', fontSize: '17px', fontWeight: '500', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          内容を確認する →
        </button>
      </div>
    </div>
  )
}
