'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  fetchHouseholds, createHousehold, updateHousehold, deleteHousehold
} from '@/features/households'
import type { Household, HouseholdFormData } from '@/features/households'

const EMPTY_FORM: HouseholdFormData = {
  household_no: '', name: '', address: '', email: '', phone: ''
}

type Mode = 'list' | 'add' | 'edit'

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('list')
  const [form, setForm] = useState<HouseholdFormData>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [inviting, setInviting] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        router.push('/dashboard'); return
      }
      await load()
    }
    init()
  }, [])

  const load = async () => {
    setLoading(true)
    const data = await fetchHouseholds()
    setHouseholds(data)
    setLoading(false)
  }

  const handleAdd = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setError('')
    setMode('add')
  }

  const handleEdit = (h: Household) => {
    setForm({
      household_no: h.household_no,
      name: h.name,
      address: h.address,
      email: h.email || '',
      phone: h.phone || '',
    })
    setEditId(h.id)
    setError('')
    setMode('edit')
  }

  const handleDelete = async (h: Household) => {
    const ok = window.confirm(`「${h.name}」を削除しますか？\nこの操作は取り消せません。`)
    if (!ok) return
    await deleteHousehold(h.id)
    await load()
  }

  const handleSave = async () => {
    if (!form.household_no.trim()) { setError('世帯番号を入力してください'); return }
    if (!form.name.trim()) { setError('氏名を入力してください'); return }
    if (!form.address.trim()) { setError('住所を入力してください'); return }
    setSaving(true)
    setError('')

    if (mode === 'edit' && editId) {
      const { error } = await updateHousehold(editId, form)
      if (error) { setError('更新に失敗しました'); setSaving(false); return }
    } else {
      const { error } = await createHousehold(form)
      if (error) { setError('登録に失敗しました'); setSaving(false); return }
    }

    await load()
    setMode('list')
    setSaving(false)
  }

  const handleInvite = async (h: Household) => {
    if (!h.email) { alert('メールアドレスが登録されていません'); return }
    const ok = window.confirm(`${h.name}（${h.email}）に招待メールを送りますか？`)
    if (!ok) return
    setInviting(h.id)
    setInviteSuccess(null)

    const { error } = await supabase.auth.resetPasswordForEmail(h.email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (error) {
      alert('招待メールの送信に失敗しました')
    } else {
      setInviteSuccess(h.id)
      setTimeout(() => setInviteSuccess(null), 3000)
    }
    setInviting(null)
  }

  const inputStyle = {
    width: '100%', padding: '12px', fontSize: '16px',
    border: '1.5px solid #ddd', borderRadius: '8px',
    boxSizing: 'border-box' as const, color: '#1a1a1a', background: '#fff',
  }

  const labelStyle = {
    display: 'block', fontSize: '14px', fontWeight: '500' as const,
    marginBottom: '6px', color: '#555',
  }

  // フォーム画面
  if (mode === 'add' || mode === 'edit') {
    return (
      <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setMode('list')} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#555', fontSize: '14px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>
            ← 一覧へ
          </button>
          <span style={{ fontSize: '18px', fontWeight: '500' }}>
            {mode === 'add' ? '世帯を追加' : '世帯を編集'}
          </span>
        </div>

        {error && (
          <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e0e0e0', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <label style={labelStyle}>世帯番号 <span style={{ color: '#A32D2D' }}>*</span></label>
            <input value={form.household_no} onChange={(e) => setForm({ ...form, household_no: e.target.value })}
              placeholder="例：1組-1番" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>世帯主氏名 <span style={{ color: '#A32D2D' }}>*</span></label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例：山田 太郎" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>住所 <span style={{ color: '#A32D2D' }}>*</span></label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="例：京都市○○区○○町1-1" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>
              メールアドレス <span style={{ fontSize: '12px', color: '#888', fontWeight: '400' }}>（任意・招待メール送信に使用）</span>
            </label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="例：yamada@example.com" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>
              電話番号 <span style={{ fontSize: '12px', color: '#888', fontWeight: '400' }}>（任意）</span>
            </label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="例：090-1234-5678" style={inputStyle} />
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: '16px', fontSize: '17px', fontWeight: '500', background: saving ? '#888' : '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
            {saving ? '保存中...' : mode === 'add' ? '登録する' : '更新する'}
          </button>
        </div>
      </div>
    )
  }

  // 一覧画面
  return (
    <div style={{ minHeight: '100%' }}>

      {/* ヘッダー */}
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #e0e0e0' }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
          世帯管理　<span style={{ fontSize: '13px', color: '#888', fontWeight: '400' }}>{households.length}世帯</span>
        </span>
        <button onClick={handleAdd}
          style={{ background: '#185FA5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          ＋ 世帯を追加
        </button>
      </div>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>読み込み中...</div>
        ) : households.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>世帯が登録されていません</div>
            <div style={{ fontSize: '13px' }}>「世帯を追加」から登録してください</div>
          </div>
        ) : (
          households.map((h) => (
            <div key={h.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '0.5px solid #e0e0e0' }}>

              {/* 世帯番号・氏名 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <span style={{ background: '#E6F1FB', color: '#0C447C', fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px', marginRight: '8px' }}>
                    {h.household_no}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{h.name}</span>
                </div>
              </div>

              {/* 詳細情報 */}
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>📍 {h.address}</div>
                {h.email && <div>✉️ {h.email}</div>}
                {h.phone && <div>📞 {h.phone}</div>}
                {!h.email && !h.phone && <div style={{ color: '#aaa' }}>連絡先未登録</div>}
              </div>

              {/* ボタン */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {h.email && (
                  <button onClick={() => handleInvite(h)} disabled={inviting === h.id}
                    style={{ flex: 1, padding: '8px', fontSize: '13px', background: inviteSuccess === h.id ? '#EAF3DE' : '#f0f7ff', color: inviteSuccess === h.id ? '#3B6D11' : '#185FA5', border: `1px solid ${inviteSuccess === h.id ? '#C0DD97' : '#B5D4F4'}`, borderRadius: '8px', cursor: inviting === h.id ? 'not-allowed' : 'pointer' }}>
                    {inviteSuccess === h.id ? '✅ 送信完了' : inviting === h.id ? '送信中...' : '✉️ 招待メール送信'}
                  </button>
                )}
                <button onClick={() => handleEdit(h)}
                  style={{ padding: '8px 16px', fontSize: '13px', background: '#f5f5f5', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
                  編集
                </button>
                <button onClick={() => handleDelete(h)}
                  style={{ padding: '8px 16px', fontSize: '13px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #f5c6c6', borderRadius: '8px', cursor: 'pointer' }}>
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}