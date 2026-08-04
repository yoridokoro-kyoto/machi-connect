// iOS Safariでの「ホーム画面に追加」手順を説明する部品。
// ボタン等の進行操作は持たない（OnboardingWizardのステップ、
// InstallPromptBannerのモーダル、双方から埋め込んで使う）。
export function AddToHomeScreenGuide() {
  const steps = [
    { icon: '⎋', text: '画面下の共有ボタンをタップ' },
    { icon: '➕', text: '「ホーム画面に追加」を選ぶ' },
    { icon: '✅', text: '右上の「追加」をタップして完了' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {steps.map((step, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: '#E6F1FB',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#185FA5',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
          <div style={{ fontSize: '32px', flexShrink: 0 }}>{step.icon}</div>
          <div style={{ fontSize: '18px', color: '#1a1a1a', lineHeight: 1.4 }}>{step.text}</div>
        </div>
      ))}
    </div>
  )
}
