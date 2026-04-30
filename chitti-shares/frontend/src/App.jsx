// App.jsx
// -------
// Router + cold-start "Backend waking up" overlay.

import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Alerts from './pages/Alerts'
import Calls from './pages/Calls'
import ChittiChat from './pages/ChittiChat'
import Dashboard from './pages/Dashboard'
import Technical from './pages/Technical'
import Login from './pages/Login'
import Markets from './pages/Markets'
import OTPVerify from './pages/OTPVerify'
import Portfolio from './pages/Portfolio'
import Settings from './pages/Settings'
import SpecialistChat from './pages/SpecialistChat'
import Specialists from './pages/Specialists'
import StockDetail from './pages/StockDetail'
import WakeUpOverlay from './components/WakeUpOverlay'
import { auth } from './utils/auth'
import { pingHealth } from './utils/api'

function Protected({ children }) {
  return auth.isAuthed() ? children : <Navigate to="/login" replace />
}

function PublicOnly({ children }) {
  return auth.isAuthed() ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  const [waking, setWaking] = useState(false)

  // On app mount: ping /health to start the cold-start clock early.
  // The user might still be on /login when the dyno wakes up.
  useEffect(() => {
    pingHealth()
  }, [])

  // Listen for the global "backend is waking up" event from api.js
  useEffect(() => {
    const handler = (e) => setWaking(!!e.detail?.waking)
    window.addEventListener('chitti-waking', handler)
    return () => window.removeEventListener('chitti-waking', handler)
  }, [])

  return (
    <>
      {waking && <WakeUpOverlay onDismiss={() => setWaking(false)} />}

      <Routes>
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/verify" element={<PublicOnly><OTPVerify /></PublicOnly>} />

        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/technical" element={<Protected><Technical /></Protected>} />
        <Route path="/markets" element={<Protected><Markets /></Protected>} />
        <Route path="/portfolio" element={<Protected><Portfolio /></Protected>} />
        <Route path="/alerts" element={<Protected><Alerts /></Protected>} />
        <Route path="/calls" element={<Protected><Calls /></Protected>} />
        <Route path="/chitti" element={<Protected><ChittiChat /></Protected>} />
        <Route path="/specialists" element={<Protected><Specialists /></Protected>} />
        <Route path="/specialist/:symbol" element={<Protected><SpecialistChat /></Protected>} />
        <Route path="/stock/:symbol" element={<Protected><StockDetail /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
