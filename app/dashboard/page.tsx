'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useRouter } from 'next/navigation'
import { fetchNotices, fetchConfirmedIds } from '@/features/notices'
import type { Notice } from '@/features/notices'

export default function DashboardPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'notice' | 'circular'>('notice')
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'circular' || tab === 'notice') setActiveTab(tab)

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      setProfile(prof)

      const [noticesData, confirmedData] = await Promise.all([
        fetchNotices(),
        fetchConfirmedIds(session.user.id),
      ])
      setNotices(noticesData)
      setConfirmedIds(confirmedData)
      setLoading(false)
    }
    init()
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const filtered = notices.filter((n) => n.type === activeTab)

  const canPost = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'officer'

  const getBadge = (notice: Notice) => {
    if (notice.type === 'notice') return { label: '新着', bg: '#E6F1FB', color: '#0C447C' }
    const isConfirmed = confirmedIds.has(notice.id)
    if (isConfirmed) return { label: '確認済み', bg: '#EAF3DE', color: '#3B6D11' }
    if (!notice.requires_confirmation) return { label: '読んでね', bg: '#FFF8E6', color: '#8B6000' }
    return { label: '要確認', bg: '#FCEBEB', color: '#A32D2D' }
  }

  return (
    <div style={{ minHeight: '100%' }}>

      {/* タブ */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '0.5px solid #e0e0e0' }}>
        {(['notice', 'circular'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '14px', fontSize: '15px', fontWeight: '500',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '3px solid #185FA5' : '3px solid transparent',
              color: activeTab === tab ? '#185FA5' : '#888',
              cursor: 'pointer',
            }}
          >
            {tab === 'notice' ? '📢 お知らせ' : '📋 回覧板'}
          </button>
        ))}
      </div>

      {/* 投稿ボタン（管理者・役員のみ） */}
      {canPost && (
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.push('/dashboard/admin')}
            style={{
              background: '#185FA5', color: '#fff', border: 'none',
              padding: '10px 20px', borderRadius: '8px', fontSize: '14px',
              fontWeight: '500', cursor: 'pointer',
            }}
          >
            ＋ 投稿する
          </button>
        </div>
      )}

      {/* コンテンツ */}
      <div style={{ padding: '0 16px 80px', maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{activeTab === 'notice' ? '📭' : '📋'}</div>
            <div>{activeTab === 'notice' ? 'お知らせはまだありません' : '回覧板はまだありません'}</div>
          </div>
        ) : (
          filtered.map((notice) => {
            const badge = getBadge(notice)
            const isConfirmed = confirmedIds.has(notice.id)
            return (
              <div
                key={notice.id}
                onClick={() => router.push(`/dashboard/notices/${notice.id}`)}
                style={{
                  background: '#fff', borderRadius: '12px', padding: '16px',
                  marginBottom: '12px',
                  border: `0.5px solid ${isConfirmed ? '#C0DD97' : '#e0e0e0'}`,
                  cursor: 'pointer', opacity: isConfirmed ? 0.8 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{
                    background: badge.bg, color: badge.color,
                    fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px',
                  }}>
                    {badge.label}
                  </span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>
                  {notice.title}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>{formatDate(notice.created_at)}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}