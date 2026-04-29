// pages/Alerts.jsx
// ----------------
// Phase 5 alerts. Two sections: active alerts + fired events.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import BottomNav from '../components/BottomNav'
import { api, errMessage } from '../utils/api'
import { fmt, symLabel, timeAgo } from '../utils/format'
import { useT } from '../utils/i18n'

const KIND_OPTIONS = [
  { value: 'price_above', labelKey: 'alerts.kind.priceAbove' },
  { value: 'price_below', labelKey: 'alerts.kind.priceBelow' },
  { value: 'rsi_above',   labelKey: 'alerts.kind.rsiAbove' },
  { value: 'rsi_below',   labelKey: 'alerts.kind.rsiBelow' },
]

export default function Alerts() {
  const { t } = useT()
  const [alerts, setAlerts] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ symbol: '', kind: 'price_above', threshold: '', note: '' })
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [a, e] = await Promise.all([
        api.get('/api/alerts'),
        api.get('/api/alerts/events'),
      ])
      setAlerts(a.data)
      setEvents(e.data)
    } catch (e) {
      toast.error(errMessage(e))
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function create() {
    const sym = form.symbol.trim().toUpperCase()
    const thr = parseFloat(form.threshold)
    if (!sym || !thr) { toast.error('Fill symbol and threshold'); return }
    setCreating(true)
    try {
      const r = await api.get('/api/stocks/resolve', { params: { q: sym } })
      await api.post('/api/alerts', {
        symbol: r.data.symbol,
        kind: form.kind,
        threshold: thr,
        note: form.note || null,
      })
      toast.success('Alert created')
      setForm({ symbol: '', kind: 'price_above', threshold: '', note: '' })
      setShowCreate(false)
      load()
    } catch (e) {
      toast.error(errMessage(e))
    } finally { setCreating(false) }
  }

  async function toggle(id) {
    try {
      await api.post(`/api/alerts/${id}/toggle`)
      load()
    } catch (e) { toast.error(errMessage(e)) }
  }

  async function remove(id) {
    if (!confirm('Delete this alert?')) return
    try {
      await api.delete(`/api/alerts/${id}`)
      load()
    } catch (e) { toast.error(errMessage(e)) }
  }

  async function markSeen() {
    try {
      await api.post('/api/alerts/events/mark-seen')
      load()
    } catch (e) { toast.error(errMessage(e)) }
  }

  const unseenCount = events.filter(e => !e.seen).length

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28">
        <header className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="text-sm text-muted hover:text-text inline-flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Dashboard
          </Link>
          <h1 className="font-display text-[20px] font-bold tracking-tight">{t('alerts.title')}</h1>
          <div className="size-8" />
        </header>

        {/* Fired events first - urgency */}
        {events.length > 0 && (
          <div className="card mb-4 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-[14px]">
                Recent fires {unseenCount > 0 && <span className="ml-2 text-[10px] bg-warn/20 text-warn px-2 py-0.5 rounded-full">{unseenCount} new</span>}
              </h2>
              {unseenCount > 0 && (
                <button onClick={markSeen} className="text-[11px] text-muted hover:text-text">Mark all seen</button>
              )}
            </div>
            <ul className="space-y-2">
              {events.slice(0, 6).map(e => (
                <li key={e.id} className={`p-2 rounded-lg ${!e.seen ? 'bg-warn/5 border border-warn/20' : 'bg-card-soft border border-border-soft'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium truncate">{symLabel(e.symbol)}</div>
                      <div className="text-[11px] text-muted">{e.note}</div>
                    </div>
                    <div className="text-[10px] text-muted shrink-0">{timeAgo(e.fired_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Active alerts */}
        {loading ? (
          <div className="card animate-pulse-soft h-24" />
        ) : alerts.length === 0 ? (
          <div className="card text-center py-10 animate-fade-up">
            <div className="text-muted mb-4 text-[14px]">{t('alerts.empty')}</div>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-6">+ {t('alerts.create')}</button>
          </div>
        ) : (
          <>
            <ul className="space-y-2 animate-fade-up">
              {alerts.map(a => (
                <li key={a.id} className="card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display font-semibold text-[14px]">{symLabel(a.symbol)}</span>
                      {!a.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/15 text-muted">paused</span>}
                      {a.triggered_at && <span className="text-[10px] px-1.5 py-0.5 rounded bg-warn/15 text-warn">fired</span>}
                    </div>
                    <div className="text-[11px] text-muted numeric">
                      {t(KIND_OPTIONS.find(k => k.value === a.kind)?.labelKey || a.kind)} {fmt(a.threshold)}
                    </div>
                    {a.note && <div className="text-[10px] text-muted/70 mt-0.5 truncate">{a.note}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggle(a.id)}
                      className="text-[11px] px-2 py-1 rounded border border-border hover:bg-card-soft"
                    >
                      {a.active ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => remove(a.id)} className="text-muted hover:text-bear px-2 text-lg leading-none">×</button>
                  </div>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowCreate(true)} className="btn-secondary w-full mt-4">+ {t('alerts.create')}</button>
          </>
        )}

        {showCreate && (
          <CreateDialog
            form={form}
            setForm={setForm}
            onCancel={() => setShowCreate(false)}
            onSubmit={create}
            creating={creating}
            t={t}
          />
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function CreateDialog({ form, setForm, onCancel, onSubmit, creating, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 animate-fade-up" onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-semibold text-[15px] mb-4">{t('alerts.create')}</h3>

        <div className="space-y-3">
          <label className="block">
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Symbol</div>
            <input className="input" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="RELIANCE" />
          </label>
          <label className="block">
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Condition</div>
            <select
              className="input"
              value={form.kind}
              onChange={e => setForm({ ...form, kind: e.target.value })}
            >
              {KIND_OPTIONS.map(k => (
                <option key={k.value} value={k.value}>{t(k.labelKey)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1">
              Threshold {form.kind.startsWith('rsi') ? '(0-100)' : '(₹)'}
            </div>
            <input className="input" type="number" inputMode="decimal" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} />
          </label>
          <label className="block">
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Note (optional)</div>
            <input className="input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Take partial profits" maxLength={200} />
          </label>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button onClick={onSubmit} disabled={creating} className="btn-primary flex-1">
            {creating ? '…' : t('common.add')}
          </button>
        </div>

        <div className="mt-3 text-[10px] text-muted text-center">
          Alerts are checked every 5 min during market hours
        </div>
      </div>
    </div>
  )
}
