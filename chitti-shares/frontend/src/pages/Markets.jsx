// pages/Markets.jsx
// -----------------
// Phase 5 watchlist screen. Shows live quotes for everything saved.
// Tap a row to drill into the Stock detail page.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

import BottomNav from '../components/BottomNav'
import StockSearch from '../components/StockSearch'
import { api, errMessage } from '../utils/api'
import { fmt, fmtPct, symLabel } from '../utils/format'
import { useT } from '../utils/i18n'

export default function Markets() {
  const { t } = useT()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/watchlist')
      setItems(data)
    } catch (e) {
      toast.error(errMessage(e))
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function addBySymbol(symbol) {
    setAdding(true)
    try {
      await api.post('/api/watchlist', { symbol })
      toast.success(`Added ${symbol}`)
      load()
    } catch (e) {
      toast.error(errMessage(e))
    } finally { setAdding(false) }
  }

  async function add() {
    const q = query.trim()
    if (!q) return
    setAdding(true)
    try {
      const r = await api.get('/api/stocks/resolve', { params: { q } })
      await api.post('/api/watchlist', { symbol: r.data.symbol })
      setQuery('')
      toast.success(`Added ${r.data.symbol}`)
      load()
    } catch (e) {
      toast.error(errMessage(e, `Could not find ${q}`))
    } finally { setAdding(false) }
  }

  async function remove(id) {
    try {
      await api.delete(`/api/watchlist/${id}`)
      setItems(items.filter(i => i.id !== id))
    } catch (e) {
      toast.error(errMessage(e))
    }
  }

  async function onDragEnd(result) {
    if (!result.destination || result.destination.index === result.source.index) return
    const next = Array.from(items)
    const [moved] = next.splice(result.source.index, 1)
    next.splice(result.destination.index, 0, moved)
    // Optimistic UI
    setItems(next)
    try {
      await api.post('/api/watchlist/reorder', {
        ordered_ids: next.map(i => i.id),
      })
    } catch (e) {
      toast.error(errMessage(e, 'Reorder failed'))
      load()
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28">
        <Header title={t('watchlist.title')} />

        {/* Add row with search-as-you-type */}
        <div className="card mb-4 animate-fade-up">
          <label className="block text-xs uppercase tracking-wide text-muted mb-2">{t('watchlist.add')}</label>
          <StockSearch
            placeholder={t('watchlist.searchPlaceholder')}
            onSelect={(s) => addBySymbol(s.symbol)}
          />
        </div>

        {/* List */}
        {loading ? (
          <Skeletons />
        ) : items.length === 0 ? (
          <div className="card text-center text-muted py-10">{t('watchlist.empty')}</div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="watchlist">
              {(provided) => (
                <ul ref={provided.innerRef} {...provided.droppableProps}
                    className="space-y-2 animate-fade-up">
                  {items.map((i, idx) => (
                    <Draggable key={i.id} draggableId={String(i.id)} index={idx}>
                      {(p, snap) => (
                        <li ref={p.innerRef} {...p.draggableProps}
                            className={`card card-hover flex items-center gap-3 cursor-pointer ${snap.isDragging ? 'shadow-lg' : ''}`}
                            onClick={() => navigate(`/stock/${encodeURIComponent(i.symbol)}`)}>
                          <span {...p.dragHandleProps}
                                className="text-muted text-lg shrink-0 cursor-grab active:cursor-grabbing px-1"
                                onClick={(e) => e.stopPropagation()}
                                title="Drag to reorder">⋮⋮</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-display font-semibold text-[15px] truncate">{symLabel(i.symbol)}</div>
                            <div className="text-[11px] text-muted flex items-center gap-2 flex-wrap">
                              <span>{i.symbol}</span>
                              {i.scorecard_grade && (
                                <span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-bold">
                                  {i.scorecard_grade}
                                </span>
                              )}
                              {i.tech_signal && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  i.tech_signal.includes('Buy') ? 'bg-bull/15 text-bull' :
                                  i.tech_signal.includes('Sell') ? 'bg-bear/15 text-bear' :
                                  'bg-muted/15 text-muted'
                                }`}>
                                  {i.tech_signal}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="numeric font-semibold">{fmt(i.last_price)}</div>
                            <div className={`numeric text-[11px] ${i.change_pct >= 0 ? 'text-bull' : 'text-bear'}`}>
                              {i.change_pct == null ? '——' : fmtPct(i.change_pct)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); remove(i.id) }}
                            className="text-muted hover:text-bear shrink-0 px-2"
                            title={t('common.delete')}
                          >×</button>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function Header({ title }) {
  return (
    <header className="flex items-center justify-between mb-6">
      <Link to="/dashboard" className="text-sm text-muted hover:text-text inline-flex items-center gap-1.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Dashboard
      </Link>
      <h1 className="font-display text-[20px] font-bold tracking-tight">{title}</h1>
      <div className="size-8" />
    </header>
  )
}

function Skeletons() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map(i => (
        <li key={i} className="card animate-pulse-soft">
          <div className="h-5 w-24 bg-border-soft rounded mb-1.5" />
          <div className="h-3 w-16 bg-border-soft/60 rounded" />
        </li>
      ))}
    </ul>
  )
}
