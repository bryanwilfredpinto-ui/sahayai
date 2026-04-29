// pages/SpecialistChat.jsx
// ------------------------
// Chat with one stock specialist. POSTs to /api/stocks/{symbol}/chat.
// Conversation kept only in component state (not persisted) since
// each question is a self-contained one-shot with full context.

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VoiceButton from '../components/VoiceButton'
import { api, errMessage } from '../utils/api'
import { useT } from '../utils/i18n'

export default function SpecialistChat() {
  const { symbol: rawSym } = useParams()
  const symbol = decodeURIComponent(rawSym)
  const nav = useNavigate()
  const { lang } = useT()
  const T = (en, hi) => (lang === 'hi' ? hi : en)

  const [meta, setMeta] = useState(null)
  const [messages, setMessages] = useState([])  // [{role, text}]
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/specialists')
        const m = (r.data || []).find(s => s.symbol === symbol)
        setMeta(m || null)
        if (m) {
          setMessages([{
            role: 'assistant',
            text: T(
              `Hi! I'm ${m.display_name}, focused only on ${m.long_name}. Ask me anything about this stock.`,
              `नमस्ते! मैं ${m.display_name} हूं, सिर्फ ${m.long_name} पर ध्यान देता हूं। कुछ भी पूछिए।`
            )
          }])
        }
      } catch (e) { setErr(errMessage(e)) }
    })()
  }, [symbol])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    setMessages(m => [...m, { role: 'user', text }])
    setInput('')
    setBusy(true); setErr('')
    try {
      const r = await api.post(`/api/stocks/${encodeURIComponent(symbol)}/chat`,
                               { message: text })
      setMessages(m => [...m, { role: 'assistant', text: r.data.reply }])
    } catch (e) {
      setErr(errMessage(e))
      setMessages(m => [...m, { role: 'assistant',
                                text: '⚠ ' + errMessage(e), error: true }])
    } finally { setBusy(false) }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="page chat-page">
      <header className="chat-header">
        <button className="btn-back" onClick={() => nav('/specialists')}>← {T('Back','वापस')}</button>
        <div>
          <h2>{meta?.display_name || symbol}</h2>
          <div className="muted">{meta?.long_name}</div>
        </div>
      </header>

      <div className="chat-scroll">
        {messages.map((m, i) => (
          <div key={i} className={`msg msg-${m.role}`}>
            <div className="msg-bubble">{m.text}</div>
            {m.role === 'assistant' && !m.error && (
              <div className="msg-actions">
                <VoiceButton text={m.text} />
              </div>
            )}
          </div>
        ))}
        {busy && <div className="msg msg-assistant"><div className="msg-bubble">…</div></div>}
        <div ref={endRef} />
      </div>

      <div className="chat-quick">
        {[
          T("What's the trend?", "ट्रेंड क्या है?"),
          T("Buy or sell now?", "अभी खरीदें या बेचें?"),
          T("Latest results", "ताज़ा नतीजे"),
        ].map((q, i) => (
          <button key={i} className="chip" onClick={() => setInput(q)}>{q}</button>
        ))}
      </div>

      <div className="chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={T('Ask about this stock…', 'इस स्टॉक के बारे में पूछें…')}
          rows={2}
        />
        <button className="btn btn-primary" onClick={send} disabled={busy}>
          {T('Send', 'भेजें')}
        </button>
      </div>

      <style>{`
        .chat-page { display: flex; flex-direction: column; height: 100vh; padding: 0; }
        .chat-header { padding: 12px 16px; border-bottom: 1px solid var(--border);
                       display: flex; align-items: center; gap: 12px; }
        .btn-back { background: none; border: none; font-size: 14px; cursor: pointer; padding: 4px 8px; }
        .chat-scroll { flex: 1; overflow-y: auto; padding: 12px 16px; }
        .msg { margin-bottom: 12px; }
        .msg-user { text-align: right; }
        .msg-bubble {
          display: inline-block; padding: 8px 14px; border-radius: 18px;
          max-width: 80%; white-space: pre-wrap; line-height: 1.45;
        }
        .msg-user .msg-bubble { background: var(--accent, #2563eb); color: white; }
        .msg-assistant .msg-bubble { background: var(--bg-card, #f1f5f9); }
        .msg-actions { margin-top: 4px; }
        .chat-quick { display: flex; gap: 6px; padding: 8px 16px; flex-wrap: wrap; border-top: 1px solid var(--border); }
        .chip { background: var(--bg-card, #f1f5f9); border: 1px solid var(--border, #e2e8f0);
                padding: 4px 10px; border-radius: 999px; font-size: 12px; cursor: pointer; }
        .chip:hover { background: var(--bg-hover, #e2e8f0); }
        .chat-input { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); }
        .chat-input textarea { flex: 1; padding: 8px 12px; border: 1px solid var(--border, #cbd5e1);
                                border-radius: 8px; resize: none; font-family: inherit; font-size: 14px; }
      `}</style>
    </div>
  )
}
