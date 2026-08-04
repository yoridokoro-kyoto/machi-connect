'use client'

import { useState } from 'react'
import { isIOSSafari, isStandalone } from '@/shared/lib/device'
import { AddToHomeScreenGuide } from '@/shared/components/AddToHomeScreenGuide'
import { isPushSupported, subscribeToPush } from '@/features/notifications'
import { markOnboardingSeen } from '../api'

type StepKey = 'welcome' | 'addToHomeScreen' | 'notification' | 'done'

type Props = {
  userId: string
  onFinish: () => void
}

export function OnboardingWizard({ userId, onFinish }: Props) {
  const [steps] = useState<StepKey[]>(() => {
    const showAddToHomeScreen = isIOSSafari() && !isStandalone()
    return ['welcome', ...(showAddToHomeScreen ? (['addToHomeScreen'] as const) : []), 'notification', 'done']
  })
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [notifyError, setNotifyError] = useState('')

  const currentStep = steps[index]
  const isLastStep = index === steps.length - 1

  const goNext = () => {
    if (isLastStep) {
      finish()
    } else {
      setIndex((i) => i + 1)
    }
  }

  const finish = () => {
    markOnboardingSeen(userId)
    onFinish()
  }

  const handleSkip = () => {
    finish()
  }

  const handleEnableNotifications = async () => {
    setLoading(true)
    setNotifyError('')
    const { error } = await subscribeToPush()
    if (error) setNotifyError(error)
    setLoading(false)
    goNext()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#fff',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* スキップ（常時いつでも終了可能） */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
        <button
          onClick={handleSkip}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '15px',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          スキップ
        </button>
      </div>

      {/* 本文 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 24px',
          maxWidth: '480px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {currentStep === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '16px' }}>
              まち・コネクトへようこそ
            </div>
            <div style={{ fontSize: '17px', color: '#555', lineHeight: 1.6 }}>
              お知らせの確認や出欠の回答が、この画面から簡単にできます。
            </div>
          </div>
        )}

        {currentStep === 'addToHomeScreen' && (
          <div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px', textAlign: 'center' }}>
              ホーム画面に追加
            </div>
            <div style={{ fontSize: '16px', color: '#555', marginBottom: '20px', textAlign: 'center', lineHeight: 1.6 }}>
              ホーム画面に追加すると、アプリのようにすぐ開けます。
            </div>
            <AddToHomeScreenGuide />
          </div>
        )}

        {currentStep === 'notification' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            {isPushSupported() ? (
              <>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>
                  お知らせが届いたら、すぐにお知らせします
                </div>
                <div style={{ fontSize: '16px', color: '#555', lineHeight: 1.6 }}>
                  回覧板や出欠確認の通知を受け取れるようになります。
                </div>
                {notifyError && (
                  <div style={{ fontSize: '13px', color: '#A32D2D', marginTop: '12px' }}>{notifyError}</div>
                )}
              </>
            ) : (
              <div style={{ fontSize: '18px', color: '#555', lineHeight: 1.6 }}>
                通知機能はこのブラウザでは利用できません
              </div>
            )}
          </div>
        )}

        {currentStep === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>
              準備ができました
            </div>
          </div>
        )}
      </div>

      {/* 進捗ドット */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        {steps.map((step, i) => (
          <div
            key={step}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: i === index ? '#185FA5' : '#ddd',
            }}
          />
        ))}
      </div>

      {/* 操作ボタン */}
      <div style={{ padding: '0 24px 32px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {currentStep === 'notification' && isPushSupported() ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '18px',
                fontWeight: '600',
                background: loading ? '#888' : '#185FA5',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '設定中...' : '有効にする'}
            </button>
            <button
              onClick={goNext}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                background: '#fff',
                color: '#555',
                border: '1px solid #ddd',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              あとで
            </button>
          </div>
        ) : (
          <button
            onClick={goNext}
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '18px',
              fontWeight: '600',
              background: '#185FA5',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            {currentStep === 'done' ? 'はじめる' : '次へ'}
          </button>
        )}
      </div>
    </div>
  )
}
