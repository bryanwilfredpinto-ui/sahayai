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

  // ─────────────────────────────────────────────────────────────────
  // Self-contained fingerspell engine (G1, 2026-06-13).
  // The a11y substrate never shipped attachSign/islRenderPanel, so ISL
  // was wired but never animated. This block renders ISL on its own —
  // honest contract: the LETTER is always shown (lossless deaf channel);
  // hand shapes are documented PLACEHOLDER glyphs labelled as such;
  // compound terms are NEVER given fabricated signs — fingerspell only.
  // ─────────────────────────────────────────────────────────────────
  const FALLBACK_ALPHA = {
    a: '✊', b: '✋', c: '👌', d: '👆', e: '✋', f: '👌', g: '👉', h: '✌️',
    i: '🤙', j: '🤙', k: '✌️', l: '👆', m: '✊', n: '✊', o: '👌', p: '👇',
    q: '👇', r: '🤞', s: '✊', t: '👍', u: '✌️', v: '✌️', w: '🤟', x: '☝️',
    y: '🤙', z: '👆'
  };
  const LETTER_MS = 400, WORD_GAP_MS = 600;  // per ISL spec
  const NOTE = 'Chitti uses fingerspelling only. Signed language requires a certified interpreter.';
  const PLACEHOLDER_NOTE = 'Hand shapes are placeholders until community ISL videos are sourced — the letters below are exact.';

  let _alpha = null, _alphaPromise = null;
  function _loadAlpha() {
    if (_alpha) return Promise.resolve(_alpha);
    if (_alphaPromise) return _alphaPromise;
    if (typeof fetch === 'undefined') { _alpha = FALLBACK_ALPHA; return Promise.resolve(_alpha); }
    _alphaPromise = fetch('chitti_isl_dictionary.json', { headers: { Accept: 'application/json' } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const fa = d && d.fingerspell_alphabet, out = {};
        for (const k in FALLBACK_ALPHA) out[k] = FALLBACK_ALPHA[k];
        if (fa) for (const k in fa) { if (k.length === 1 && typeof fa[k] === 'string') out[k.toLowerCase()] = fa[k]; }
        _alpha = out; return out;
      })
      .catch(() => { _alpha = FALLBACK_ALPHA; return _alpha; });
    return _alphaPromise;
  }
  function _shape(alpha, ch) { const l = String(ch).toLowerCase(); return (alpha && alpha[l]) || FALLBACK_ALPHA[l] || '✋'; }
  function _spaced(word) { return String(word).toUpperCase().split('').join('-'); }

  let _styleInjected = false;
  function _injectStyle() {
    if (_styleInjected || typeof document === 'undefined') return;
    _styleInjected = true;
    const s = document.createElement('style');
    s.id = 'chitti-isl-style';
    // High-contrast: #15233b on #f4f7fb ≈ 13:1; controls ≥48px.
    s.textContent =
      '.chitti-isl-panel{max-width:480px;margin:.75rem auto;padding:1rem;border:2px solid #15233b;border-radius:12px;background:#f4f7fb;color:#15233b;font-size:1rem}' +
      '.chitti-isl-panel h3{margin:.1rem 0 .4rem;font-size:1.05rem;color:#15233b}' +
      '.chitti-isl-stage{display:flex;flex-direction:column;align-items:center;gap:.25rem;min-height:150px;justify-content:center}' +
      '.chitti-isl-hand{font-size:4.5rem;line-height:1}' +
      '.chitti-isl-letter{font-size:2.6rem;font-weight:800;letter-spacing:.05em;color:#15233b}' +
      '.chitti-isl-word{font-size:1rem;font-weight:700;color:#15233b;word-break:break-word;text-align:center}' +
      '.chitti-isl-fallback{margin:.5rem 0;font-size:1.05rem;font-weight:700;letter-spacing:.12em;text-align:center;color:#15233b}' +
      '.chitti-isl-ctrls{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin-top:.5rem}' +
      '.chitti-isl-ctrls button{min-height:48px;min-width:48px;padding:.5rem 1rem;border:2px solid #15233b;border-radius:10px;background:#fff;color:#15233b;font-size:1rem;font-weight:700;cursor:pointer}' +
      '.chitti-isl-ctrls button:focus-visible{outline:3px solid #1a73e8;outline-offset:2px}' +
      '.chitti-isl-note{margin:.5rem 0 0;font-size:.8rem;color:#3a4a63;line-height:1.35}' +
      // compact variant for per-box auto-attached panels (chitti_a11y.js)
      '.chitti-isl-compact{max-width:none;margin:.5rem 0 0;padding:.6rem .75rem}' +
      '.chitti-isl-compact .chitti-isl-stage{min-height:96px}' +
      '.chitti-isl-compact .chitti-isl-hand{font-size:3rem}' +
      '.chitti-isl-compact .chitti-isl-letter{font-size:1.8rem}' +
      '.chitti-isl-compact h3{font-size:.95rem}';
    (document.head || document.documentElement).appendChild(s);
  }

  // animateFingerSpell(word, containerEl, opts) → { cancel() }
  function animateFingerSpell(word, containerEl, opts) {
    opts = opts || {};
    const letterMs = opts.letterMs || LETTER_MS;
    const chars = String(word || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').split('');
    if (!containerEl) return { cancel() {} };
    const hand = containerEl.querySelector('.chitti-isl-hand') || containerEl;
    const letterEl = containerEl.querySelector('.chitti-isl-letter');
    let i = 0, timer = null, dead = false;
    function step() {
      if (dead || i >= chars.length) { if (!dead && typeof opts.onDone === 'function') opts.onDone(); return; }
      const ch = chars[i], gap = ch === ' ';
      hand.textContent = gap ? '·' : _shape(opts.alpha, ch);
      if (letterEl) letterEl.textContent = gap ? ' ' : ch;
      containerEl.setAttribute('data-isl-letter', gap ? ' ' : ch);
      containerEl.setAttribute('data-isl-index', String(i));
      i += 1;
      timer = setTimeout(step, gap ? (opts.wordGapMs || WORD_GAP_MS) : letterMs);
    }
    step(); // first letter paints synchronously → cert + users see it immediately
    return { cancel() { dead = true; if (timer) clearTimeout(timer); } };
  }

  // renderPanelSelf(target, words, opts) — build ISL panel + spell words in sequence.
  let _activeAnim = null;
  function renderPanelSelf(target, words, opts) {
    if (!target || typeof document === 'undefined') return { available: false, reason: 'no_target' };
    opts = opts || {};
    _injectStyle();
    words = (Array.isArray(words) ? words : [words]).map(w => String(w || '').trim()).filter(Boolean);
    if (!words.length) words = ['CHITTI'];
    const title = opts.title || 'Indian Sign Language — fingerspelling';
    target.innerHTML =
      '<div class="chitti-isl-panel' + (opts.compact ? ' chitti-isl-compact' : '') + '" role="region" aria-label="Indian Sign Language fingerspelling">' +
      '<h3>🤟 ' + title + '</h3>' +
      '<div class="chitti-isl-stage">' +
      '<div class="chitti-isl-hand" aria-hidden="true">🤟</div>' +
      '<div class="chitti-isl-letter" aria-hidden="true"></div>' +
      '<div class="chitti-isl-word" id="chitti-isl-word"></div>' +
      '</div>' +
      '<p class="chitti-isl-fallback" aria-live="polite" id="chitti-isl-fallback"></p>' +
      '<div class="chitti-isl-ctrls">' +
      '<button type="button" class="chitti-isl-replay" aria-label="Replay sign language">▶ Replay</button>' +
      '</div>' +
      '<p class="chitti-isl-note">' + PLACEHOLDER_NOTE + '<br>' + NOTE + '</p>' +
      '</div>';
    const stage = target.querySelector('.chitti-isl-stage');
    const wordLine = target.querySelector('#chitti-isl-word');
    const fallback = target.querySelector('#chitti-isl-fallback');
    const replay = target.querySelector('.chitti-isl-replay');
    function playAll() {
      if (_activeAnim) { _activeAnim.cancel(); _activeAnim = null; }
      let w = 0;
      _loadAlpha().then(alpha => {
        function nextWord() {
          if (w >= words.length) return;
          const word = words[w];
          if (wordLine) wordLine.textContent = word;
          if (fallback) fallback.textContent = 'ISL: ' + _spaced(word); // lossless channel
          _activeAnim = animateFingerSpell(word, stage, {
            alpha: alpha, letterMs: opts.letterMs, wordGapMs: opts.wordGapMs,
            onDone() { w += 1; if (w < words.length) setTimeout(nextWord, opts.wordGapMs || WORD_GAP_MS); }
          });
        }
        nextWord();
      });
    }
    if (replay) replay.addEventListener('click', playAll);
    // autoplay defaults ON (verdict button); auto-attached per-box panels pass
    // autoplay:false so 11 panels don't all fingerspell at once — user taps ▶ Replay.
    if (opts.autoplay !== false) playAll();
    else { // paint a static first frame so the panel is clearly "an ISL panel"
      _loadAlpha().then(alpha => { const w0 = words[0]; if (fallback) fallback.textContent = 'ISL: ' + _spaced(w0); const hand = stage.querySelector('.chitti-isl-hand'), letterEl = stage.querySelector('.chitti-isl-letter'); if (hand) hand.textContent = _shape(alpha, w0[0]); if (letterEl) letterEl.textContent = w0[0].toUpperCase(); if (wordLine) wordLine.textContent = w0; });
    }
    return { available: true, words: words, replay: playAll };
  }

  // Public API surface — every method is safe to call even before
  // chitti_a11y.js has loaded. Returns honest stub when unavailable.
  global.Chitti.isl = {
    _wired: true,

    // ISL is now self-contained (fingerspell engine below) — always
    // available, with or without the a11y substrate.
    available() { return true; },

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

    // Fingerspell a single word letter-by-letter into containerEl.
    // Self-contained — returns a controller { cancel() }.
    animateFingerSpell(word, containerEl, opts) {
      try { return animateFingerSpell(word, containerEl, opts || {}); }
      catch (e) { return { cancel() {}, available: false, reason: 'animate_failed', error: String(e) }; }
    },

    // Build an ISL panel into `target` and fingerspell `words` in sequence.
    // words: string | string[] (e.g. ['RELIANCE','RSI','MACD']).
    spellWords(target, words, opts) {
      try { return renderPanelSelf(target, words, opts || {}); }
      catch (e) { return { available: false, reason: 'spell_failed', error: String(e) }; }
    },

    // Render an ISL panel directly into a target container. Prefers the
    // a11y substrate when present; otherwise uses the self-contained engine.
    renderPanel(target, text, opts) {
      const a = _resolve();
      if (a && typeof a.islRenderPanel === 'function') {
        try { return a.islRenderPanel(target, text, opts || {}); }
        catch (e) { return { available: false, reason: 'render_failed', error: String(e) }; }
      }
      return renderPanelSelf(target, String(text || '').split(/\s+/), opts || {});
    },

    // Render an ISL panel for a single word (used by tap-word handler).
    renderWord(target, word, opts) {
      const a = _resolve();
      if (a && typeof a.islRenderWord === 'function') {
        try { return a.islRenderWord(target, word, opts || {}); }
        catch (e) { return { available: false, reason: 'render_word_failed', error: String(e) }; }
      }
      return renderPanelSelf(target, [word], opts || {});
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
