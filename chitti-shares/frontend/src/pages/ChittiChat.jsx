// pages/ChittiChat.jsx
// --------------------
// Phase 5 chat with the Chitti AI. Persistent history, voice playback
// via window.speechSynthesis (browser native, no cloud TTS bill).

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import BottomNav from '../components/BottomNav'
import { api, errMessage } from '../utils/api'
import { useT, getLang } from '../utils/i18n'

export default function ChittiChat() {
  const { t } = useT()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/api/chat')
      setMessages(r.data)
    } catch (e) {
      toast.error(errMessage(e))
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  async function send() {
    const msg = input.trim()
    if (!msg || sending) return
    // Optimistic add - user message
    const optimisticUser = { role: 'user', content: msg, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimisticUser])
    setInput('')
    setSending(true)
    try {
      const r = await api.post('/api/chat', { message: msg })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: r.data.reply,
        created_at: r.data.created_at,
      }])
    } catch (e) {
      // Roll back optimistic message on failure
      setMessages(prev => prev.filter(m => m !== optimisticUser))
      setInput(msg)
      toast.error(errMessage(e))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  async function clearChat() {
    if (!confirm('Clear all chat history?')) return
    try {
      await api.delete('/api/chat')
      setMessages([])
      toast.success('Chat cleared')
    } catch (e) { toast.error(errMessage(e)) }
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      toast.error('Voice not supported on this browser')
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = getLang() === 'hi' ? 'hi-IN' : 'en-IN'
    u.rate = 0.95
    window.speechSynthesis.speak(u)
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="relative px-4 sm:px-6 pt-6 pb-3 max-w-3xl mx-auto w-full flex items-center justify-between">
        <Link to="/dashboard" className="text-sm text-muted hover:text-text inline-flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Dashboard
        </Link>
        <h1 className="font-display text-[20px] font-bold tracking-tight">{t('chat.title')}</h1>
        <button onClick={clearChat} className="text-[11px] text-muted hover:text-bear" title={t('chat.clear')}>
          {messages.length > 0 ? '⊘' : ''}
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 sm:px-6 pb-2 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="text-center text-muted text-[13px] py-10">{t('common.loading')}</div>
        ) : messages.length === 0 ? (
          <div className="card text-center py-10 mt-4 animate-fade-up">
            <div className="text-3xl mb-3">🤖</div>
            <div className="text-[14px] text-text/85 mb-2">{t('chat.empty')}</div>
            <div className="text-[11px] text-muted mt-3">Try: "What's a good entry for RELIANCE?" or "Should I book profits in TCS?"</div>
          </div>
        ) : (
          <ul className="space-y-3 py-2">
            {messages.map((m, i) => (
              <Bubble key={i} message={m} onSpeak={speak} />
            ))}
            {sending && (
              <li className="flex items-start gap-2">
                <div className="size-8 shrink-0 rounded-full bg-accent/20 flex items-center justify-center text-[14px]">🤖</div>
                <div className="bg-card-soft border border-border-soft rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-muted animate-pulse-soft">
                  Thinking…
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Composer */}
      <div className="relative max-w-3xl mx-auto w-full px-4 sm:px-6 pb-24 pt-2">
        {/* Quick prompts shown when chat is empty */}
        {messages.length === 0 && !loading && (
          <QuickPrompts onPick={(q) => { setInput(q); inputRef.current?.focus() }} />
        )}
        <div className="card flex items-end gap-2 p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={t('chat.placeholder')}
            className="flex-1 bg-transparent resize-none outline-none text-[14px] py-2 px-2 max-h-32"
            rows={1}
            style={{ minHeight: 36 }}
            disabled={sending}
          />
          <VoiceInputButton onText={(text) => {
            setInput(prev => (prev ? prev + ' ' : '') + text)
            inputRef.current?.focus()
          }} />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="btn-primary px-4 py-2 shrink-0"
          >
            {sending ? '…' : t('chat.send')}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

// ===== Phase 6: voice input + quick prompts =====

function QuickPrompts({ onPick }) {
  const lang = getLang()
  const prompts = lang === 'hi' ? [
    'मेरा पोर्टफोलियो कैसा है?',
    'आज क्या खरीदूं?',
    'निफ्टी का क्या हाल है?',
    'RELIANCE पर आपकी राय?',
  ] : [
    "How's my portfolio doing?",
    'What should I buy today?',
    "What's the Nifty trend?",
    'Your view on RELIANCE?',
  ]
  return (
    <div className="flex gap-1.5 flex-wrap mb-2 px-1">
      {prompts.map((p, i) => (
        <button key={i} onClick={() => onPick(p)}
                className="text-[12px] px-3 py-1.5 rounded-full border border-border-soft bg-card-soft hover:bg-accent/10 hover:border-accent/30 transition-colors">
          {p}
        </button>
      ))}
    </div>
  )
}

function VoiceInputButton({ onText }) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  // Browser support check (Chrome/Edge/Safari iOS 14.5+ have it as webkitSpeechRecognition)
  const SpeechRec = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null

  if (!SpeechRec) return null  // Hide on unsupported browsers (e.g. Firefox)

  const toggle = () => {
    if (listening) {
      try { recRef.current?.stop() } catch {}
      setListening(false)
      return
    }
    const rec = new SpeechRec()
    rec.lang = getLang() === 'hi' ? 'hi-IN' : 'en-IN'
    rec.interimResults = false
    rec.continuous = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript
      if (text) onText(text)
    }
    rec.onend = () => setListening(false)
    rec.onerror = (e) => {
      setListening(false)
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        toast.error(`Voice input: ${e.error}`)
      }
    }
    try {
      rec.start()
      recRef.current = rec
      setListening(true)
    } catch {
      setListening(false)
    }
  }

  return (
    <button
      onClick={toggle}
      type="button"
      className={`shrink-0 size-9 rounded-full grid place-items-center border transition-colors ${
        listening
          ? 'bg-bear/15 text-bear border-bear/30 animate-pulse'
          : 'bg-card-soft text-muted border-border-soft hover:bg-accent/10 hover:text-accent hover:border-accent/30'
      }`}
      title={listening ? 'Stop listening' : 'Voice input'}
    >
      {listening ? '⏺' : '🎤'}
    </button>
  )
}

function Bubble({ message, onSpeak }) {
  const isUser = message.role === 'user'
  return (
    <li className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`size-8 shrink-0 rounded-full flex items-center justify-center text-[14px] ${
        isUser ? 'bg-accent/15 text-accent' : 'bg-accent/20'
      }`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className={`group max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
        isUser
          ? 'bg-accent/10 border border-accent/20 rounded-tr-sm text-text'
          : 'bg-card-soft border border-border-soft rounded-tl-sm text-text/90'
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        {!isUser && (
          <button
            onClick={() => onSpeak(message.content)}
            className="mt-1.5 text-[10px] text-muted hover:text-accent transition-opacity opacity-60 group-hover:opacity-100"
            title="Listen"
          >
            🔊 Listen
          </button>
        )}
      </div>
    </li>
  )
}
