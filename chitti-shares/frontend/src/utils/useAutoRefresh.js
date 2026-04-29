// utils/useAutoRefresh.js
// -----------------------
// Calls `fetcher` immediately, then on an interval. The interval is
// 5 minutes during market hours (Mon-Fri, 9:15-15:30 IST) and stops
// outside market hours.
//
// Returns { data, loading, error, refresh, lastFetched, marketOpen }.

import { useCallback, useEffect, useRef, useState } from 'react'

const FIVE_MIN = 5 * 60 * 1000

// Convert "now" to IST regardless of where the user's browser thinks they are
function nowIST() {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
  )
  return {
    weekday: parts.weekday, // 'Mon'..'Sun'
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
  }
}

export function isMarketOpen() {
  const { weekday, hour, minute } = nowIST()
  if (weekday === 'Sat' || weekday === 'Sun') return false
  const t = hour * 60 + minute
  return t >= 9 * 60 + 15 && t <= 15 * 60 + 30
}

export function useAutoRefresh(fetcher, { enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)
  const [marketOpen, setMarketOpen] = useState(isMarketOpen())

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      setData(result)
      setLastFetched(new Date())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + market-state polling + auto-refresh loop
  useEffect(() => {
    if (!enabled) return
    refresh()
    const tick = setInterval(() => {
      const open = isMarketOpen()
      setMarketOpen(open)
      if (open) refresh()
    }, FIVE_MIN)
    // Update marketOpen state every 30s so the UI flips immediately at 9:15/15:30
    const stateTick = setInterval(() => setMarketOpen(isMarketOpen()), 30 * 1000)
    return () => { clearInterval(tick); clearInterval(stateTick) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { data, loading, error, refresh, lastFetched, marketOpen }
}
