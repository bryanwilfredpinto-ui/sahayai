// components/VoiceButton.jsx
// --------------------------
// Reads a piece of text using the browser's built-in speech synthesis.
// Picks Hindi voice when lang is 'hi', else English.
// Falls back silently if the browser doesn't support TTS.

import { useState } from 'react'
import { getLang } from '../utils/i18n'

export default function VoiceButton({ text, ariaLabel = 'Read aloud' }) {
  const [speaking, setSpeaking] = useState(false)

  const supported = typeof window !== 'undefined' &&
    'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  if (!supported || !text) return null

  const speak = () => {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    try {
      const utt = new SpeechSynthesisUtterance(String(text).slice(0, 800))
      utt.lang = getLang() === 'hi' ? 'hi-IN' : 'en-IN'
      utt.rate = 0.95
      utt.onend = () => setSpeaking(false)
      utt.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utt)
      setSpeaking(true)
    } catch {
      setSpeaking(false)
    }
  }

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="voice-btn"
    >
      {speaking ? '⏹' : '🔊'}
      <style>{`
        .voice-btn {
          background: transparent;
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 6px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }
        .voice-btn:hover { background: var(--bg-hover, #f1f5f9); }
      `}</style>
    </button>
  )
}
