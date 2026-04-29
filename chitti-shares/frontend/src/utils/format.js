// utils/format.js
// ---------------
// Reused number formatters so every screen looks consistent.

export function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return '——'
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function fmtSigned(n, decimals = 2) {
  if (n == null || isNaN(n)) return '——'
  const sign = n >= 0 ? '+' : ''
  return sign + fmt(n, decimals)
}

export function fmtPct(n, decimals = 2) {
  if (n == null || isNaN(n)) return '——'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${Number(n).toFixed(decimals)}%`
}

export function fmtCrores(n) {
  if (n == null || isNaN(n)) return '——'
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`
  return `₹${fmt(n, 0)}`
}

export function fmtMarketCap(n) {
  if (n == null || isNaN(n)) return '——'
  if (n >= 1e12) return `₹${(n / 1e12).toFixed(2)} T`
  if (n >= 1e10) return `₹${(n / 1e7).toFixed(0)} Cr`
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  return `₹${fmt(n, 0)}`
}

export function symLabel(canonical) {
  if (!canonical) return ''
  if (canonical.includes(':')) return canonical.split(':', 2)[1]
  return canonical
}

export function timeAgo(iso) {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const ms = Date.now() - d.getTime()
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
