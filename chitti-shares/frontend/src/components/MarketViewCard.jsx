// components/MarketViewCard.jsx
// -----------------------------
// Chitti's AI summary card. Wired to /api/market/view.

import Card from './Card'

export default function MarketViewCard({ data, loading, error, onRefresh }) {
  return (
    <Card
      title="Chitti Market View"
      subtitle="Daily AI summary by Chitti"
      trailing={
        data && (
          <span className={
            data.confidence === 'high' ? 'chip-bull' :
            data.confidence === 'low' ? 'chip-muted' : 'chip-bull/0 bg-accent/15 text-accent chip'
          }>
            {data.confidence} confidence
          </span>
        )
      }
      onSpeak={() => speak(data?.summary)}
    >
      {loading && !data && (
        <div className="rounded-xl bg-surface-2 border border-border-soft p-4 space-y-2 animate-pulse-soft">
          <div className="h-3 w-full bg-border-soft rounded" />
          <div className="h-3 w-5/6 bg-border-soft rounded" />
          <div className="h-3 w-4/6 bg-border-soft rounded" />
        </div>
      )}

      {error && !data && (
        <div className="rounded-xl bg-bear/5 border border-bear/30 p-4 text-sm text-bear/90">
          {readableError(error)}
          <button onClick={onRefresh} className="block mt-2 text-xs text-text underline">
            Try again
          </button>
        </div>
      )}

      {data && (
        <>
          <blockquote className="rounded-xl bg-surface-2 border border-border-soft p-4
                                 text-[15px] leading-relaxed text-text/90 relative">
            <span className="absolute -top-2 -left-1 text-[40px] leading-none text-accent/30 font-serif">“</span>
            <span className="relative pl-3 block">{data.summary}</span>
          </blockquote>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
            <span>{data.market_open ? 'Market open · refreshes every 15 min' : 'Market closed'}</span>
            <button onClick={onRefresh} className="hover:text-text inline-flex items-center gap-1.5">
              <RefreshIcon /> Refresh
            </button>
          </div>
        </>
      )}
    </Card>
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

function readableError(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  return err?.message || 'Could not load Chitti Market View'
}

function speak(text) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate = 0.95
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utt)
}
