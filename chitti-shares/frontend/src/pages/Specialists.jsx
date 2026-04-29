// pages/Specialists.jsx
// ---------------------
// Hub page listing all stock-specific Chitti specialists.
// Tap any card -> /specialist/:symbol (chat UI for that one stock).

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { api, errMessage } from '../utils/api'
import { useT } from '../utils/i18n'

export default function Specialists() {
  const { lang } = useT()
  const T = (en, hi) => (lang === 'hi' ? hi : en)
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/specialists')
        setItems(r.data || [])
      } catch (e) { setErr(errMessage(e)) }
      finally { setLoading(false) }
    })()
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <h1>{T('Stock Specialists', 'स्टॉक विशेषज्ञ')}</h1>
        <p className="muted">
          {T('Each Chitti specialist focuses on one stock with deep context.',
             'हर चित्ती विशेषज्ञ एक ही स्टॉक पर गहराई से ध्यान देता है।')}
        </p>
      </header>

      {loading && <p>Loading…</p>}
      {err && <p className="error">{err}</p>}

      <div className="specialist-grid">
        {items.map((s) => (
          <button key={s.symbol}
                  className="specialist-card"
                  onClick={() => nav(`/specialist/${encodeURIComponent(s.symbol)}`)}>
            <div className="sc-emoji">🧑‍💼</div>
            <div className="sc-name">{s.display_name}</div>
            <div className="sc-stock">{s.long_name}</div>
            <div className="sc-expertise">{s.expertise}</div>
          </button>
        ))}
      </div>

      <BottomNav />

      <style>{`
        .specialist-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px; padding: 16px;
        }
        .specialist-card {
          padding: 16px; border-radius: 12px;
          background: var(--bg-card, #fff);
          border: 1px solid var(--border, #e2e8f0);
          text-align: left; cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .specialist-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .sc-emoji { font-size: 28px; margin-bottom: 8px; }
        .sc-name { font-weight: 700; font-size: 15px; }
        .sc-stock { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
        .sc-expertise { font-size: 11px; color: var(--text-muted); margin-top: 6px; line-height: 1.3; }
      `}</style>
    </div>
  )
}
