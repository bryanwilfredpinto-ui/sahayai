// pages/Settings.jsx
// ------------------
// Authenticated:
//   - Show mobile (read-only)
//   - Edit name
//   - List devices with last_active timestamp + revoke button
//   - Revoke-all button
//   - Logout button (header)

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import BottomNav from '../components/BottomNav'
import { api, errMessage } from '../utils/api'
import { auth, getDeviceId } from '../utils/auth'
import { useT } from '../utils/i18n'

function LanguageSection() {
  const { lang, setLang } = useT()
  const [saving, setSaving] = useState(false)

  const change = async (newLang) => {
    if (newLang === lang) return
    // Update local immediately for snappy UX
    setLang(newLang)
    setSaving(true)
    try {
      await api.put('/user/me', { language: newLang })
    } catch (e) {
      toast.error(errMessage(e, 'Could not save language preference'))
      // Don't revert local - localStorage persists user's choice anyway
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card animate-fade-up [animation-delay:60ms]">
      <h2 className="font-display font-semibold text-[15px] mb-3">
        Language / भाषा
        {saving && <span className="ml-2 text-[11px] text-muted">saving…</span>}
      </h2>
      <div className="flex gap-2">
        <button
          onClick={() => change('en')}
          disabled={saving}
          className={`flex-1 py-2.5 rounded-lg border text-[13px] font-medium ${
            lang === 'en' ? 'bg-accent/15 text-accent border-accent/30' : 'border-border text-muted hover:border-border-soft'
          }`}
        >
          English
        </button>
        <button
          onClick={() => change('hi')}
          disabled={saving}
          className={`flex-1 py-2.5 rounded-lg border text-[13px] font-medium ${
            lang === 'hi' ? 'bg-accent/15 text-accent border-accent/30' : 'border-border text-muted hover:border-border-soft'
          }`}
        >
          हिन्दी
        </button>
      </div>
      <p className="text-[11px] text-muted mt-2.5">
        Numbers and stock symbols stay the same in both languages.
      </p>
    </section>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState(auth.getUser() || {})
  const [name, setName] = useState(user.name || '')
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [thisDeviceId, setThisDeviceId] = useState(null)

  useEffect(() => { getDeviceId().then(setThisDeviceId) }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [me, dev] = await Promise.all([
        api.get('/user/me'),
        api.get('/user/devices'),
      ])
      setUser(me.data); auth.setUser(me.data); setName(me.data.name || '')
      setDevices(dev.data)
    } catch (err) {
      toast.error(errMessage(err, 'Could not load settings'))
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  async function saveName() {
    if (!name.trim() || name === user.name) return
    setSaving(true)
    try {
      await api.put('/user/me', { name: name.trim() })
      toast.success('Name updated')
      const me = await api.get('/user/me')
      setUser(me.data); auth.setUser(me.data)
    } catch (err) {
      toast.error(errMessage(err, 'Could not save'))
    } finally { setSaving(false) }
  }

  async function revokeOne(d) {
    // If user revokes their own device, do a clean logout
    const isThisDevice = thisDeviceId && devicesMatchSession(d, thisDeviceId)
    try {
      await api.delete(`/user/devices/${d.id}`)
      toast.success('Device logged out')
      if (isThisDevice) {
        auth.clear()
        navigate('/login', { replace: true })
        return
      }
      loadAll()
    } catch (err) {
      toast.error(errMessage(err, 'Failed'))
    }
  }

  async function revokeAll() {
    if (!confirm('Log out from ALL devices? You will need to log in again.')) return
    try {
      await api.delete('/user/devices')
      auth.clear()
      toast.success('Logged out from all devices')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(errMessage(err, 'Failed'))
    }
  }

  async function logout() {
    try { await api.post('/auth/logout', { refresh_token: auth.getRefresh() }) } catch {}
    auth.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 pt-6 pb-28">
        <header className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-text">
            <BackIcon /> Dashboard
          </Link>
          <button onClick={logout} className="btn-ghost py-2 px-3 text-xs">Logout</button>
        </header>

        <h1 className="font-display text-[28px] font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-muted text-sm mb-6">Manage your account and devices.</p>

        {/* Profile */}
        <section className="card mb-4 animate-fade-up">
          <h2 className="font-display font-semibold text-[15px] mb-4">Profile</h2>

          <div className="mb-4">
            <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">Mobile</label>
            <div className="numeric text-[15px] text-text/90">+91 {user.mobile || '——'}</div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">Name</label>
            <div className="flex gap-2">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Your name"
              />
              <button
                onClick={saveName}
                disabled={saving || !name.trim() || name === user.name}
                className="btn-primary px-4"
              >
                {saving ? '...' : 'Save'}
              </button>
            </div>
          </div>
        </section>

        {/* Language */}
        <LanguageSection />

        {/* Devices */}
        <section className="card animate-fade-up [animation-delay:80ms]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-[15px]">Logged-in Devices</h2>
              <p className="text-xs text-muted mt-0.5">Max 1 mobile + 1 desktop active at any time.</p>
            </div>
            {devices.length > 0 && (
              <button onClick={revokeAll} className="btn-danger py-2 px-3 text-xs">
                Logout all
              </button>
            )}
          </div>

          {loading ? (
            <SkeletonDevice />
          ) : devices.length === 0 ? (
            <div className="text-sm text-muted py-4">No devices found.</div>
          ) : (
            <ul className="space-y-2">
              {devices.map((d) => (
                <li key={d.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 border border-border-soft p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`grid size-10 place-items-center rounded-lg
                                     ${d.device_type === 'mobile' ? 'bg-accent/15 text-accent' : 'bg-bull/15 text-bull'}`}>
                      {d.device_type === 'mobile' ? <PhoneIcon /> : <LaptopIcon />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-text truncate">
                        {d.user_agent || (d.device_type === 'mobile' ? 'Mobile device' : 'Desktop')}
                      </div>
                      <div className="text-[11px] text-muted">
                        {d.device_type.toUpperCase()} &middot; last active {timeAgo(d.last_active)}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => revokeOne(d)} className="btn-danger py-2 px-3 text-xs shrink-0">
                    Logout
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-8 text-center text-[11px] text-muted/60">
          Chitti Shares &middot; Phase 1 Build
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

function devicesMatchSession(_d, _thisDeviceId) {
  // The backend doesn't return raw device_id (privacy), so we rely on
  // the user-agent + recency heuristic. Conservative: never auto-log-out.
  return false
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function SkeletonDevice() {
  return (
    <div className="space-y-2">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-2 border border-border-soft p-3 animate-pulse-soft">
          <div className="size-10 rounded-lg bg-border-soft" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-border-soft rounded" />
            <div className="h-2 w-1/2 bg-border-soft/70 rounded" />
          </div>
        </div>
      ))}
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
function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" />
    </svg>
  )
}
function LaptopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="11" rx="2" /><path d="M2 20h20" />
    </svg>
  )
}
