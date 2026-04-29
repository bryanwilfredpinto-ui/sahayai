// components/WakeUpOverlay.jsx
// ----------------------------
// Shown when an API call is hanging > 8 seconds, which usually means
// the Render free dyno is waking up from sleep. We give the user a
// friendly "give it 30s, then refresh" screen so they don't think
// the app crashed.

import { useEffect, useState } from 'react'
import { useT } from '../utils/i18n'

export default function WakeUpOverlay({ onDismiss }) {
  const { lang } = useT()
  const T = (en, hi) => (lang === 'hi' ? hi : en)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = () => {
    onDismiss?.()
    window.location.reload()
  }

  return (
    <div className="wake-overlay">
      <div className="wake-card">
        <div className="wake-spinner" />
        <h2>{T('Backend is waking up', 'सर्वर शुरू हो रहा है')}</h2>
        <p className="wake-msg">
          {T(
            'The free server sleeps when idle to save costs. It takes about 30 seconds to wake up.',
            'सर्वर खर्च बचाने के लिए सोता है। जागने में लगभग 30 सेकंड लगते हैं।'
          )}
        </p>
        <p className="wake-timer">
          {T('Waiting', 'प्रतीक्षा')}: <strong>{seconds}s</strong>
        </p>
        <button className="btn btn-primary" onClick={handleRefresh}>
          {T('Refresh the Page', 'पेज रीफ्रेश करें')}
        </button>
        <p className="wake-hint">
          {T(
            'Tip: keep the app open during market hours to avoid this.',
            'सुझाव: मार्केट के समय ऐप खुली रखें।'
          )}
        </p>
      </div>

      <style>{`
        .wake-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.92);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
          padding: 16px;
          backdrop-filter: blur(4px);
        }
        .wake-card {
          background: var(--bg-card, #fff);
          border-radius: 16px;
          padding: 32px 24px;
          max-width: 380px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        }
        .wake-card h2 { margin: 16px 0 8px; font-size: 20px; }
        .wake-msg { color: var(--text-muted, #64748b); font-size: 14px; line-height: 1.5; margin: 8px 0 16px; }
        .wake-timer { font-size: 16px; margin: 12px 0; }
        .wake-hint { font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 16px; }
        .wake-spinner {
          width: 48px; height: 48px;
          border: 4px solid var(--border, #e2e8f0);
          border-top-color: var(--accent, #2563eb);
          border-radius: 50%;
          margin: 0 auto;
          animation: wake-spin 1s linear infinite;
        }
        @keyframes wake-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
