'use client'

import { useEffect, useState } from 'react'
import { isIOSSafari, isStandalone } from '@/shared/lib/device'
import { AddToHomeScreenGuide } from './AddToHomeScreenGuide'

// ホーム画面未追加のiOS Safariユーザーに向けた常設バナー。
// 閉じるボタンは意図的に付けない（ホーム画面に追加するまで気づく機会を
// 失わせないため）。ホーム画面に追加済みになれば自動的に非表示になる。
export function InstallPromptBanner() {
  const [visible, setVisible] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    setVisible(isIOSSafari() && !isStandalone())
  }, [])

  if (!visible) return null

  return (
    <>
      <div
        style={{
          background: '#FFF8E6',
          borderBottom: '1px solid #F0DFA0',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontSize: '14px',
          color: '#8B6000',
          flexWrap: 'wrap',
          textAlign: 'center',
        }}
      >
        <span>📱 ホーム画面に追加すると、お知らせをすぐ受け取れます</span>
        <button
          onClick={() => setShowGuide(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#185FA5',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          やり方を見る
        </button>
      </div>

      {showGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowGuide(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
              ホーム画面への追加方法
            </div>
            <AddToHomeScreenGuide />
            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '500',
                background: '#185FA5',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  )
}
