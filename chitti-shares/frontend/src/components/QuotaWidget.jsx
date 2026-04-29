// components/QuotaWidget.jsx
// --------------------------
// Small widget for the dashboard showing today's API spend.
// Refreshes every 60s while mounted.

import { useEffect, useState } from 'react'
import { api } from '../utils/api'

export default function QuotaWidget() {
  const [data, setData] = useState(null)

  const load = async () => {
    try {
      const r = await api.get('/api/quota/today')
      setData(r.data)
    } catch {
      /* silent */
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [])

  if (!data) return null

  const pct = Math.min(100, (data.total_inr / data.hard_cap_inr) * 100)
  const colour =
    data.status === 'blocked' ? '#dc2626'
    : data.status === 'warning' ? '#f59e0b'
    : '#10b981'

  return (
    <div className="quota-widget" title={`Today's API spend: ₹${data.total_inr}`}>
      <div className="quota-label">
        <span>Today: ₹{data.total_inr.toFixed(2)}</span>
        <span className="quota-cap">/ ₹{data.hard_cap_inr}</span>
      </div>
      <div className="quota-bar-bg">
        <div className="quota-bar-fg" style={{ width: `${pct}%`, background: colour }} />
      </div>
      <style>{`
        .quota-widget {
          font-size: 12px;
          padding: 8px 12px;
          background: var(--bg-card, #fff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 8px;
          min-width: 140px;
        }
        .quota-label { display: flex; justify-content: space-between; }
        .quota-cap { color: var(--text-muted, #94a3b8); }
        .quota-bar-bg {
          height: 4px; background: var(--border, #e2e8f0);
          border-radius: 2px; margin-top: 6px; overflow: hidden;
        }
        .quota-bar-fg {
          height: 100%; transition: width .3s ease;
        }
      `}</style>
    </div>
  )
}
