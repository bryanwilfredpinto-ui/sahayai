// pages/OTPVerify.jsx
// -------------------
// Step 2 of auth: 6-digit OTP entry.
// On success: receive JWT pair + user, store in localStorage, route to /dashboard.

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { api, errMessage } from '../utils/api'
import {
  auth,
  detectDeviceType,
  detectUserAgentLabel,
  getDeviceId,
} from '../utils/auth'

const OTP_LEN = 6

export default function OTPVerify() {
  const navigate = useNavigate()
  const location = useLocation()
  const mobile = location.state?.mobile

  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(30)
  const inputs = useRef([])

  // No mobile in route state -> bounce back to /login
  if (!mobile) return <Navigate to="/login" replace />

  // Resend cooldown
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  // Auto-focus first input
  useEffect(() => { inputs.current[0]?.focus() }, [])

  function handleChange(i, raw) {
    const v = raw.replace(/\D/g, '')
    if (!v) {
      // backspace cleared this digit
      const next = [...digits]; next[i] = ''
      setDigits(next)
      return
    }
    // pasting full code
    if (v.length === OTP_LEN) {
      setDigits(v.split(''))
      inputs.current[OTP_LEN - 1]?.focus()
      return
    }
    const next = [...digits]
    next[i] = v[0]
    setDigits(next)
    if (i < OTP_LEN - 1) inputs.current[i + 1]?.focus()
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
    if (e.key === 'Enter') verify()
  }

  function handlePaste(e) {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LEN)
    if (!text) return
    e.preventDefault()
    const next = Array(OTP_LEN).fill('')
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setDigits(next)
    inputs.current[Math.min(text.length, OTP_LEN - 1)]?.focus()
  }

  async function verify() {
    const code = digits.join('')
    if (code.length !== OTP_LEN || loading) return
    setLoading(true)
    try {
      const device_id = await getDeviceId()
      const device_type = detectDeviceType()
      const user_agent = detectUserAgentLabel()

      const { data } = await api.post('/auth/verify-otp', {
        mobile,
        otp: code,
        device_id,
        device_type,
        user_agent,
      })
      auth.setSession(data)
      toast.success(`Welcome${data.user?.name ? ', ' + data.user.name : ''}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(errMessage(err, 'Wrong OTP'))
      setDigits(Array(OTP_LEN).fill(''))
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (digits.every((d) => d !== '') && !loading) verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits.join('')])

  async function resend() {
    if (resendIn > 0) return
    try {
      await api.post('/auth/send-otp', { mobile })
      toast.success('New OTP sent')
      setResendIn(30)
    } catch (err) {
      toast.error(errMessage(err, 'Could not resend'))
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -top-40 -right-40 size-96 rounded-full bg-accent/15 blur-3xl" />

      <main className="relative mx-auto max-w-md min-h-screen px-5 py-10 flex flex-col">
        <button
          onClick={() => navigate('/login')}
          className="self-start text-muted hover:text-text text-sm mb-8 inline-flex items-center gap-2"
        >
          <BackIcon /> Change number
        </button>

        <div className="mb-8 animate-fade-up">
          <div className="text-xs uppercase tracking-[0.2em] text-muted mb-2">Step 2 of 2</div>
          <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight">
            Enter the 6-digit code
          </h1>
          <p className="mt-2 text-muted text-[15px]">
            Sent to <span className="text-text font-semibold">+91 {mobile.slice(0, 5)} {mobile.slice(5)}</span>
          </p>
        </div>

        <div className="card animate-fade-up [animation-delay:80ms]">
          <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="otp-input w-full bg-surface-2 border border-border rounded-xl py-4
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                disabled={loading}
              />
            ))}
          </div>

          <button onClick={verify} disabled={digits.join('').length !== OTP_LEN || loading}
                  className="btn-primary w-full mt-5">
            {loading ? <Spinner /> : 'Verify & Continue'}
          </button>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted">Didn&rsquo;t get it? </span>
            <button onClick={resend} disabled={resendIn > 0}
                    className={resendIn > 0 ? 'text-muted/60' : 'text-accent hover:underline font-semibold'}>
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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
