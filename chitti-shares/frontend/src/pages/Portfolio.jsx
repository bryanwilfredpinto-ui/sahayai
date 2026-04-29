// pages/Portfolio.jsx
// -------------------
// Phase 5 Portfolio Doctor.
// Lists holdings with live P&L and shows the doctor's verdict.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import BottomNav from '../components/BottomNav'
import { api, errMessage } from '../utils/api'
import { fmt, fmtPct, fmtCrores, symLabel } from '../utils/format'
import { useT } from '../utils/i18n'

export default function Portfolio() {
  const { t } = useT()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ symbol: '', qty: '', avg_buy_price: '' })
  const [adding, setAdding] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/api/portfolio')
      setData(r.data)
    } catch (e) {
      toast.error(errMessage(e))
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function add() {
    const sym = form.symbol.trim().toUpperCase()
    const qty = parseFloat(form.qty)
    const price = parseFloat(form.avg_buy_price)
    if (!sym || !qty || !price) {
      toast.error('Fill all fields')
      return
    }
    setAdding(true)
    try {
      const r = await api.get('/api/stocks/resolve', { params: { q: sym } })
      await api.post('/api/portfolio/holdings', {
        symbol: r.data.symbol, qty, avg_buy_price: price,
      })
      toast.success(`Added ${r.data.symbol}`)
      setForm({ symbol: '', qty: '', avg_buy_price: '' })
      setShowAdd(false)
      load()
    } catch (e) {
      toast.error(errMessage(e, `Could not find ${sym}`))
    } finally { setAdding(false) }
  }

  async function remove(id, sym) {
    if (!confirm(`Remove ${symLabel(sym)} from portfolio?`)) return
    try {
      await api.delete(`/api/portfolio/holdings/${id}`)
      load()
    } catch (e) { toast.error(errMessage(e)) }
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28">
        <header className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="text-sm text-muted hover:text-text inline-flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Dashboard
          </Link>
          <h1 className="font-display text-[20px] font-bold tracking-tight">{t('portfolio.title')}</h1>
          <div className="size-8" />
        </header>

        {loading ? (
          <Skeleton />
        ) : !data || data.holdings.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} t={t} />
        ) : (
          <>
            <Summary data={data} t={t} />
            <Doctor data={data} t={t} />
            <InsightsBox />
            <Holdings data={data} navigate={navigate} onRemove={remove} t={t} />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAdd(true)} className="btn-secondary flex-1">
                + {t('common.add')} {t('portfolio.title')}
              </button>
              <CsvUploadButton onUploaded={load} />
            </div>
          </>
        )}

        {showAdd && (
          <AddDialog
            form={form}
            setForm={setForm}
            onCancel={() => setShowAdd(false)}
            onSubmit={add}
            adding={adding}
            t={t}
          />
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function Summary({ data, t }) {
  const up = (data.total_pnl || 0) >= 0
  return (
    <div className="card mb-4 animate-fade-up">
      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('portfolio.invested')} value={fmtCrores(data.total_invested)} />
        <Stat label={t('portfolio.current')} value={fmtCrores(data.total_current)} />
        <Stat
          label={t('portfolio.pnl')}
          value={fmtCrores(data.total_pnl)}
          sub={fmtPct(data.total_pnl_pct)}
          tone={up ? 'bull' : 'bear'}
        />
      </div>
    </div>
  )
}

function Stat({ label, value, sub, tone }) {
  const toneCls = tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : ''
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted mb-1">{label}</div>
      <div className={`font-display text-[15px] font-semibold numeric ${toneCls}`}>{value}</div>
      {sub && <div className={`text-[11px] numeric ${toneCls}`}>{sub}</div>}
    </div>
  )
}

