'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Notice = {
  id: string
  title: string
  content: string
  type: 'notice' | 'circular'
  created_at: string
}

export default function DashboardPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'notice' | 'circular'>('notice')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)
      fetchAll(session.user.id)
    }
    checkAuth()
  }, [])

  const fetchAll = async (uid: string) => {
    const [{ data: noticesData }, { data: confData }] = await Promise.all([
      supabase.from('notices').select('*').order('created_at', { ascending: false }),
      supabase.from('circular_confirmations').select('notice_id').eq('user_id', uid)
    ])
    setNotices(noticesData || [])
    setConfirmedIds(new Set((confData || []).map((c: { notice_id: string }) => c.notice_id)))
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const filtered = notices.filter((n) => n.type === activeTab)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* ヘッダー */}
      <div style={{ background: '#185FA5', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: '500' }}>まち・コネクト</div>
          <div style={{ color: '#B5D4F4', fontSize: '13px' }}>○○町内会</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push('/dashboard/admin')}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
          >
            ＋ 投稿
          </button>
          <button
            onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* タブ */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '0.5px solid #e0e0e0' }}>
        <button
          onClick={() => setActiveTab('notice')}
          style={{ flex: 1, padding: '14px', fontSize: '15px', fontWeight: '500', background: 'none', border: 'none', borderBottom: activeTab === 'notice' ? '3px solid #185FA5' : '3px solid transparent', color: activeTab === 'notice' ? '#185FA5' : '#888', cursor: 'pointer' }}
        >
          📢 お知らせ
        </button>
        <button
          onClick={() => setActiveTab('circular')}
          style={{ flex: 1, padding: '14px', fontSize: '15px', fontWeight: '500', background: 'none', border: 'none', borderBottom: activeTab === 'circular' ? '3px solid #185FA5' : '3px solid transparent', color: activeTab === 'circular' ? '#185FA5' : '#888', cursor: 'pointer' }}
        >
          📋 回覧板
        </button>
      </div>

      {/* コンテンツ */}
      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{activeTab === 'notice' ? '📭' : '📋'}</div>
            <div style={{ fontSize: '16px' }}>{activeTab === 'notice' ? 'お知らせはまだありません' : '回覧板はまだありません'}</div>
          </div>
        ) : (
          filtered.map((notice) => {
            const isConfirmed = confirmedIds.has(notice.id)
            return (
              <div
                key={notice.id}
                style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: `0.5px solid ${isConfirmed ? '#C0DD97' : '#e0e0e0'}`, cursor: 'pointer', opacity: isConfirmed ? 0.8 : 1 }}
                onClick={() => router.push(`/dashboard/notices/${notice.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  {activeTab === 'circular' ? (
                    isConfirmed ? (
                      <span style={{ display: 'inline-block', background: '#EAF3DE', color: '#3B6D11', fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px' }}>✅ 確認済み</span>
                    ) : (
                      <span style={{ display: 'inline-block', background: '#FCEBEB', color: '#A32D2D', fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px' }}>要確認</span>
                    )
                  ) : (
                    <span style={{ display: 'inline-block', background: '#E6F1FB', color: '#0C447C', fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px' }}>新着</span>
                  )}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>{notice.title}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{formatDate(notice.created_at)}</div>
              </div>
            )
          })
        )}
      </div>

      {/* ナビゲーション */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '0.5px solid #e0e0e0', display: 'flex', justifyContent: 'space-around', padding: '10px 0 16px' }}>
        {[
          { icon: '📋', label: 'お知らせ', active: true },
          { icon: '📅', label: '行事', active: false },
          { icon: '👥', label: '世帯', active: false },
          { icon: '⚙️', label: '設定', active: false },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '11px', color: item.active ? '#185FA5' : '#888' }}>
            <span style={{ fontSize: '22px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}