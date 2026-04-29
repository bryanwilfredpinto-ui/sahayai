// components/BottomNav.jsx
// ------------------------
// All 5 tabs active in Phase 5.

import { NavLink } from 'react-router-dom'
import { useT } from '../utils/i18n'

export default function BottomNav() {
  const { t } = useT()
  const tabs = [
    { to: '/dashboard',  label: t('nav.home'),      icon: HomeIcon },
    { to: '/markets',    label: t('nav.markets'),   icon: MarketsIcon },
    { to: '/portfolio',  label: t('nav.portfolio'), icon: PortfolioIcon },
    { to: '/alerts',     label: t('nav.alerts'),    icon: AlertsIcon },
    { to: '/chitti',     label: t('nav.chitti'),    icon: ChittiIcon },
  ]
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-bg/85 backdrop-blur-lg">
      <div className="mx-auto max-w-3xl px-2">
        <ul className="grid grid-cols-5">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <li key={t.to}>
                <NavLink
                  to={t.to}
                  end
                  className={({ isActive }) =>
                    [
                      'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium tracking-wide transition-colors',
                      isActive ? 'text-accent' : 'text-muted hover:text-text',
                    ].join(' ')
                  }
                >
                  <Icon />
                  <span>{t.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </nav>
  )
}

function HomeIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg> }
function MarketsIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-9" /><path d="M14 6h7v7" /></svg> }
function PortfolioIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4h8v2" /><path d="M3 12h18" /></svg> }
function AlertsIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21a2 2 0 004 0" /></svg> }
function ChittiIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 13s1.5 2 4 2 4-2 4-2" /><circle cx="9" cy="10" r="0.7" fill="currentColor"/><circle cx="15" cy="10" r="0.7" fill="currentColor"/></svg> }
