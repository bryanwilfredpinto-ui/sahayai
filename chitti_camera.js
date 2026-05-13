/**
 * CHITTI CAMERA — shared camera-capture + intelligence substrate
 *
 * LOCKED 2026-05-13 by SAHAYAI_MASTER §2b "Camera Intelligence Across
 * All Chittis". Every Chitti that has camera access captures the same
 * envelope and posts it to ONE endpoint (`/api/camera/capture`). Pages
 * never hand-roll camera capture or storage.
 *
 * Capture envelope (per §2b):
 *   - what:              short label of what was scanned (e.g. "medicine strip", "FSSAI label")
 *   - product:           which Chitti captured it ("medupi" / "scanner" / "kirana" / …)
 *   - location:          { pincode, district } — derived from Chitti.location
 *   - captured_at:       ISO timestamp
 *   - result:            "fake" | "genuine" | "expired" | "safe" | "unclear"
 *                        (NEVER coerced — `unclear` is its own state, §2b honest empty state)
 *   - user_type:         disability profile + role hint (consumer / shopkeeper / elderly)
 *   - user_satisfaction: 👍 / 👎 from feedback-widget, attached lazily
 *   - user_token:        per-device UUID (the existing per-Chitti user_token)
 *
 * Flywheels (no client work — server-side, but listed here so callers
 * understand WHY we capture):
 *   1. Community alert: "3 users near you found fake products this week."
 *   2. Annual FSSAI / regulator report (anonymised, district-level).
 *   3. Real-time warnings to nearby users.
 *
 * User-ownership contract (§2b):
 *   - Owned by user, never sold, anonymised before analysis.
 *   - "Chitti forget" wipes every capture for the user_token + writes a
 *     tombstone row so aggregates stay honest.
 *
 * Implementation notes:
 *   - Honest stub when /api/camera/capture is not configured (no
 *     CHITTI_CAMERA_API set, fetch fails, etc.): captures are queued
 *     in localStorage and re-tried on next page load. Matches the
 *     §3 "Honest stubs over fake demos" rule.
 *   - Single endpoint, all Chittis. Routing by `product` field.
 *   - Camera DB is per-Chitti (Turso, §2 one-DB-per-Chitti) with a
 *     thin cross-product index — backend concern, not this file.
 *
 * Public API (window.Chitti.camera):
 *   - capture(payload)        async — POST one capture, queue on fail
 *   - flush()                 async — re-post all queued captures
 *   - forget()                async — POST a forget-all tombstone
 *   - tagSatisfaction(id, v)  async — late-bind 👍/👎 to a capture
 *   - getApiBase()            string — current endpoint base
 *   - VALID_RESULTS           array  — honest result vocabulary
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'chitti_camera_queue_v1';
  const A11Y_KEY = 'chitti_a11y_v1';
  const USER_TOKEN_KEY = 'chitti_user_token_v1';

  // Honest result vocabulary — `unclear` is a first-class state, NOT
  // a fallback for "fake" or "safe". §2b: "if the model isn't confident
  // enough to flag fake/genuine, the result field is `unclear` — never
  // silently coerced to safe."
  const VALID_RESULTS = ['fake', 'genuine', 'expired', 'safe', 'unclear', 'cancelled'];

  function getApiBase() {
    // Override path mirrors window.CHITTI_FEEDBACK_API (used by the
    // feedback widget). Default: relative to the page, so when the page
    // is served from sahayai.in (GitHub Pages) the call goes to
    // /api/camera/capture on the same origin's API gateway — or, if no
    // gateway is configured, the fetch fails and we queue locally.
    return (global.CHITTI_CAMERA_API || '').replace(/\/$/, '');
  }

  function getUserToken() {
    try {
      let t = localStorage.getItem(USER_TOKEN_KEY);
      if (t && t.length >= 8) return t;
      // Match the per-device UUID pattern used by Vaani / MedUPI etc.
      t = (global.crypto && crypto.randomUUID && crypto.randomUUID()) ||
          ('cam-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
      localStorage.setItem(USER_TOKEN_KEY, t);
      return t;
    } catch (_) {
      return 'cam-anon-' + Date.now().toString(36);
    }
  }

  function loadA11yState() {
    try { return JSON.parse(localStorage.getItem(A11Y_KEY)) || {}; }
    catch (_) { return {}; }
  }

  function disabilityHint() {
    const p = (loadA11yState() || {}).profile || {};
    // Pick the strongest accessibility signal; "consumer" is the safe
    // default. user_type carries semantic role + a11y hint together so
    // the camera DB can slice the data without re-joining tables.
    if (p.blind)     return 'consumer/blind';
    if (p.deaf)      return 'consumer/deaf';
    if (p.elderly)   return 'consumer/elderly';
    if (p.cognitive) return 'consumer/cognitive';
    if (p.rural)     return 'consumer/rural';
    return 'consumer';
  }

  async function readLocation() {
    // Defer to Chitti.location (added by chitti_a11y.js) when present —
    // never trigger a permission prompt from here. The page that owns
    // the camera flow is responsible for asking for location at the
    // right moment; we just attach whatever's already cached.
    if (global.Chitti && global.Chitti.location && typeof global.Chitti.location.get === 'function') {
      try {
        const loc = await global.Chitti.location.get({ prompt: false });
        if (loc) return { pincode: loc.pincode || '', district: loc.district || '' };
      } catch (_) {}
    }
    return { pincode: '', district: '' };
  }

  // ── Local queue (resilient under offline / no-API) ──────────────
  function queueLoad() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (_) { return []; }
  }
  function queueSave(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-200))); }
    catch (_) {}
  }
  function queuePush(payload) {
    const q = queueLoad();
    q.push(payload);
    queueSave(q);
  }
  function queueRemove(id) {
    const q = queueLoad().filter((p) => p._client_id !== id);
    queueSave(q);
  }

  // ── Public: capture ────────────────────────────────────────────
  function _coerceResult(r) {
    const s = String(r || '').toLowerCase().trim();
    if (VALID_RESULTS.indexOf(s) >= 0) return s;
    // §2b honest empty state — refuse to coerce. `unclear` is the
    // explicit "we don't know yet" state. Pages must pass a real
    // result; this default exists only so the JS contract doesn't
    // throw on a partial payload.
    return 'unclear';
  }

  async function capture(payload) {
    payload = payload || {};
    const loc = payload.location || await readLocation();
    const env = {
      _client_id: 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10),
      what: String(payload.what || '').slice(0, 120),
      product: String(payload.product || 'unknown').toLowerCase().slice(0, 32),
      location: { pincode: loc.pincode || '', district: loc.district || '' },
      captured_at: new Date().toISOString(),
      result: _coerceResult(payload.result),
      result_detail: String(payload.result_detail || '').slice(0, 240),
      user_type: payload.user_type || disabilityHint(),
      user_satisfaction: payload.user_satisfaction || null,
      user_token: getUserToken(),
      meta: payload.meta || {},
      // Image is NEVER uploaded by default — only metadata. Pages can
      // opt in by setting payload.image_b64; the server-side anonymiser
      // (§2b) is what decides what to keep.
      image_b64: payload.image_b64 || null,
    };

    const base = getApiBase();
    if (!base) {
      // No endpoint configured → honest stub: queue locally + log.
      queuePush(env);
      try { console.info('[chitti-camera] queued (no API base):', env._client_id, env.what, env.result); }
      catch (_) {}
      return { ok: true, queued: true, client_id: env._client_id };
    }

    try {
      const r = await fetch(base + '/api/camera/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(env),
      });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json().catch(() => ({}));
      return Object.assign({ ok: true, queued: false, client_id: env._client_id }, j);
    } catch (e) {
      queuePush(env);
      try { console.warn('[chitti-camera] capture queued after failure:', e); } catch (_) {}
      return { ok: true, queued: true, client_id: env._client_id, error: String(e && e.message || e) };
    }
  }

  // Drain the offline queue. Returns counts.
  async function flush() {
    const base = getApiBase();
    if (!base) return { ok: false, reason: 'no_api_base', queued: queueLoad().length };
    const q = queueLoad();
    if (!q.length) return { ok: true, sent: 0, queued: 0 };
    let sent = 0, failed = 0;
    for (const env of q.slice()) {
      try {
        const r = await fetch(base + '/api/camera/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(env),
        });
        if (!r.ok) throw new Error('http ' + r.status);
        queueRemove(env._client_id);
        sent++;
      } catch (_) { failed++; break; }            // stop on first failure
    }
    return { ok: failed === 0, sent, queued: queueLoad().length };
  }

  // §2b — `Chitti forget` deletes all captures for this user_token.
  // Server replaces them with a tombstone so counts stay honest.
  async function forget() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    const base = getApiBase();
    if (!base) return { ok: true, queued_cleared: true, server: 'no_api_base' };
    try {
      const r = await fetch(base + '/api/camera/forget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: getUserToken() }),
      });
      const j = await r.json().catch(() => ({}));
      return Object.assign({ ok: r.ok, queued_cleared: true }, j);
    } catch (e) {
      return { ok: false, error: String(e && e.message || e), queued_cleared: true };
    }
  }

  // Late-bind a 👍 / 👎 to a capture — wired from feedback-widget so the
  // signal travels with the same envelope, not a separate analytics
  // stream. Server keys by (user_token, server_capture_id).
  async function tagSatisfaction(captureId, vote) {
    if (!captureId) return { ok: false, error: 'missing capture id' };
    const base = getApiBase();
    if (!base) return { ok: false, error: 'no_api_base' };
    try {
      const r = await fetch(base + '/api/camera/satisfaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_token: getUserToken(),
          capture_id: captureId,
          vote: vote === 'up' || vote === '👍' || vote === 1 ? 'up'
              : vote === 'down' || vote === '👎' || vote === -1 ? 'down'
              : null,
        }),
      });
      return await r.json().catch(() => ({ ok: r.ok }));
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    // Best-effort flush on page load — drains any captures that piled up
    // while the API was unreachable. Silent: if no base is configured we
    // do nothing rather than spamming the console.
    if (getApiBase()) {
      try { flush(); } catch (_) {}
    }
  }

  global.Chitti = global.Chitti || {};
  global.Chitti.camera = {
    capture,
    flush,
    forget,
    tagSatisfaction,
    getApiBase,
    VALID_RESULTS,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
