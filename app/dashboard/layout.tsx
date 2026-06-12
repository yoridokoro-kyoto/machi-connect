'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase'
import { Sidebar } from '@/shared/components/Sidebar'
import type { FeatureKey, Profile } from '@/shared/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [enabledFeatures, setEnabledFeatures] = useState<Set<FeatureKey>>()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (prof) {
        setProfile(prof as Profile)

        // 機能フラグ取得（org_idがある場合のみ）
        if (prof.org_id) {
          const { data: features } = await supabase
            .from('organization_features')
            .select('feature_key')
            .eq('org_id', prof.org_id)
            .eq('enabled', true)
          const keys = (features || []).map((f: { feature_key: FeatureKey }) => f.feature_key)
          setEnabledFeatures(new Set(keys))
        }
      }
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* PC: サイドバー常時表示 */}
      <div style={{ display: 'none' }} className="sidebar-desktop">
        <Sidebar
          orgName={profile ? '○○町内会' : undefined}
          enabledFeatures={enabledFeatures}
          isAdmin={isAdmin}
        />
      </div>

      {/* スマホ: オーバーレイサイドバー */}
      {isSidebarOpen && (
        <>
          <div
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50, display: 'flex' }}>
            <Sidebar
              orgName={profile ? '○○町内会' : undefined}
              enabledFeatures={enabledFeatures}
              isAdmin={isAdmin}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* メインコンテンツ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ヘッダー（スマホ用） */}
        <div style={{
          background: '#185FA5',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}>
          {/* ハンバーガーボタン */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ☰
          </button>
          <div>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>まち・コネクト</div>
            <div style={{ color: '#B5D4F4', fontSize: '12px' }}>○○町内会</div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            ログアウト
          </button>
        </div>

        {/* ページコンテンツ */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f0f4f8' }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
