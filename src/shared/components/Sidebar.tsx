'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FeatureKey } from '@/shared/types'

type NavItem = {
  key: FeatureKey | 'home'
  label: string
  icon: string
  href: string
}

// ナビゲーション項目の定義
// 新機能追加時はここに追加するだけでサイドバーに反映される
const NAV_ITEMS: NavItem[] = [
  { key: 'notices',    label: 'お知らせ・回覧板', icon: '📋', href: '/dashboard' },
  { key: 'households', label: '世帯管理',         icon: '🏠', href: '/dashboard/households' },
  { key: 'safety',     label: '安否確認',         icon: '🆘', href: '/dashboard/safety' },
  { key: 'survey',     label: 'アンケート・表決', icon: '📊', href: '/dashboard/survey' },
  { key: 'messaging',  label: '役員間連絡',       icon: '💬', href: '/dashboard/messaging' },
  { key: 'events',     label: '行事・当番',       icon: '📅', href: '/dashboard/events' },
]

const ADMIN_ITEMS: NavItem[] = [
  { key: 'home', label: '管理者設定', icon: '⚙️', href: '/dashboard/admin/settings' },
]

type Props = {
  orgName?: string
  enabledFeatures?: Set<FeatureKey>
  isAdmin?: boolean
  onClose?: () => void
}

export function Sidebar({ orgName = '○○町内会', enabledFeatures, isAdmin, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const handleNav = (href: string) => {
    router.push(href)
    onClose?.()
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  // 表示する項目：機能フラグでフィルタ（未設定時は全表示）
  const visibleItems = NAV_ITEMS.filter(item =>
    item.key === 'home' || !enabledFeatures || enabledFeatures.has(item.key as FeatureKey)
  )

  return (
    <div style={{
      width: '240px',
      background: '#fff',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* 町内会名 */}
      <div style={{ background: '#185FA5', padding: '20px 16px' }}>
        <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>まち・コネクト</div>
        <div style={{ color: '#B5D4F4', fontSize: '13px', marginTop: '4px' }}>{orgName}</div>
      </div>

      {/* ナビゲーション */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {visibleItems.map(item => (
          <button
            key={item.key}
            onClick={() => handleNav(item.href)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: isActive(item.href) ? '#E6F1FB' : 'transparent',
              border: 'none',
              borderLeft: isActive(item.href) ? '3px solid #185FA5' : '3px solid transparent',
              color: isActive(item.href) ? '#185FA5' : '#444',
              fontSize: '14px',
              fontWeight: isActive(item.href) ? '600' : '400',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        {/* 管理者メニュー */}
        {isAdmin && (
          <>
            <div style={{ margin: '12px 16px 4px', fontSize: '11px', color: '#aaa', fontWeight: '600', letterSpacing: '0.05em' }}>
              管理者メニュー
            </div>
            {ADMIN_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => handleNav(item.href)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: isActive(item.href) ? '#E6F1FB' : 'transparent',
                  border: 'none',
                  borderLeft: isActive(item.href) ? '3px solid #185FA5' : '3px solid transparent',
                  color: isActive(item.href) ? '#185FA5' : '#444',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* ログアウト */}
      <div style={{ padding: '12px', borderTop: '1px solid #e0e0e0' }}>
        <button
          onClick={() => handleNav('/logout')}
          style={{
            width: '100%',
            padding: '10px',
            background: '#f5f5f5',
            border: 'none',
            borderRadius: '8px',
            color: '#666',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}
