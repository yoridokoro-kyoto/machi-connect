'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type Notice = {
  id: string
  title: string
  rsvp_deadline: string | null
}

export default function RsvpSummaryPage() {
  const [notice, setNotice] = useState<Notice | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

      fetchData()
    }
    checkAuth()
  }, [])

  const fetchData = async () => {
    const [{ data: noticeData }, { data: rsvpData }] = await Promise.all([
      supabase.from('notices').select('id, title, rsvp_deadline').eq('id', params.id).single(),
      supabase.from('circular_confirmations')
        .select('user_id, rsvp, profiles(name)')
        .eq('notice_id', params.id)
    ])
    setNotice(noticeData)
    setRecords(rsvpData || [])
    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const attending = records.filter((r) => r.rsvp === 'attending')
  const absent = records.filter((r) => r.rsvp === 'absent')
  const undecided = records.filter((r) => r.rsvp === 'undecided')
  const noAnswer = records.filter((r) => !r.rsvp)

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
        <span style={{ color: '#fff', fontSize: '18px', fontWeight: '500' }}>📊 出欠集計</span>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>

        {/* タイトル・期限 */}
        {notice && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '0.5px solid #e0e0e0' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>{notice.title}</div>
            {notice.rsvp_deadline && (
              <div style={{ fontSize: '13px', color: '#888' }}>回答期限：{formatDate(notice.rsvp_deadline)}</div>
            )}
          </div>
        )}

        {/* 集計サマリー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: '✅ 出席', count: attending.length, bg: '#EAF3DE', color: '#3B6D11' },
            { label: '❌ 欠席', count: absent.length, bg: '#FCEBEB', color: '#A32D2D' },
            { label: '🤔 未定', count: undecided.length, bg: '#E6F1FB', color: '#0C447C' },
          ].map((item) => (
            <div key={item.label} style={{ background: item.bg, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: item.color }}>{item.count}</div>
              <div style={{ fontSize: '13px', color: item.color, marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* 未回答 */}
        {noAnswer.length > 0 && (
          <div style={{ background: '#fff8e6', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#8B6000' }}>
            ⚠️ 未回答：{noAnswer.length}名
          </div>
        )}

        {/* 各リスト */}
        {[
          { label: '✅ 出席', list: attending, bg: '#EAF3DE', color: '#3B6D11' },
          { label: '❌ 欠席', list: absent, bg: '#FCEBEB', color: '#A32D2D' },
          { label: '🤔 未定', list: undecided, bg: '#E6F1FB', color: '#0C447C' },
        ].map(({ label, list, bg, color }) => list.length > 0 && (
          <div key={label} style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '0.5px solid #e0e0e0' }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color, marginBottom: '10px' }}>{label}（{list.length}名）</div>
            {list.map((r) => (
              <div key={r.user_id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', marginRight: '10px' }}>
                  👤
                </div>
                <div style={{ fontSize: '15px', color: '#1a1a1a' }}>
                  {r.profiles?.name ?? '名前未設定'}
                </div>
              </div>
            ))}
          </div>
        ))}

        {records.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            まだ回答がありません
          </div>
        )}
      </div>
    </div>
  )
}