// pages/Calls.jsx
// ---------------
// Call Report list page. Win-rate at top, then filterable table of calls.

import { useEffect, useState, useMemo } from 'react'
import BottomNav from '../components/BottomNav'
import { api, errMessage } from '../utils/api'
import { useT } from '../utils/i18n'
import { fmt } from '../utils/format'

const formatINR = (n) => n == null ? '——' : `₹${fmt(n)}`

export default function Calls() {
  const { lang } = useT()
  const T = (en, hi) => (lang === 'hi' ? hi : en)
  const [calls, setCalls] = useState([])
  const [stats, setStats] = useState(null)
  const [err, setErr] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      const [c, s] = await Promise.all([
        api.get('/api/calls'),
        api.get('/api/calls/stats'),
      ])
      setCalls(c.data || [])
      setStats(s.data || null)
    } catch (e) { setErr(errMessage(e)) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return calls.filter(c => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      if (search && !c.symbol.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [calls, filterStatus, search])

  return (
    <div className="page">
      <header className="page-header">
        <h1>{T('Call Report', 'कॉल रिपोर्ट')}</h1>
      </header>

      {err && <p className="error">{err}</p>}

      {stats && (
        <div className="calls-stats">
          <div className="stat">
            <div className="stat-label">{T('Total', 'कुल')}</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat">
            <div className="stat-label">{T('Open', 'खुले')}</div>
            <div className="stat-value">{stats.open}</div>
          </div>
          <div className="stat">
            <div className="stat-label">{T('Win Rate', 'जीत दर')}</div>
            <div className="stat-value">
              {stats.win_rate_pct !== null ? `${stats.win_rate_pct}%` : '—'}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">🎯 {T('Targets', 'लक्ष्य')}</div>
            <div className="stat-value">{stats.target_hit}</div>
          </div>
          <div className="stat">
            <div className="stat-label">🛑 {T('SL Hit', 'SL')}</div>
            <div className="stat-value">{stats.sl_hit}</div>
          </div>
        </div>
      )}

      <div className="calls-filters">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
               placeholder={T('Filter by symbol…', 'सिंबल से फ़िल्टर…')} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">{T('All statuses', 'सभी')}</option>
          <option value="open">{T('Open', 'खुले')}</option>
          <option value="target_hit">{T('Target hit', 'लक्ष्य पूरा')}</option>
          <option value="sl_hit">{T('SL hit', 'SL लगा')}</option>
          <option value="closed_manual">{T('Manually closed', 'मैन्युअली बंद')}</option>
        </select>
      </div>

      <div className="calls-list">
        {filtered.length === 0 && <p className="muted">{T('No calls match.', 'कोई कॉल नहीं।')}</p>}
        {filtered.map((c) => (
          <CallRow key={c.id} c={c} T={T} />
        ))}
      </div>

      <BottomNav />

      <style>{`
        .calls-stats {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 8px; padding: 12px 16px;
        }
        .stat { padding: 12px; border-radius: 10px;
                background: var(--bg-card, #fff);
                border: 1px solid var(--border, #e2e8f0); text-align: center; }
        .stat-label { font-size: 11px; color: var(--text-muted, #64748b); }
        .stat-value { font-size: 18px; font-weight: 700; margin-top: 2px; }
        .calls-filters { display: flex; gap: 8px; padding: 8px 16px; }
        .calls-filters input, .calls-filters select {
          flex: 1; padding: 8px 10px;
          border: 1px solid var(--border, #cbd5e1); border-radius: 6px;
          font-size: 13px;
        }
        .calls-list { padding: 0 16px 80px; }
      `}</style>
    </div>
  )
}

function CallRow({ c, T }) {
  const badge = {
    open: { label: T('Open', 'खुला'), color: '#2563eb' },
    target_hit: { label: T('Target', 'लक्ष्य'), color: '#10b981' },
    sl_hit: { label: T('SL', 'SL'), color: '#dc2626' },
    closed_manual: { label: T('Closed', 'बंद'), color: '#64748b' },
  }[c.status] || { label: c.status, color: '#64748b' }

  return (
    <div className="call-row">
      <div className="cr-line">
        <strong>{c.symbol.replace(/^NSE:|^BSE:/, '')}</strong>
        <span className="cr-type">{c.call_type}</span>
        <span className="cr-badge" style={{ background: badge.color }}>{badge.label}</span>
      </div>
      <div className="cr-detail muted">
        {T('Entry', 'एंट्री')} {formatINR(c.entry_price)}
        {' · '}{T('Target', 'लक्ष्य')} {formatINR(c.target)}
        {' · SL '}{formatINR(c.stop_loss)}
        {c.last_price && <> {' · '}{T('Now', 'अभी')} {formatINR(c.last_price)}</>}
      </div>
      <div className="cr-time muted">
        {new Date(c.created_at).toLocaleString()}
        {c.status !== 'open' && c.closed_at && (
          <> · {T('Closed', 'बंद')} {new Date(c.closed_at).toLocaleString()}</>
        )}
      </div>
      <style>{`
        .call-row { padding: 12px; border-radius: 10px;
                     background: var(--bg-card, #fff);
                     border: 1px solid var(--border, #e2e8f0); margin-bottom: 8px; }
        .cr-line { display: flex; align-items: center; gap: 8px; }
        .cr-type { font-size: 11px; color: var(--text-muted); padding: 2px 6px;
                   border: 1px solid var(--border); border-radius: 4px; }
        .cr-badge { color: white; font-size: 11px; padding: 2px 8px;
                    border-radius: 999px; margin-left: auto; }
        .cr-detail { font-size: 13px; margin-top: 4px; }
        .cr-time { font-size: 11px; margin-top: 4px; }
      `}</style>
    </div>
  )
}
