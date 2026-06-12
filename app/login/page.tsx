'use client'

import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#1a1a1a',
    background: '#fff',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>

        {/* ヘッダー */}
        <div style={{ background: '#185FA5', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏘️</div>
          <div style={{ color: '#fff', fontSize: '22px', fontWeight: '500' }}>まち・コネクト</div>
          <div style={{ color: '#B5D4F4', fontSize: '14px', marginTop: '4px' }}>町内会デジタル化サービス</div>
        </div>

        {/* フォーム */}
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '6px', color: '#1a1a1a' }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例：yamada@example.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '500', marginBottom: '6px', color: '#1a1a1a' }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', padding: '16px', fontSize: '17px', fontWeight: '500', background: loading ? '#888' : '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          <button
            style={{ width: '100%', padding: '14px', fontSize: '15px', background: '#f5f5f5', color: '#666', border: '0.5px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
          >
            ログインでお困りの方
          </button>
        </div>
      </div>
    </div>
  )
}