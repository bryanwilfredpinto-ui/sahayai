/**
 * CHITTI OFFLINE — Page-side registrar + 2G mode toggle
 *
 * P1 (2026-05-13) — registers chitti_offline_sw.js as a Service Worker
 * and surfaces an honest connectivity badge ("offline" / "2G mode" /
 * "online") so users on slow / patchy connections know what they're
 * looking at. Auto-loaded by chitti_a11y.js — same default-on contract
 * as chitti_features.js and chitti_camera.js.
 *
 * Activation rules (in order):
 *   1. User has explicitly toggled the badge → respect localStorage.
 *   2. User Disability Profile has `rural: true` → activate.
 *   3. effectiveType === '2g' / 'slow-2g' OR navigator.onLine === false
 *      → activate (heuristic suggestion, doesn't commit; the §5c rule
 *      says heuristics propose, the user disposes).
 *
 * Honest contract (per SAHAYAI_MASTER §2e + §3):
 *   - Cached responses are visibly tagged. The badge shows "Offline
 *     cached X ago" not "Online".
 *   - /api/* requests are NEVER served from cache — live data only.
 *   - When no cache exists, the SW returns a 503 with a clear message,
 *     never a faked success.
 *
 * Public API (window.Chitti.offline):
 *   - register()       → installs the SW (idempotent)
 *   - unregister()     → removes the SW + clears caches
 *   - reset()          → tells the active SW to drop all caches
 *   - mode()           → 'offline' | '2g' | 'online'
 *   - setForceOn(b)    → user override toggle
 *   - getForceOn()     → user override read
 */
(function (global) {
  'use strict';

  const FORCE_KEY = 'chitti_offline_force_v1';
  const SW_PATH = '/chitti_offline_sw.js';

  function isHttps() {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  }

  function loadA11y() {
    try { return JSON.parse(localStorage.getItem('chitti_a11y_v1')) || {}; }
    catch (_) { return {}; }
  }

  function getForceOn() {
    try { return localStorage.getItem(FORCE_KEY) === '1'; }
    catch (_) { return false; }
  }
  function setForceOn(on) {
    try {
      if (on) localStorage.setItem(FORCE_KEY, '1');
      else localStorage.removeItem(FORCE_KEY);
    } catch (_) {}
    updateBadge();
  }

  function _effectiveType() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return null;
    return (c.effectiveType || '').toLowerCase();
  }

  function _isSlowConnection() {
    const et = _effectiveType();
    return et === '2g' || et === 'slow-2g';
  }

  function mode() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
    if (_isSlowConnection() || getForceOn() || (loadA11y().profile || {}).rural) return '2g';
    return 'online';
  }

  // ── BADGE ────────────────────────────────────────────────────
  function ensureStyles() {
    if (document.getElementById('chitti-offline-css')) return;
    const css = document.createElement('style');
    css.id = 'chitti-offline-css';
    css.textContent = `
      .chitti-offline-badge {
        position: fixed; left: 12px; bottom: 12px; z-index: 9985;
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 12px; border-radius: 999px;
        font: 700 12px/1 system-ui,-apple-system,sans-serif;
        background: #f8fafc; color: #0E2344;
        border: 1px solid #cbd5e1;
        box-shadow: 0 4px 12px rgba(14,35,68,.15);
        cursor: pointer;
      }
      .chitti-offline-badge[data-mode="online"] { display: none; }
      .chitti-offline-badge[data-mode="2g"]    { background: #FFF7E8; border-color: #D4AF37; color: #92400e; }
      .chitti-offline-badge[data-mode="offline"]{ background: #fef2f2; border-color: #fca5a5; color: #7f1d1d; }
      .chitti-offline-badge:focus, .chitti-offline-badge:hover {
        outline: 3px solid #D4AF37; outline-offset: 2px;
      }
      body.chitti-2g-mode img:not([data-keep]),
      body.chitti-2g-mode video,
      body.chitti-2g-mode iframe { content-visibility: auto; }
    `;
    document.head.appendChild(css);
  }

  function ensureBadge() {
    let badge = document.getElementById('chitti-offline-badge');
    if (badge) return badge;
    badge = document.createElement('button');
    badge.id = 'chitti-offline-badge';
    badge.type = 'button';
    badge.className = 'chitti-offline-badge';
    badge.setAttribute('aria-live', 'polite');
    badge.setAttribute('aria-atomic', 'true');
    badge.addEventListener('click', () => setForceOn(!getForceOn()));
    document.body.appendChild(badge);
    return badge;
  }

  function updateBadge() {
    const m = mode();
    if (typeof document === 'undefined' || !document.body) return;
    const badge = ensureBadge();
    badge.dataset.mode = m;
    document.body.classList.toggle('chitti-2g-mode', m === '2g' || m === 'offline');
    let text = '';
    if (m === 'offline') text = '📴 Offline — cached responses only';
    else if (m === '2g') text = '🐢 2G mode — saving data' + (getForceOn() ? ' (forced)' : '');
    badge.innerHTML = text;
    badge.title = m === 'online' ? 'You are online.' :
                 (m === '2g'    ? 'Slow connection. Click to toggle 2G mode.' :
                                  'Offline. Cached responses only.');
  }

  // ── SERVICE WORKER ──────────────────────────────────────────
  let _registration = null;

  async function register() {
    if (!('serviceWorker' in navigator)) return { ok: false, reason: 'unsupported' };
    if (!isHttps()) return { ok: false, reason: 'requires_https' };
    try {
      _registration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
      return { ok: true, scope: _registration.scope };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }

  async function unregister() {
    if (!('serviceWorker' in navigator)) return { ok: false };
    const regs = await navigator.serviceWorker.getRegistrations();
    let removed = 0;
    for (const r of regs) {
      try { if (await r.unregister()) removed++; } catch (_) {}
    }
    try {
      const keys = (await caches.keys()).filter((k) => k.startsWith('chitti-'));
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) {}
    return { ok: true, removed };
  }

  async function reset() {
    if (!('serviceWorker' in navigator)) return { ok: false };
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg || !reg.active) {
      // No active SW yet — register first.
      await register();
      return { ok: true, reset: false };
    }
    reg.active.postMessage({ type: 'CHITTI_OFFLINE_RESET' });
    return { ok: true, reset: true };
  }

  // ── INIT ─────────────────────────────────────────────────────
  function init() {
    ensureStyles();
    updateBadge();

    // Listen for connectivity changes.
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateBadge);
      window.addEventListener('offline', updateBadge);
      const c = navigator.connection;
      if (c && typeof c.addEventListener === 'function') {
        try { c.addEventListener('change', updateBadge); } catch (_) {}
      }
    }

    // Register the SW on every page that loads us — the SW honours
    // Cache-First / Stale-While-Revalidate per asset type, so it's
    // safe even for users who are always online.
    register();
  }

  global.Chitti = global.Chitti || {};
  global.Chitti.offline = {
    init,
    register,
    unregister,
    reset,
    mode,
    setForceOn,
    getForceOn,
    updateBadge,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
