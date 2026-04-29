// pages/Dashboard.jsx
// -------------------
// Phase 2: live Nifty/Sensex + Chitti Market View.
// Auto-refreshes every 5 min during market hours (9:15-15:30 IST, Mon-Fri).
// Outside market hours: shows "Market Closed" with last-fetched time.

import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import BottomNav from '../components/BottomNav'
import IndexCard from '../components/IndexCard'
import MarketViewCard from '../components/MarketViewCard'
import QuotaWidget from '../components/QuotaWidget'
import { api } from '../utils/api'
import { auth } from '../utils/auth'
import { getLang, setLang } from '../utils/i18n'
import { useAutoRefresh } from '../utils/useAutoRefresh'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(auth.getUser())

  useEffect(() => {
    api.get('/user/me')
      .then(({ data }) => {
        auth.setUser(data); setUser(data)
        // Sync server-stored language preference into local hook
        if (data.language && getLang() !== data.language) {
          setLang(data.language)
        }
      })
      .catch(() => {})
  }, [])

  // ---- Live data hooks ----
  const indices = useAutoRefresh(
    async () => (await api.get('/api/market/indices')).data,
  )
  const view = useAutoRefresh(
    async () => (await api.get('/api/market/view')).data,
  )

  async function handleLogout() {
    try { await api.post('/auth/logout', { refresh_token: auth.getRefresh() }) } catch {}
    auth.clear()
    toast.success('Logged out')
    navigate('/login', { replace: true })
  }

  const greeting = pickGreeting()
  const firstName = (user?.name || 'Trader').split(' ')[0]
  const marketOpen = indices.marketOpen

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed -top-40 right-[-10%] size-[500px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28">

        {/* Top bar */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display font-bold text-[15px] tracking-tight">Chitti Shares</span>
          </div>

          <div className="flex items-center gap-2">
            <QuotaWidget />
            <Link
              to="/settings"
              className="hidden sm:inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
            >
              <span className="hidden md:inline">{user?.name || 'Trader'}</span>
              <SettingsIcon />
            </Link>
            <Link to="/settings" className="sm:hidden grid size-9 place-items-center rounded-full border border-border-soft text-muted hover:text-text">
              <SettingsIcon />
            </Link>
            <button onClick={handleLogout} className="btn-ghost py-2 px-3 text-xs">Logout</button>
          </div>
        </header>

        {/* Greeting */}
        <section className="mb-6 animate-fade-up">
          <div className="text-xs uppercase tracking-[0.2em] text-muted mb-1.5 flex items-center gap-2">
            {todayLabel()}
            <MarketStatusPill open={marketOpen} lastFetched={indices.lastFetched} />
          </div>
          <h1 className="font-display text-[28px] sm:text-[34px] font-bold leading-tight tracking-tight">
            {greeting}, <span className="bg-gradient-to-r from-accent to-bull bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="mt-1.5 text-muted text-[14px]">
            {marketOpen
              ? 'Markets live now. Auto-refreshing every 5 minutes.'
              : 'Markets closed. Open Mon–Fri 9:15 AM – 3:30 PM IST.'}
          </p>
        </section>

        {/* Index cards (real data) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <IndexCard
            data={indices.data?.nifty}
            loading={indices.loading}
            error={indices.error}
            onRefresh={indices.refresh}
            marketOpen={marketOpen}
          />
          <IndexCard
            data={indices.data?.sensex}
            loading={indices.loading}
            error={indices.error}
            onRefresh={indices.refresh}
            marketOpen={marketOpen}
          />
        </section>

        {/* Chitti Market View (real DeepSeek) */}
        <section className="mb-6">
          <MarketViewCard
            data={view.data}
            loading={view.loading}
            error={view.error}
            onRefresh={view.refresh}
          />
        </section>

        {/* Quick shortcuts */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link to="/specialists" className="block">
            <RoadmapTile title="Stock Specialists" phase="NEW" />
          </Link>
          <Link to="/calls" className="block">
            <RoadmapTile title="Call Report" phase="LIVE" />
          </Link>
          <Link to="/portfolio" className="block">
            <RoadmapTile title="Portfolio Doctor" phase="LIVE" />
          </Link>
          <Link to="/chitti" className="block">
            <RoadmapTile title="Chat with Chitti" phase="LIVE" />
          </Link>
        </section>
      </div>

      <BottomNav />
    </div>
  )
}

// ------------------------------------------------------------------

function MarketStatusPill({ open, lastFetched }) {
  if (open) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-bull/10 text-bull
                       px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal">
        <span className="size-1.5 rounded-full bg-bull animate-pulse-soft" /> LIVE
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 text-muted
                     px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal">
      <span className="size-1.5 rounded-full bg-muted/70" /> CLOSED
      {lastFetched && <span className="text-muted/70">· {timeAgo(lastFetched)}</span>}
    </span>
  )
}

function RoadmapTile({ title, phase }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-3.5 py-3.5">
      <div className="text-[11px] uppercase tracking-wider text-muted">Phase {phase}</div>
      <div className="mt-1 font-semibold text-[13px] text-text/85 leading-tight">{title}</div>
    </div>
  )
}

function BrandMark() {
  return (
    <div className="grid size-9 place-items-center rounded-lg bg-bg border border-border">
      <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path d="M10 42 L22 28 L32 36 L52 14" stroke="url(#bm)" strokeWidth="6"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="52" cy="14" r="4" fill="#22c55e" />
      </svg>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.42.16.82.42 1.13.74A1.65 1.65 0 0021 11h.01a2 2 0 010 4H21a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function pickGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
}

function timeAgo(d) {
  const ms = Date.now() - d.getTime()
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}
