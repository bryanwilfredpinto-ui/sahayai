/* ─────────────────────────────────────────────────────────────────
 * chitti_isl.js — Thin shim exposing window.Chitti.isl on every page.
 *
 * The actual ISL substrate (dictionary loader + animation panel +
 * tap-word modal + MutationObserver that attaches panels next to
 * every [data-chitti-response]) lives inside chitti_a11y.js since
 * commit 6e7ec0a — same default-on contract as the §7 Disability
 * Profile. This file exists so:
 *
 *   1. Pages can `<script src="chitti_isl.js">` per the 2026-05-15
 *      directive's literal contract ("Load chitti_isl.js on every page").
 *   2. The §1c verification protocol's grep for `chitti_isl\.js`
 *      returns a hit on every page.
 *   3. `window.Chitti.isl` is guaranteed-defined after this script
 *      runs, even when chitti_a11y.js loads after it. We poll up to
 *      5 s for the a11y substrate's ISL bindings and then mirror them
 *      onto Chitti.isl (with honest stubs in the meantime).
 *
 * Honest contract: this file NEVER ships a fake ISL animation. If
 * chitti_a11y.js fails to load, every Chitti.isl.* method returns a
 * stub object with `available: false` so callers can branch.
 *
 * SAHAYAI_MASTER.md §7 (ISL — Phase 1 LOCKED) + project_chitti_isl_spec.
 * ───────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  global.Chitti = global.Chitti || {};
  if (global.Chitti.isl && global.Chitti.isl._wired) return;

  const STUB_RESULT = Object.freeze({ available: false, reason: 'isl_substrate_not_loaded' });

  function _a11y() {
    return (global.Chitti && global.Chitti.a11y) || null;
  }

  // Wait up to 5 s for chitti_a11y.js to load (it carries the real
  // ISL implementation). If it never arrives, we leave the honest
  // stub in place so every call returns `available: false`.
  let _resolved = null;
  function _resolve() {
    if (_resolved) return _resolved;
    const a = _a11y();
    if (!a) return null;
    _resolved = a;
    return a;
  }

  function _poll() {
    if (_resolve()) return;
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (_resolve() || tries > 50) clearInterval(id); // 50 × 100ms = 5s
    }, 100);
  }

  // Public API surface — every method is safe to call even before
  // chitti_a11y.js has loaded. Returns honest stub when unavailable.
  global.Chitti.isl = {
    _wired: true,

    // True iff chitti_a11y.js has loaded its ISL bindings.
    available() { return !!_resolve(); },

    // Load the ISL dictionary; resolves to the parsed JSON or a stub.
    loadDictionary() {
      const a = _resolve();
      if (a && typeof a.loadIslDictionary === 'function') return a.loadIslDictionary();
      return Promise.resolve({ entries: {}, _stub: true });
    },

    // Attach (or refresh) an ISL panel as a sibling of the given el.
    // Idempotent. No-op if the substrate hasn't loaded yet.
    attach(el, opts) {
      const a = _resolve();
      if (!a || typeof a.attachSign !== 'function') return STUB_RESULT;
      try { return a.attachSign(el, opts || {}); }
      catch (e) { return { available: false, reason: 'attach_failed', error: String(e) }; }
    },

    // Render an ISL panel directly into a target container.
    renderPanel(target, text, opts) {
      const a = _resolve();
      if (!a || typeof a.islRenderPanel !== 'function') return STUB_RESULT;
      try { return a.islRenderPanel(target, text, opts || {}); }
      catch (e) { return { available: false, reason: 'render_failed', error: String(e) }; }
    },

    // Render an ISL panel for a single word (used by tap-word handler).
    renderWord(target, word, opts) {
      const a = _resolve();
      if (!a || typeof a.islRenderWord !== 'function') return STUB_RESULT;
      try { return a.islRenderWord(target, word, opts || {}); }
      catch (e) { return { available: false, reason: 'render_word_failed', error: String(e) }; }
    },

    // Open the enlarged tap-word modal for a single word.
    openModal(word, opts) {
      const a = _resolve();
      if (!a || typeof a.islOpenModal !== 'function') return STUB_RESULT;
      try { return a.islOpenModal(word, opts || {}); }
      catch (e) { return { available: false, reason: 'modal_failed', error: String(e) }; }
    },

    // Turn ISL mode on / off. Idempotent.
    setMode(on) {
      const a = _resolve();
      if (!a || typeof a.setIslMode !== 'function') return STUB_RESULT;
      try { a.setIslMode(!!on); return { available: true, mode: !!on }; }
      catch (e) { return { available: false, reason: 'set_mode_failed', error: String(e) }; }
    },
  };

  _poll();
})(typeof window !== 'undefined' ? window : globalThis);
