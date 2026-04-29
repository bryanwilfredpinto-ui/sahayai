// pages/Login.jsx
// ---------------
// Step 1 of auth: user enters 10-digit Indian mobile number.
// We POST /auth/send-otp and then route to /verify with mobile in state.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { api, errMessage } from '../utils/api'

export default function Login() {
  const navigate = useNavigate()
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = /^[6-9]\d{9}$/.test(mobile)

  async function onSubmit(e) {
    e?.preventDefault?.()
    if (!isValid || loading) return
    setLoading(true)
    try {
      await api.post('/auth/send-otp', { mobile })
      toast.success('OTP sent to your phone')
      navigate('/verify', { state: { mobile } })
    } catch (err) {
      toast.error(errMessage(err, 'Could not send OTP'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -top-40 -right-40 size-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-bull/10 blur-3xl" />

      <main className="relative mx-auto max-w-md min-h-screen px-5 py-12 flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-12">
          <Logo />
          <div>
            <div className="font-display text-lg font-bold tracking-tight">Chitti Shares</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">AI Trading Intelligence</div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="mb-10 animate-fade-up">
          <h1 className="font-display text-[34px] leading-[1.05] font-bold tracking-tight">
            Trade smarter.<br />
            <span className="bg-gradient-to-r from-accent to-bull bg-clip-text text-transparent">
              See what others miss.
            </span>
          </h1>
          <p className="mt-3 text-muted text-[15px] leading-relaxed">
            Sign in with your mobile number. We&rsquo;ll send a one-time password.
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={onSubmit} className="card animate-fade-up [animation-delay:80ms]">
          <label className="block text-xs font-semibold text-muted mb-2 tracking-wide uppercase">
            Mobile Number
          </label>
          <div className="flex items-stretch gap-2">
            <div className="grid place-items-center px-3 rounded-xl bg-surface-2 border border-border text-sm font-mono text-muted">
              +91
            </div>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="98765 43210"
              className="input numeric text-lg tracking-wider"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="btn-primary w-full mt-5"
          >
            {loading ? <Spinner /> : 'Send OTP'}
            {!loading && <ArrowIcon />}
          </button>

          <p className="mt-4 text-[11px] text-muted/80 leading-relaxed">
            By continuing you agree to receive an SMS from Chitti Shares.
            Standard message rates may apply.
          </p>
        </form>

        {/* Footer mark */}
        <div className="mt-auto pt-10 text-center text-[11px] text-muted/60">
          Made for Indian traders &middot; sahayai.in
        </div>
      </main>
    </div>
  )
}

function Logo() {
  return (
    <div className="grid size-11 place-items-center rounded-xl bg-bg border border-border shadow-card">
      <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path d="M10 42 L22 28 L32 36 L52 14" stroke="url(#lg)" strokeWidth="5"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="52" cy="14" r="4" fill="#22c55e" />
      </svg>
    </div>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
