// components/IndexCard.jsx
// ------------------------
// Live Nifty/Sensex card. Wired to /api/market/indices.

import Card from './Card'

export default function IndexCard({ data, loading, error, onRefresh, marketOpen }) {
  // Loading skeleton
  if (loading && !data) {
    return (
      <Card title={'—'} subtitle={'Loading'} showSpeaker={false}>
        <SkeletonBody />
      </Card>
    )
  }

  // Error state - clear, actionable, never silent
  if (error && !data) {
    return (
      <Card title="Market data" showSpeaker={false}
            trailing={<span className="chip-bear">Error</span>}>
        <div className="text-sm text-bear/90">{readableError(error)}</div>
        <button onClick={onRefresh} className="btn-ghost mt-3 text-xs">Try again</button>
      </Card>
    )
  }

  if (!data) return null

  const isUp = data.change_pct >= 0
  const changeColor = isUp ? 'text-bull' : 'text-bear'
  const arrow = isUp ? '▲' : '▼'

  const signalChip =
    data.signal === 'Bullish' ? 'chip-bull' :
    data.signal === 'Bearish' ? 'chip-bear' : 'chip-muted'

  return (
    <Card
      title={data.name}
      subtitle={data.exchange}
      trailing={
        <div className="flex items-center gap-2">
          <span className={signalChip}>{data.signal}</span>
          {!marketOpen && <span className="chip-muted">Closed</span>}
        </div>
      }
      onSpeak={() => speakCard(data)}
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <div className="numeric text-[28px] font-semibold tracking-tight tabular-nums">
            {fmt(data.value)}
          </div>
          <div className={`numeric text-sm font-semibold ${changeColor}`}>
            {arrow} {fmtSigned(data.change_pts)} ({fmtSignedPct(data.change_pct)})
          </div>
        </div>

        {/* Mini sparkline-ish band: support → price → resistance */}
        <SupportResistanceBar
          support={data.support}
          resistance={data.resistance}
          price={data.value}
        />

        <div className="grid grid-cols-3 text-center text-[11px] uppercase tracking-wider">
          <Stat label="Support" value={data.support} mono color="text-bull/90" />
          <Stat label="50 DMA"   value={data.sma_50}  mono color="text-muted" />
          <Stat label="Resistance" value={data.resistance} mono color="text-bear/90" />
        </div>

        <button
          onClick={onRefresh}
          className="text-[11px] text-muted hover:text-text inline-flex items-center gap-1.5"
        >
          <RefreshIcon /> Refresh
        </button>
      </div>
    </Card>
  )
}

// ----------------------------------------------------------------

function SupportResistanceBar({ support, resistance, price }) {
  if (support == null || resistance == null) return null
  const pct = Math.max(2, Math.min(98,
    ((price - support) / (resistance - support)) * 100
  ))
  return (
    <div className="relative h-2 rounded-full bg-surface-2 border border-border-soft overflow-visible">
      <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-bull/30 via-muted/20 to-bear/30" />
      <div
        className="absolute -top-1 size-4 rounded-full bg-text border-2 border-bg shadow-glow"
        style={{ left: `calc(${pct}% - 8px)` }}
        title={`${price}`}
      />
    </div>
  )
}

function Stat({ label, value, mono = false, color = '' }) {
  return (
    <div>
      <div className="text-muted/80 text-[11px]">{label}</div>
      <div className={`mt-0.5 text-[13px] ${color} ${mono ? 'numeric' : ''}`}>
        {value == null ? '——' : fmt(value)}
      </div>
    </div>
  )
}

function SkeletonBody() {
  return (
    <div className="space-y-3 animate-pulse-soft">
      <div className="h-7 w-32 bg-border-soft rounded" />
      <div className="h-2 w-full bg-border-soft rounded-full" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => <div key={i} className="h-6 bg-border-soft/70 rounded" />)}
      </div>
    </div>
  )
}

function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 11-3-6.7" /><path d="M21 4v5h-5" />
    </svg>
  )
}

// ----- Formatting helpers -----
function fmt(n) {
  if (n == null) return '——'
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })
}
function fmtSigned(n) {
  if (n == null) return '——'
  const sign = n >= 0 ? '+' : ''
  return sign + fmt(n)
}
function fmtSignedPct(n) {
  if (n == null) return '——'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${Number(n).toFixed(2)}%`
}

function readableError(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  return err?.message || 'Could not load market data'
}

function speakCard(data) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const text =
    `${data.name} is at ${Math.round(data.value)}, ` +
    `${data.change_pct >= 0 ? 'up' : 'down'} ${Math.abs(data.change_pct).toFixed(2)} percent. ` +
    `Signal is ${data.signal}. ` +
    (data.support ? `Support near ${Math.round(data.support)}, ` : '') +
    (data.resistance ? `resistance near ${Math.round(data.resistance)}.` : '')
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate = 1.0
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utt)
}
