// components/StockSearch.jsx
// --------------------------
// Reusable autocomplete that hits /api/stocks/search.
// Calls onSelect({symbol, name, sector}) when user picks one.

import { useEffect, useRef, useState } from 'react'
import { api } from '../utils/api'

export default function StockSearch({ placeholder = 'Search stocks…',
                                      onSelect,
                                      autoFocus = false }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const debounceRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q || q.trim().length < 1) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await api.get(`/api/stocks/search?q=${encodeURIComponent(q.trim())}`)
        setResults(r.data || [])
        setOpen(true)
        setActive(0)
      } catch {
        setResults([])
      }
    }, 200)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [q])

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (item) => {
    onSelect?.(item)
    setQ('')
    setResults([])
    setOpen(false)
  }

  const onKey = (e) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)) }
    if (e.key === 'Enter') { e.preventDefault(); pick(results[active]) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="stock-search" ref={wrapRef}>
      <input
        type="text" value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKey}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className="stock-search-input"
      />
      {open && results.length > 0 && (
        <ul className="stock-search-dropdown">
          {results.map((r, i) => (
            <li key={r.symbol}
                className={i === active ? 'active' : ''}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}>
              <div className="ssd-row">
                <strong>{r.symbol.replace(/^NSE:|^BSE:/, '')}</strong>
                <span className="ssd-sector">{r.sector}</span>
              </div>
              <div className="ssd-name">{r.name}</div>
            </li>
          ))}
        </ul>
      )}
      <style>{`
        .stock-search { position: relative; }
        .stock-search-input {
          width: 100%; padding: 10px 14px;
          border: 1px solid var(--border, #cbd5e1);
          border-radius: 8px; font-size: 14px;
        }
        .stock-search-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: var(--bg-card, #fff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 8px; max-height: 300px; overflow-y: auto;
          z-index: 100; list-style: none; padding: 4px; margin: 0;
          box-shadow: 0 8px 16px rgba(0,0,0,0.08);
        }
        .stock-search-dropdown li {
          padding: 8px 10px; cursor: pointer; border-radius: 6px;
        }
        .stock-search-dropdown li.active { background: var(--bg-hover, #f1f5f9); }
        .ssd-row { display: flex; justify-content: space-between; align-items: baseline; }
        .ssd-sector { font-size: 11px; color: var(--text-muted, #64748b); }
        .ssd-name { font-size: 12px; color: var(--text-muted, #64748b); margin-top: 2px; }
      `}</style>
    </div>
  )
}
