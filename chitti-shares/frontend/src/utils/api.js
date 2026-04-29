// utils/api.js
// ------------
// Configured axios instance with cold-start awareness.
//
// Render free dynos sleep after 15 min idle. The first request after
// sleep takes 30-50 seconds while the dyno wakes up. We detect this
// via a soft 8-second timer that flips a "backend waking" flag and
// broadcasts a 'chitti-waking' event. The App.jsx WakeUpOverlay
// listens and shows a friendly screen with a "Refresh page" button.
//
// We also fire a /health ping on app mount (see App.jsx) to start
// the wake-up *before* the user requests data.

import axios from 'axios'
import { auth } from './auth'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL,
  // Hard timeout of 60s - longer than Render's typical cold-start window
  timeout: 60000,
})

// ---- Cold start detection ----

const WAKE_THRESHOLD_MS = 8000   // Show overlay if any call hangs > 8s
const inFlightSlowTimers = new Map()
let isBackendWaking = false

function broadcastWaking(state) {
  if (state === isBackendWaking) return
  isBackendWaking = state
  window.dispatchEvent(new CustomEvent('chitti-waking', {
    detail: { waking: state },
  }))
}

export function isWaking() {
  return isBackendWaking
}

// --- Attach access token + start slow-call timer ---
api.interceptors.request.use((config) => {
  const token = auth.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`

  const id = `${Date.now()}-${Math.random()}`
  config._coldStartId = id
  // If this call hangs > WAKE_THRESHOLD_MS, broadcast 'waking'
  inFlightSlowTimers.set(id, setTimeout(() => {
    broadcastWaking(true)
  }, WAKE_THRESHOLD_MS))

  return config
})

function clearSlowTimer(config) {
  if (!config?._coldStartId) return
  const t = inFlightSlowTimers.get(config._coldStartId)
  if (t) {
    clearTimeout(t)
    inFlightSlowTimers.delete(config._coldStartId)
  }
  // Only clear waking flag once all in-flight calls have resolved
  if (inFlightSlowTimers.size === 0) {
    broadcastWaking(false)
  }
}

// --- Refresh-on-401 + clear slow timers on response ---
let refreshing = null

api.interceptors.response.use(
  (r) => { clearSlowTimer(r.config); return r },
  async (error) => {
    clearSlowTimer(error.config)
    const original = error.config
    const status = error.response?.status

    // Don't try to refresh on the auth endpoints themselves
    const isAuthEndpoint = original?.url?.startsWith('/auth/')

    if (status === 401 && !isAuthEndpoint && !original._retry) {
      original._retry = true
      const refresh_token = auth.getRefresh()
      if (!refresh_token) {
        auth.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (!refreshing) {
        refreshing = api
          .post('/auth/refresh', { refresh_token })
          .then((resp) => {
            auth.setAccess(resp.data.access_token)
            return resp.data.access_token
          })
          .catch((e) => {
            auth.clear()
            window.location.href = '/login'
            throw e
          })
          .finally(() => {
            setTimeout(() => { refreshing = null }, 0)
          })
      }

      try {
        const newAccess = await refreshing
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (e) {
        return Promise.reject(e)
      }
    }

    return Promise.reject(error)
  }
)

// Helper: pull a friendly error message out of an axios error
export function errMessage(err, fallback = 'Something went wrong') {
  // Network error / timeout / server cold start
  if (err?.code === 'ECONNABORTED' || err?.message === 'Network Error') {
    return 'The server is waking up. Please refresh the page in 20-30 seconds.'
  }
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  )
}

// Ping /health silently to kick off cold-start before user requests data
export async function pingHealth() {
  try {
    await api.get('/health')
    return true
  } catch {
    return false
  }
}