function Doctor({ data, t }) {
  const d = data.doctor || {}
  const verdictTone =
    d.verdict === 'Healthy' ? 'text-bull border-bull/30 bg-bull/5' :
    d.verdict === 'Mostly healthy' ? 'text-bull/80 border-bull/20 bg-bull/5' :
    d.verdict === 'Significant issues' ? 'text-bear border-bear/30 bg-bear/5' :
    d.verdict === 'Needs attention' ? 'text-warn border-warn/30 bg-warn/5' :
    'text-muted border-border'
  return (
    <div className="card mb-4 animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-[15px]">{t('portfolio.doctor')}</h2>
        <div className="flex items-center gap-2">
          <StarRating value={d.star_rating || 0} />
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${verdictTone}`}>
            {d.verdict || '—'}
          </span>
        </div>
      </div>
      {d.concerns && d.concerns.length > 0 && (
        <div className="mb-3">
          <div className="text-[11px] uppercase tracking-wide text-bear mb-1.5">⚠ Concerns</div>
          <ul className="space-y-1.5">
            {d.concerns.map((c, i) => (
              <li key={i} className="text-[13px] text-text/85 leading-snug">• {c}</li>
            ))}
          </ul>
        </div>
      )}
      {d.wins && d.wins.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-bull mb-1.5">✓ Strengths</div>
          <ul className="space-y-1.5">
            {d.wins.map((w, i) => (
              <li key={i} className="text-[13px] text-text/85 leading-snug">• {w}</li>
            ))}
          </ul>
        </div>
      )}
      {(!d.concerns || d.concerns.length === 0) && (!d.wins || d.wins.length === 0) && (
        <div className="text-[13px] text-muted">No specific notes.</div>
      )}
    </div>
  )
}

function Holdings({ data, navigate, onRemove, t }) {
  return (
    <div>
      <h2 className="font-display font-semibold text-[14px] mb-2">Holdings ({data.holdings.length})</h2>
      <ul className="space-y-2 animate-fade-up">
        {data.holdings.map((h) => {
          const up = (h.pnl || 0) >= 0
          return (
            <li
              key={h.id}
              className="card card-hover cursor-pointer"
              onClick={() => navigate(`/stock/${encodeURIComponent(h.symbol)}`)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display font-semibold text-[14px] truncate">{symLabel(h.symbol)}</div>
                  <div className="text-[11px] text-muted numeric">
                    {fmt(h.qty, 0)} × ₹{fmt(h.avg_buy_price)} = {fmtCrores(h.invested)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold numeric">{fmtCrores(h.current_value)}</div>
                  <div className={`text-[11px] numeric ${up ? 'text-bull' : 'text-bear'}`}>
                    {fmtPct(h.pnl_pct)}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(h.id, h.symbol) }}
                  className="text-muted hover:text-bear shrink-0 px-2"
                  title={t('common.delete')}
                >×</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function AddDialog({ form, setForm, onCancel, onSubmit, adding, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 animate-fade-up" onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-semibold text-[15px] mb-4">Add Holding</h3>

        <div className="space-y-3">
          <Field label="Symbol">
            <input className="input" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="RELIANCE" />
          </Field>
          <Field label="Quantity">
            <input className="input" type="number" inputMode="decimal" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} placeholder="10" />
          </Field>
          <Field label="Avg Buy Price (₹)">
            <input className="input" type="number" inputMode="decimal" value={form.avg_buy_price} onChange={e => setForm({ ...form, avg_buy_price: e.target.value })} placeholder="2500" />
          </Field>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button onClick={onSubmit} disabled={adding} className="btn-primary flex-1">
            {adding ? '…' : t('common.add')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wide text-muted mb-1">{label}</div>
      {children}
    </label>
  )
}

function EmptyState({ onAdd, t }) {
  return (
    <div className="card text-center py-10 animate-fade-up">
      <div className="text-muted mb-4 text-[14px]">No holdings yet. Add your stocks to see P&L and Doctor's verdict.</div>
      <button onClick={onAdd} className="btn-primary px-6">+ Add Holding</button>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="card animate-pulse-soft h-24" />
      <div className="card animate-pulse-soft h-32" />
      <div className="card animate-pulse-soft h-20" />
    </div>
  )
}

// ===== Phase 6: star rating, CSV upload, AI Insights =====

function StarRating({ value }) {
  const v = Math.max(0, Math.min(5, value || 0))
  return (
    <div className="flex items-center gap-0.5" title={`${v}/5`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= v ? 'text-yellow-400' : 'text-border-soft'}>★</span>
      ))}
    </div>
  )
}

function CsvUploadButton({ onUploaded }) {
  const [busy, setBusy] = useState(false)
  const onChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await api.post('/api/portfolio/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(`Imported ${r.data.imported} holdings (skipped ${r.data.skipped})`)
      onUploaded?.()
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }
  return (
    <label className="btn-secondary cursor-pointer flex-1 text-center">
      {busy ? 'Uploading…' : '📥 Import Zerodha CSV'}
      <input type="file" accept=".csv" onChange={onChange}
             className="hidden" disabled={busy} />
    </label>
  )
}

function InsightsBox() {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fetchInsights = async () => {
    setBusy(true); setErr('')
    try {
      const r = await api.get('/api/portfolio/insights')
      setData(r.data)
    } catch (e) {
      setErr(errMessage(e))
    } finally { setBusy(false) }
  }
  return (
    <div className="card mb-4 animate-fade-up">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-semibold text-[15px]">🤖 AI Insights</h2>
        <button onClick={fetchInsights} disabled={busy}
                className="btn-ghost text-xs px-3 py-1.5">
          {busy ? '…' : (data ? 'Refresh' : 'Get insights')}
        </button>
      </div>
      {err && <div className="text-[12px] text-bear">{err}</div>}
      {data?.recommendations_text && (
        <div className="text-[13px] whitespace-pre-wrap leading-relaxed">{data.recommendations_text}</div>
      )}
      {data?.note && <div className="text-[12px] text-muted">{data.note}</div>}
    </div>
  )
}
