// utils/auth.js
// -------------
// Helpers for storing JWTs, generating a stable device fingerprint,
// and detecting whether we're on mobile or desktop.

import FingerprintJS from '@fingerprintjs/fingerprintjs'

const ACCESS_KEY = 'chitti_access_token'
const REFRESH_KEY = 'chitti_refresh_token'
const USER_KEY = 'chitti_user'
const DEVICE_KEY = 'chitti_device_id'

// ---------- Token storage ----------
export const auth = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  setSession: ({ access_token, refresh_token, user }) => {
    if (access_token) localStorage.setItem(ACCESS_KEY, access_token)
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  setAccess: (t) => localStorage.setItem(ACCESS_KEY, t),
  setUser: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),

  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },

  isAuthed: () => !!localStorage.getItem(ACCESS_KEY),
}

// ---------- Device fingerprint ----------
let fpPromise = null
export async function getDeviceId() {
  // Cache the device id in localStorage so it's stable across reloads
  const cached = localStorage.getItem(DEVICE_KEY)
  if (cached) return cached

  if (!fpPromise) fpPromise = FingerprintJS.load()
  const fp = await fpPromise
  const result = await fp.get()
  const id = result.visitorId
  localStorage.setItem(DEVICE_KEY, id)
  return id
}

// ---------- Mobile vs desktop detection ----------
export function detectDeviceType() {
  // Use UA + viewport width. Match the backend's enum: "mobile" | "desktop"
  const ua = navigator.userAgent || ''
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Opera Mini/i.test(ua)
  const isNarrow = window.matchMedia('(max-width: 820px)').matches
  return isMobileUA || isNarrow ? 'mobile' : 'desktop'
}

export function detectUserAgentLabel() {
  const ua = navigator.userAgent || ''
  // Best-effort short label for the Settings page
  const browser =
    /Edg\//.test(ua) ? 'Edge' :
    /Chrome\//.test(ua) ? 'Chrome' :
    /Firefox\//.test(ua) ? 'Firefox' :
    /Safari\//.test(ua) ? 'Safari' :
    'Browser'
  const os =
    /Android/i.test(ua) ? 'Android' :
    /iPhone|iPad|iPod/i.test(ua) ? 'iOS' :
    /Windows/i.test(ua) ? 'Windows' :
    /Mac OS X/i.test(ua) ? 'macOS' :
    /Linux/i.test(ua) ? 'Linux' :
    'Unknown'
  return `${browser} on ${os}`
}
