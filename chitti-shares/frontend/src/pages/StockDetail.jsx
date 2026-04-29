// pages/StockDetail.jsx
// ---------------------
// Deep-dive page for a single stock. Shows fundamentals scorecard,
// quarterly results, technical indicators, and a custom rule evaluator.
// Also lets the user add to watchlist / create alert / log a call.
//
// Route: /stock/:symbol  (URL-encoded canonical symbol)

import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import BottomNav from '../components/BottomNav'
import { api, errMessage } from '../utils/api'
import { fmt, fmtPct, fmtMarketCap, symLabel } from '../utils/format'
import { useT } from '../utils/i18n'

const TIMEFRAMES = [
  { value: 'day', label: 'D' },
  { value: 'week', label: 'W' },
  { value: 'month', label: 'M' },
]

export default function StockDetail() {
  const { symbol: encSymbol } = useParams()
  const symbol = decodeURIComponent(encSymbol || '')
  const { t } = useT()
  const navigate = useNavigate()

  const [tab, setTab] = useState('fundamentals')
  const [tf, setTf] = useState('day')

  const [quote, setQuote] = useState(null)
  const [fund, setFund] = useState(null)
  const [qtr, setQtr] = useState(null)
  const [tech, setTech] = useState(null)
  const [loading, setLoading] = useState({ quote: true })
  const [error, setError] = useState(null)

  // Lazy load each tab's data
  useEffect(() => {
    if (!symbol) return
    setLoading(l => ({ ...l, quote: true }))
    api.get(`/api/stocks/${encodeURIComponent(symbol)}/quote`)
      .then(r => setQuote(r.data))
      .catch(e => setError(errMessage(e)))
      .finally(() => setLoading(l => ({ ...l, quote: false })))
  }, [symbol])

  useEffect(() => {
    if (tab === 'fundamentals' && !fund) {
      setLoading(l => ({ ...l, fund: true }))
      api.get(`/api/stocks/${encodeURIComponent(symbol)}/fundamentals`)
        .then(r => setFund(r.data))
        .catch(e => toast.error(errMessage(e)))
        .finally(() => setLoading(l => ({ ...l, fund: false })))
    }
    if (tab === 'quarterly' && !qtr) {
      setLoading(l => ({ ...l, qtr: true }))
      api.get(`/api/stocks/${encodeURIComponent(symbol)}/quarterly`)
        .then(r => setQtr(r.data))
        .catch(e => toast.error(errMessage(e)))
        .finally(() => setLoading(l => ({ ...l, qtr: false })))
    }
  }, [tab, symbol])  // eslint-disable-line

  // Refetch technical when timeframe changes
  useEffect(() => {
    if (tab !== 'technical') return
    setLoading(l => ({ ...l, tech: true }))
    setTech(null)
    api.get(`/api/technical/${encodeURIComponent(symbol)}/analyze`, { params: { timeframe: tf } })
      .then(r => setTech(r.data))
      .catch(e => toast.error(errMessage(e)))
      .finally(() => setLoading(l => ({ ...l, tech: false })))
  }, [tab, tf, symbol])

  async function addToWatchlist() {
    try {
      await api.post('/api/watchlist', { symbol })
      toast.success('Added to watchlist')
    } catch (e) { toast.error(errMessage(e)) }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <div className="text-bear mb-2">{error}</div>
          <button onClick={() => navigate(-1)} className="btn-secondary">{t('common.back')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28">

        <header className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="text-sm text-muted hover:text-text inline-flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {t('common.back')}
          </button>
          <h1 className="font-display font-bold text-[18px] truncate max-w-[60%] text-center">{symLabel(symbol)}</h1>
          <button onClick={addToWatchlist} className="text-accent text-sm" title="Add to watchlist">★</button>
        </header>

        {/* Quote header */}
        {loading.quote ? (
          <div className="card animate-pulse-soft h-24 mb-4" />
        ) : quote ? (
          <div className="card mb-4 animate-fade-up">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] text-muted">{symbol}</div>
                <div className="font-display text-[28px] font-bold numeric">₹{fmt(quote.last_price)}</div>
              </div>
              <div className="text-right">
                {quote.prev_close && quote.last_price && (
                  <>
                    <div className={`numeric font-semibold ${quote.last_price >= quote.prev_close ? 'text-bull' : 'text-bear'}`}>
                      {fmtPct((quote.last_price - quote.prev_close) / quote.prev_close * 100)}
                    </div>
                    <div className="text-[11px] text-muted numeric">
                      O: ₹{fmt(quote.day_open)} · H: ₹{fmt(quote.day_high)} · L: ₹{fmt(quote.day_low)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {[
            { key: 'fundamentals', label: t('stock.fundamentals') },
            { key: 'quarterly',    label: t('stock.quarterly') },
            { key: 'technical',    label: t('stock.technical') },
            { key: 'rules',        label: 'Custom Rule' },
          ].map(x => (
            <button
              key={x.key}
              onClick={() => setTab(x.key)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors ${
                tab === x.key
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'border-border text-muted hover:text-text hover:border-border-soft'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>

        {tab === 'fundamentals' && <FundamentalsTab fund={fund} loading={loading.fund} />}
        {tab === 'quarterly' && <QuarterlyTab qtr={qtr} loading={loading.qtr} />}
        {tab === 'technical' && <TechnicalTab tech={tech} loading={loading.tech} tf={tf} setTf={setTf} symbol={symbol} />}
        {tab === 'rules' && <RulesTab symbol={symbol} tf={tf} setTf={setTf} />}
      </div>
      <BottomNav />
    </div>
  )
}

// ============= Fundamentals =============

function FundamentalsTab({ fund, loading }) {
  if (loading) return <div className="card animate-pulse-soft h-64" />
  if (!fund) return <div className="card text-center text-muted">No fundamentals available</div>

  const card = fund.scorecard || {}
  return (
    <div className="space-y-3 animate-fade-up">
      <div className="card">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="font-display font-semibold text-[15px] truncate">{fund.name}</div>
            <div className="text-[11px] text-muted">{fund.sector} · {fund.industry}</div>
          </div>
          <GradeBadge grade={card.overall_grade} score={card.overall_score} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <KV label="Market Cap" value={fmtMarketCap(fund.market_cap)} />
          <KV label="52W High / Low" value={`₹${fmt(fund.fifty_two_week_high, 0)} / ₹${fmt(fund.fifty_two_week_low, 0)}`} />
        </div>
      </div>

      <div className="card">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-3">Scorecard</div>
        <ul className="space-y-2.5">
          {(card.metrics || []).map(m => (
            <li key={m.name} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] text-text">{m.label}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="numeric text-[12px] text-text/85">
                  {m.value == null ? '——' : fmt(m.value)} {m.unit}
                </span>
                <GradeChip grade={m.grade} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function GradeBadge({ grade, score }) {
  if (!grade || grade === '—') return null
  const tone =
    grade.startsWith('A') ? 'bg-bull/15 text-bull border-bull/30' :
    grade === 'B' ? 'bg-warn/10 text-warn border-warn/30' :
    grade === 'C' ? 'bg-warn/15 text-warn border-warn/40' :
    'bg-bear/15 text-bear border-bear/30'
  return (
    <div className={`px-3 py-1.5 rounded-xl border text-center shrink-0 ${tone}`}>
      <div className="font-display font-bold text-[18px] leading-none">{grade}</div>
      {score != null && <div className="text-[10px] mt-0.5">{score}/100</div>}
    </div>
  )
}

function GradeChip({ grade }) {
  if (!grade || grade === '—') return <span className="text-muted text-[11px]">——</span>
  const tone =
    grade.startsWith('A') ? 'bg-bull/15 text-bull' :
    grade === 'B' ? 'bg-warn/10 text-warn' :
    grade === 'C' ? 'bg-warn/15 text-warn' :
    'bg-bear/15 text-bear'
  return <span className={`text-[10px] font-semibold w-7 h-5 rounded flex items-center justify-center ${tone}`}>{grade}</span>
}

function KV({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="numeric text-[13px] text-text">{value}</div>
    </div>
  )
}

// ============= Quarterly =============

function QuarterlyTab({ qtr, loading }) {
  if (loading) return <div className="card animate-pulse-soft h-64" />
  if (!qtr || !qtr.all || qtr.all.length === 0) {
    return <div className="card text-center text-muted">No quarterly data available</div>
  }

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted">Quality Rating</div>
            <Stars rating={qtr.star_rating} />
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted mb-0.5">Trends</div>
            <div className="text-[11px] flex gap-2">
              <TrendBadge label="Revenue" trend={qtr.revenue_trend} />
              <TrendBadge label="Profit" trend={qtr.profit_trend} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-3">Last 8 Quarters</div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[11px]">
            <thead className="text-muted">
              <tr className="text-left">
                <th className="px-1 py-1.5 font-medium">Quarter</th>
                <th className="px-1 py-1.5 font-medium text-right">Revenue</th>
                <th className="px-1 py-1.5 font-medium text-right">Net Profit</th>
                <th className="px-1 py-1.5 font-medium text-right">Op. Income</th>
              </tr>
            </thead>
            <tbody>
              {qtr.all.map((q, i) => (
                <tr key={i} className="border-t border-border-soft/40">
                  <td className="px-1 py-2 text-text/85">{q.quarter}</td>
                  <td className="px-1 py-2 text-right numeric">{q.revenue == null ? '——' : compactCr(q.revenue)}</td>
                  <td className={`px-1 py-2 text-right numeric ${q.net_income == null ? '' : q.net_income >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {q.net_income == null ? '——' : compactCr(q.net_income)}
                  </td>
                  <td className="px-1 py-2 text-right numeric">{q.operating_income == null ? '——' : compactCr(q.operating_income)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function compactCr(n) {
  if (n == null) return '——'
  const cr = n / 1e7
  if (Math.abs(cr) >= 1000) return `${(cr / 1000).toFixed(1)}k Cr`
  return `${cr.toFixed(0)} Cr`
}

function Stars({ rating }) {
  if (rating == null) return <div className="text-muted">——</div>
  return (
    <div className="font-display font-bold text-[18px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-warn' : 'text-border-soft'}>★</span>
      ))}
    </div>
  )
}

function TrendBadge({ label, trend }) {
  const t = trend || '—'
  const tone =
    t === 'up' ? 'text-bull' :
    t === 'down' ? 'text-bear' :
    t === 'flat' ? 'text-muted' : 'text-muted'
  const arrow = t === 'up' ? '↑' : t === 'down' ? '↓' : t === 'flat' ? '→' : '——'
  return (
    <span className={`${tone}`}>
      {label} {arrow}
    </span>
  )
}

// ============= Technical =============

function TechnicalTab({ tech, loading, tf, setTf, symbol }) {
  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex gap-1 mb-1">
        {TIMEFRAMES.map(x => (
          <button
            key={x.value}
            onClick={() => setTf(x.value)}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold border ${
              tf === x.value ? 'bg-accent/15 text-accent border-accent/30' : 'border-border text-muted'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card animate-pulse-soft h-64" />
      ) : !tech ? (
        <div className="card text-center text-muted">No technical data</div>
      ) : (
        <>
          <div className="card">
            <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Summary</div>
            <SummaryBadge summary={tech.indicators?.summary} />
            {tech.indicators?.votes && (
              <div className="text-[11px] text-muted mt-2">
                {tech.indicators.votes.up}↑ / {tech.indicators.votes.down}↓ / {tech.indicators.votes.total} signals
              </div>
            )}
          </div>

          <div className="card">
            <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Indicators</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
              <IndRow label="SMA 20" value={tech.indicators?.sma_20} />
              <IndRow label="SMA 50" value={tech.indicators?.sma_50} />
              <IndRow label="SMA 200" value={tech.indicators?.sma_200} />
              <IndRow label="EMA 13" value={tech.indicators?.ema_13} />
              <IndRow label="RSI(14)" value={tech.indicators?.rsi_14} highlight={
                tech.indicators?.rsi_14 > 70 ? 'overbought' :
                tech.indicators?.rsi_14 < 30 ? 'oversold' : null
              } />
              <IndRow label="MACD Hist" value={tech.indicators?.macd_hist} highlight={
                tech.indicators?.macd_hist > 0 ? 'bull' : tech.indicators?.macd_hist < 0 ? 'bear' : null
              } />
              <IndRow label="Williams %R" value={tech.indicators?.williams_r_14} />
              <IndRow label="Force Index" value={tech.indicators?.force_index_13} />
              <IndRow label="Bull Power" value={tech.indicators?.bull_power} />
              <IndRow label="Bear Power" value={tech.indicators?.bear_power} />
            </div>
          </div>

          <TradePlanCard plan={tech.trade_plan} latestClose={tech.latest_close} />
          <ConsensusCard symbol={symbol} />

          <CallActions symbol={symbol} tf={tf} entry={tech.latest_close} plan={tech.trade_plan} />
        </>
      )}
    </div>
  )
}

function TradePlanCard({ plan, latestClose }) {
  if (!plan) return null
  const sideTone = plan.side === 'BUY'
    ? 'bg-bull/10 text-bull border-bull/30'
    : 'bg-bear/10 text-bear border-bear/30'
  return (
    <div className="card">
      <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Suggested Trade Plan</div>
      <div className="flex items-center justify-between mb-3">
        <span className={`px-3 py-1 rounded-full text-[12px] font-semibold border ${sideTone}`}>
          {plan.side}
        </span>
        <span className="text-[11px] text-muted">
          ATR(14): {fmt(plan.atr_14)}
          {plan.risk_reward_ratio && <> · R:R 1:{fmt(plan.risk_reward_ratio)}</>}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-[12px]">
        <div>
          <div className="text-muted text-[10px] uppercase tracking-wide">Entry zone</div>
          <div className="numeric font-semibold">₹{fmt(plan.entry_low)} – ₹{fmt(plan.entry_high)}</div>
        </div>
        <div>
          <div className="text-muted text-[10px] uppercase tracking-wide">Target</div>
          <div className="numeric font-semibold text-bull">₹{fmt(plan.target)}</div>
        </div>
        <div>
          <div className="text-muted text-[10px] uppercase tracking-wide">Stop Loss</div>
          <div className="numeric font-semibold text-bear">₹{fmt(plan.stop_loss)}</div>
        </div>
      </div>
    </div>
  )
}

function ConsensusCard({ symbol }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setBusy(true)
    try {
      const r = await api.get(`/api/technical/${encodeURIComponent(symbol)}/consensus`)
      setData(r.data)
    } catch { /* silent */ }
    finally { setBusy(false) }
  }

  useEffect(() => { load() }, [symbol])

  if (!data) return (
    <div className="card text-[12px] text-muted">
      {busy ? 'Computing multi-timeframe consensus…' : 'Loading consensus…'}
    </div>
  )

  const verdict = data.verdict
  const verdictTone =
    verdict === 'BUY' ? 'bg-bull/15 text-bull border-bull/40' :
    verdict === 'SELL' ? 'bg-bear/15 text-bear border-bear/40' :
    'bg-warn/15 text-warn border-warn/30'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wide text-muted">Multi-Timeframe Consensus</div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${verdictTone}`}>
          {verdict}
        </span>
      </div>
      <div className="text-[11px] text-muted mb-2">{data.reason}</div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {Object.entries(data.by_timeframe || {}).map(([tf, info]) => (
          <div key={tf} className="border border-border-soft rounded-md p-2">
            <div className="uppercase text-muted">{tf}</div>
            <div className="font-semibold">{info?.summary || info?.error || '—'}</div>
            {info?.rsi_14 != null && <div className="text-muted">RSI {fmt(info.rsi_14)}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryBadge({ summary }) {
  if (!summary) return null
  const tone =
    summary === 'Strong Buy' ? 'bg-bull/20 text-bull border-bull/40' :
    summary === 'Buy' ? 'bg-bull/10 text-bull border-bull/30' :
    summary === 'Strong Sell' ? 'bg-bear/20 text-bear border-bear/40' :
    summary === 'Sell' ? 'bg-bear/10 text-bear border-bear/30' :
    'bg-muted/15 text-muted border-border'
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-semibold border ${tone}`}>
      {summary}
    </span>
  )
}

function IndRow({ label, value, highlight }) {
  const tone =
    highlight === 'bull' ? 'text-bull' :
    highlight === 'bear' ? 'text-bear' :
    highlight === 'overbought' ? 'text-bear' :
    highlight === 'oversold' ? 'text-bull' : 'text-text/85'
  return (
    <div className="flex items-center justify-between border-b border-border-soft/30 pb-1.5">
      <span className="text-muted">{label}</span>
      <span className={`numeric ${tone}`}>{value == null ? '——' : fmt(value)}</span>
    </div>
  )
}

// ============= Call action =============

function CallActions({ symbol, tf, entry, plan }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ call_type: 'BUY', target: '', stop_loss: '', rationale: '' })
  const [saving, setSaving] = useState(false)

  // Pre-fill from plan when opening
  useEffect(() => {
    if (open && plan) {
      setForm(f => ({
        ...f,
        call_type: plan.side || f.call_type,
        target: f.target || (plan.target ? String(plan.target) : ''),
        stop_loss: f.stop_loss || (plan.stop_loss ? String(plan.stop_loss) : ''),
      }))
    }
  }, [open, plan])

  async function save() {
    if (!entry) { toast.error('No price available'); return }
    setSaving(true)
    try {
      await api.post('/api/calls', {
        symbol, call_type: form.call_type, timeframe: tf,
        entry_price: entry,
        target: form.target ? parseFloat(form.target) : null,
        stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
        rationale: form.rationale || null,
      })
      toast.success('Call logged')
      setOpen(false)
      setForm({ call_type: 'BUY', target: '', stop_loss: '', rationale: '' })
    } catch (e) {
      toast.error(errMessage(e))
    } finally { setSaving(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">+ Log Call</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 animate-fade-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-[15px] mb-4">Log Call · {symLabel(symbol)}</h3>
            <div className="space-y-3">
              <label className="block">
                <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Type</div>
                <div className="flex gap-2">
                  {['BUY', 'SELL', 'WAIT'].map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, call_type: c })}
                      className={`flex-1 py-2 rounded-lg border text-[12px] font-semibold ${
                        form.call_type === c
                          ? c === 'BUY' ? 'bg-bull/15 text-bull border-bull/30' :
                            c === 'SELL' ? 'bg-bear/15 text-bear border-bear/30' :
                            'bg-warn/15 text-warn border-warn/30'
                          : 'border-border text-muted'
                      }`}
                    >{c}</button>
                  ))}
                </div>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Target (₹)</div>
                  <input className="input" type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
                </label>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Stop Loss (₹)</div>
                  <input className="input" type="number" value={form.stop_loss} onChange={e => setForm({ ...form, stop_loss: e.target.value })} />
                </label>
              </div>
              <label className="block">
                <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Rationale</div>
                <textarea className="input" rows={2} value={form.rationale} onChange={e => setForm({ ...form, rationale: e.target.value })} maxLength={2000} />
              </label>
              <div className="text-[10px] text-muted">Entry: ₹{fmt(entry)} (current close on {tf})</div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? '…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============= Custom rules =============

function RulesTab({ symbol, tf, setTf }) {
  const [examples, setExamples] = useState([])
  const [rule, setRule] = useState('RSI(14) > 50 AND MACD_HIST > 0')
  const [result, setResult] = useState(null)
  const [evaluating, setEvaluating] = useState(false)

  useEffect(() => {
    api.get('/api/technical/rules/examples')
      .then(r => setExamples(r.data.examples))
      .catch(() => {})
  }, [])

  async function run() {
    setEvaluating(true)
    setResult(null)
    try {
      const r = await api.post('/api/technical/rules/evaluate', {
        symbol, rule_text: rule, timeframe: tf,
      })
      setResult(r.data)
    } catch (e) {
      toast.error(errMessage(e))
    } finally { setEvaluating(false) }
  }

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex gap-1 mb-1">
        {TIMEFRAMES.map(x => (
          <button
            key={x.value}
            onClick={() => setTf(x.value)}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold border ${
              tf === x.value ? 'bg-accent/15 text-accent border-accent/30' : 'border-border text-muted'
            }`}
          >{x.label}</button>
        ))}
      </div>

      <div className="card">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Custom Rule</div>
        <textarea
          value={rule}
          onChange={e => setRule(e.target.value)}
          className="input font-mono text-[12px]"
          rows={3}
          maxLength={400}
        />
        <button onClick={run} disabled={evaluating || !rule.trim()} className="btn-primary w-full mt-3">
          {evaluating ? 'Evaluating…' : 'Evaluate'}
        </button>
      </div>

      {result && (
        <div className="card animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wide text-muted">Result</div>
            <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-bold border ${
              result.result ? 'bg-bull/15 text-bull border-bull/30' : 'bg-bear/15 text-bear border-bear/30'
            }`}>
              {result.result ? 'TRUE' : 'FALSE'}
            </span>
          </div>
          <ul className="space-y-2 text-[12px]">
            {(result.trace || []).map((tr, i) => (
              <li key={i} className="bg-card-soft border border-border-soft rounded-lg px-3 py-2">
                <div className="font-mono text-[11px] text-text/85 mb-1">
                  {tr.left} {tr.op} {tr.right}
                </div>
                <div className="text-[11px] text-muted numeric">
                  = {tr.left_value == null ? '——' : fmt(tr.left_value)} {tr.op} {tr.right_value == null ? '——' : fmt(tr.right_value)}
                  {' → '}
                  <span className={tr.result ? 'text-bull' : 'text-bear'}>
                    {tr.result == null ? '——' : tr.result ? 'true' : 'false'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {examples.length > 0 && (
        <div className="card">
          <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Try an example</div>
          <ul className="space-y-1.5">
            {examples.map((e, i) => (
              <li key={i}>
                <button
                  onClick={() => setRule(e.rule)}
                  className="w-full text-left p-2 rounded-md border border-border-soft hover:bg-card-soft transition-colors"
                >
                  <div className="text-[12px] font-medium">{e.name}</div>
                  <div className="text-[11px] font-mono text-muted">{e.rule}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <SavedRulesSection
        currentRule={rule}
        onLoad={(r) => setRule(r.rule_text)}
        symbol={symbol}
        tf={tf}
        onResult={setResult}
      />
    </div>
  )
}

function SavedRulesSection({ currentRule, onLoad, symbol, tf, onResult }) {
  const [saved, setSaved] = useState([])
  const [name, setName] = useState('')
  const [signal, setSignal] = useState('BUY')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const r = await api.get('/api/technical/rules/saved')
      setSaved(r.data || [])
    } catch { /* silent */ }
  }
  useEffect(() => { load() }, [])

  const saveRule = async () => {
    if (!name.trim() || !currentRule.trim()) {
      toast.error('Name + rule required'); return
    }
    setBusy(true)
    try {
      await api.post('/api/technical/rules/saved', {
        name: name.trim(), rule_text: currentRule, signal,
      })
      toast.success('Rule saved')
      setName('')
      load()
    } catch (e) {
      toast.error(errMessage(e))
    } finally { setBusy(false) }
  }

  const deleteRule = async (id) => {
    try {
      await api.delete(`/api/technical/rules/saved/${id}`)
      load()
    } catch (e) { toast.error(errMessage(e)) }
  }

  const runSaved = async (id) => {
    try {
      const r = await api.post(`/api/technical/rules/saved/${id}/run`,
                               { symbol, timeframe: tf })
      onResult({
        result: r.data.result,
        trace: r.data.trace,
      })
      toast.success(`Ran "${r.data.rule.name}"`)
    } catch (e) { toast.error(errMessage(e)) }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-wide text-muted">Saved Rules ({saved.length}/5)</div>
      </div>
      <div className="grid grid-cols-[1fr_80px_auto] gap-2 mb-3">
        <input className="input text-[12px]" placeholder="Rule name…"
               value={name} onChange={e => setName(e.target.value)} maxLength={80} />
        <select className="input text-[12px]" value={signal}
                onChange={e => setSignal(e.target.value)}>
          <option>BUY</option><option>SELL</option><option>WAIT</option>
        </select>
        <button onClick={saveRule} disabled={busy || saved.length >= 5}
                className="btn-secondary px-3 text-[12px]">Save</button>
      </div>
      {saved.length === 0 ? (
        <div className="text-[12px] text-muted">No saved rules yet. Use the box above and click Save.</div>
      ) : (
        <ul className="space-y-1.5">
          {saved.map(r => (
            <li key={r.id} className="border border-border-soft rounded-md p-2 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium">{r.name}
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                    r.signal === 'BUY' ? 'bg-bull/15 text-bull' :
                    r.signal === 'SELL' ? 'bg-bear/15 text-bear' :
                    'bg-warn/15 text-warn'
                  }`}>{r.signal}</span>
                </div>
                <div className="text-[11px] font-mono text-muted truncate">{r.rule_text}</div>
              </div>
              <button onClick={() => onLoad(r)}
                      className="text-[11px] text-accent">Load</button>
              <button onClick={() => runSaved(r.id)}
                      className="text-[11px] text-accent">Run</button>
              <button onClick={() => deleteRule(r.id)}
                      className="text-[11px] text-bear">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
