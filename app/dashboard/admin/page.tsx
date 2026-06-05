'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [type, setType] = useState<'notice' | 'circular'>('notice')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) {
      setError('画像は最大5枚までです')
      return
    }
    setError('')
    setImages((prev) => [...prev, ...files])
    const previews = files.map((f) => URL.createObjectURL(f))
    setImagePreviews((prev) => [...prev, ...previews])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    setLoading(true)
    setError('')

    const imageUrls: string[] = []

    for (const image of images) {
      const fileName = `${Date.now()}_${image.name}`
      const { error: uploadError } = await supabase.storage
        .from('notices')
        .upload(fileName, image)
      if (uploadError) {
        setError('画像のアップロードに失敗しました')
        setLoading(false)
        return
      }
      const { data } = supabase.storage.from('notices').getPublicUrl(fileName)
      imageUrls.push(data.publicUrl)
    }

    const { error } = await supabase
      .from('notices')
      .insert({
        title,
        content: content || '',
        image_url: imageUrls[0] || null,
        image_urls: imageUrls,
        type,
        organization_id: null
      })

    if (error) {
      setError('投稿に失敗しました')
    } else {
      setSuccess(true)
      setTitle('')
      setContent('')
      setImages([])
      setImagePreviews([])
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* ヘッダー */}
      <div style={{ background: '#185FA5', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', padding: '0' }}
        >
          ←
        </button>
        <span style={{ color: '#fff', fontSize: '18px', fontWeight: '500' }}>投稿する</span>
      </div>

      {/* フォーム */}
      <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>

        {success && (
          <div style={{ background: '#EAF3DE', color: '#3B6D11', padding: '14px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '15px' }}>
            ✅ 投稿しました！
          </div>
        )}

        {error && (
          <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '14px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '15px' }}>
            {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e0e0e0' }}>

          {/* 種別選択 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '8px', color: '#1a1a1a' }}>
              種別
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setType('notice')}
                style={{ flex: 1, padding: '12px', fontSize: '15px', fontWeight: '500', background: type === 'notice' ? '#185FA5' : '#f5f5f5', color: type === 'notice' ? '#fff' : '#555', border: '1.5px solid', borderColor: type === 'notice' ? '#185FA5' : '#ddd', borderRadius: '8px', cursor: 'pointer' }}
              >
                📢 お知らせ
              </button>
              <button
                onClick={() => setType('circular')}
                style={{ flex: 1, padding: '12px', fontSize: '15px', fontWeight: '500', background: type === 'circular' ? '#185FA5' : '#f5f5f5', color: type === 'circular' ? '#fff' : '#555', border: '1.5px solid', borderColor: type === 'circular' ? '#185FA5' : '#ddd', borderRadius: '8px', cursor: 'pointer' }}
              >
                📋 回覧板
              </button>
            </div>
          </div>

          {/* タイトル */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '6px', color: '#1a1a1a' }}>
              タイトル
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：6月の回覧板（市役所より）"
              style={{ width: '100%', padding: '14px 16px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* 内容（任意） */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '6px', color: '#1a1a1a' }}>
              内容 <span style={{ fontSize: '13px', color: '#888', fontWeight: '400' }}>（任意）</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="補足説明があれば入力してください"
              rows={4}
              style={{ width: '100%', padding: '14px 16px', fontSize: '16px', border: '1.5px solid #ddd', borderRadius: '8px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.8' }}
            />
          </div>

          {/* 画像アップロード（複数） */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '6px', color: '#1a1a1a' }}>
              画像・写真 <span style={{ fontSize: '13px', color: '#888', fontWeight: '400' }}>（最大5枚・任意）</span>
            </label>

            {images.length < 5 && (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', fontSize: '15px', background: '#f5f5f5', color: '#555', border: '1.5px dashed #ddd', borderRadius: '8px', cursor: 'pointer', boxSizing: 'border-box', marginBottom: '12px' }}>
                📷 写真を追加する（{images.length}/5枚）
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}

            {/* プレビュー */}
            {imagePreviews.map((preview, index) => (
              <div key={index} style={{ position: 'relative', marginBottom: '8px' }}>
                <img src={preview} alt={`画像${index + 1}`} style={{ width: '100%', borderRadius: '8px', border: '0.5px solid #ddd' }} />
                <button
                  onClick={() => removeImage(index)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', fontSize: '16px', cursor: 'pointer' }}
                >
                  ×
                </button>
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>
                  {index + 1}枚目
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '16px', fontSize: '17px', fontWeight: '500', background: loading ? '#888' : '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '投稿中...' : '投稿する'}
          </button>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          style={{ width: '100%', padding: '14px', fontSize: '15px', background: '#fff', color: '#185FA5', border: '1px solid #B5D4F4', borderRadius: '8px', cursor: 'pointer', marginTop: '12px' }}
        >
          一覧を見る
        </button>
      </div>
    </div>
  )
}