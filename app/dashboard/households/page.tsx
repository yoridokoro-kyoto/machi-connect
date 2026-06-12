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

type Mode = 'list' | 'add' | 'edit' | 'csv_preview'

// CSVテンプレートのヘッダー定義
const CSV_HEADERS = ['世帯番号', '世帯主氏名', '住所', 'メールアドレス', '電話番号']

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

  // CSVインポート用
  const [csvPreview, setCsvPreview] = useState<HouseholdFormData[]>([])
  const [csvError, setCsvError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; fail: number } | null>(null)

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

  // CSVテンプレートをダウンロード
  const handleDownloadTemplate = () => {
    const bom = '\uFEFF' // Excelで文字化けしないようにBOMを付ける
    const header = CSV_HEADERS.join(',')
    const sample = '1組-1番,山田 太郎,京都市○○区○○町1-1,yamada@example.com,090-1234-5678'
    const csv = bom + header + '\n' + sample + '\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '世帯名簿テンプレート.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // CSVファイルを読み込んでプレビュー表示
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError('')
    setCsvPreview([])
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        let text = event.target?.result as string
        // BOMを除去
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)

        const lines = text.split('\n').map(l => l.trim()).filter(l => l)
        if (lines.length < 2) { setCsvError('データが1件もありません'); return }

        // 1行目はヘッダーなのでスキップ
        const rows = lines.slice(1)
        const parsed: HouseholdFormData[] = []
        const errors: string[] = []

        rows.forEach((line, i) => {
          // カンマ区切り（ダブルクォート対応）
          const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
          const [household_no, name, address, email, phone] = cols

          if (!name?.trim()) {
            errors.push(`${i + 2}行目: 世帯主氏名が空です`)
            return
          }
          if (!address?.trim()) {
            errors.push(`${i + 2}行目: 住所が空です`)
            return
          }

          parsed.push({ household_no: household_no || '', name, address, email: email || '', phone: phone || '' })
        })

        if (errors.length > 0) {
          setCsvError(errors.join('\n'))
          return
        }

        setCsvPreview(parsed)
        setMode('csv_preview')
      } catch {
        setCsvError('CSVファイルの読み込みに失敗しました')
      }
    }
    reader.readAsText(file, 'UTF-8')
    // inputをリセット（同じファイルを再選択できるように）
    e.target.value = ''
  }

  // CSVから一括登録
  const handleCsvImport = async () => {
    setImporting(true)
    setImportResult(null)
    let success = 0
    let fail = 0

    for (const row of csvPreview) {
      const { error } = await createHousehold(row)
      if (error) { fail++ } else { success++ }
    }

    setImportResult({ success, fail })
    setImporting(false)
    await load()
    if (fail === 0) {
      setTimeout(() => { setMode('list'); setImportResult(null) }, 2000)
    }
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

  // CSVプレビュー画面
  if (mode === 'csv_preview') {
    return (
      <div style={{ padding: '20px 16px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => { setMode('list'); setCsvPreview([]) }}
            style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#555', fontSize: '14px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>
            ← 一覧へ
          </button>
          <span style={{ fontSize: '18px', fontWeight: '500' }}>CSVインポート確認</span>
        </div>

        <div style={{ background: '#E6F1FB', color: '#0C447C', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          📋 {csvPreview.length}件のデータが読み込まれました。内容を確認して「一括登録する」を押してください。
        </div>

        {importResult && (
          <div style={{ background: importResult.fail === 0 ? '#EAF3DE' : '#FCEBEB', color: importResult.fail === 0 ? '#3B6D11' : '#A32D2D', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {importResult.fail === 0
              ? `✅ ${importResult.success}件の登録が完了しました`
              : `⚠️ 成功：${importResult.success}件 / 失敗：${importResult.fail}件`}
          </div>
        )}

        {/* プレビューテーブル */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e0', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#185FA5' }}>
                  {['世帯番号', '氏名', '住所', 'メール', '電話'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#fff', textAlign: 'left', fontWeight: '500', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid #e0e0e0', background: i % 2 === 0 ? '#f9fbff' : '#fff' }}>
                    <td style={{ padding: '10px 12px', color: '#888' }}>{row.household_no || '―'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '500' }}>{row.name}</td>
                    <td style={{ padding: '10px 12px' }}>{row.address}</td>
                    <td style={{ padding: '10px 12px', color: '#185FA5' }}>{row.email || '―'}</td>
                    <td style={{ padding: '10px 12px' }}>{row.phone || '―'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => { setMode('list'); setCsvPreview([]) }}
            style={{ flex: 1, padding: '14px', fontSize: '15px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            キャンセル
          </button>
          <button onClick={handleCsvImport} disabled={importing || importResult?.fail === 0}
            style={{ flex: 2, padding: '14px', fontSize: '15px', fontWeight: '500', background: importing ? '#888' : '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: importing ? 'not-allowed' : 'pointer' }}>
            {importing ? `登録中... (${csvPreview.length}件)` : `✅ ${csvPreview.length}件を一括登録する`}
          </button>
        </div>
      </div>
    )
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
            <label style={labelStyle}>世帯番号 <span style={{ fontSize: '12px', color: '#888', fontWeight: '400' }}>（任意）</span></label>
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
            <label style={labelStyle}>メールアドレス <span style={{ fontSize: '12px', color: '#888', fontWeight: '400' }}>（任意・招待メール送信に使用）</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="例：yamada@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>電話番号 <span style={{ fontSize: '12px', color: '#888', fontWeight: '400' }}>（任意）</span></label>
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

      {/* CSVインポートエリア */}
      <div style={{ padding: '12px 16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e0e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>📥 CSVで一括登録</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleDownloadTemplate}
              style={{ padding: '8px 16px', fontSize: '13px', background: '#fff', color: '#185FA5', border: '1px solid #B5D4F4', borderRadius: '8px', cursor: 'pointer' }}>
              📄 テンプレートをダウンロード
            </button>
            <label style={{ padding: '8px 16px', fontSize: '13px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              📂 CSVファイルを選択
              <input type="file" accept=".csv" onChange={handleCsvFile} style={{ display: 'none' }} />
            </label>
          </div>
          {csvError && (
            <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', whiteSpace: 'pre-line' }}>
              {csvError}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            CSV列順：世帯番号, 世帯主氏名*, 住所*, メールアドレス, 電話番号　（*必須）
          </div>
        </div>
      </div>

      {/* 世帯一覧 */}
      <div style={{ padding: '0 16px 80px', maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>読み込み中...</div>
        ) : households.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>世帯が登録されていません</div>
            <div style={{ fontSize: '13px' }}>「世帯を追加」またはCSVから登録してください</div>
          </div>
        ) : (
          households.map((h) => (
            <div key={h.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '0.5px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                {h.household_no && (
                  <span style={{ background: '#E6F1FB', color: '#0C447C', fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px', marginRight: '8px' }}>
                    {h.household_no}
                  </span>
                )}
                <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{h.name}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>📍 {h.address}</div>
                {h.email && <div>✉️ {h.email}</div>}
                {h.phone && <div>📞 {h.phone}</div>}
                {!h.email && !h.phone && <div style={{ color: '#aaa' }}>連絡先未登録</div>}
              </div>
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